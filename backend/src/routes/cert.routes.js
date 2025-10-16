import express from 'express';
import { z, ZodError} from 'zod';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES, User } from '../models/User.js';
import { Certificate } from '../models/Certificate.js';
import { generateQrDataUrl, generateCertificateQr, generateStudentHash } from '../services/qr.js';
import { verifyOnChain, issueOnChain, revokeCertificateOnChain } from '../services/blockchain.js';
import { pinJSON } from '../services/ipfs.js';
import { sendCertificateEmail } from '../services/email.js';
import PDFDocument from 'pdfkit';

const router = express.Router();

// Test endpoint to check email configuration (public endpoint)
router.get('/test-email-config', (req, res) => {
  console.log('🔍 Email config endpoint called');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
  
  const emailConfig = {
    EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
    EMAIL_PASS: process.env.EMAIL_PASS ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    hasCredentials: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
  };
  
  res.json({
    message: 'Email configuration check',
    config: emailConfig,
    timestamp: new Date().toISOString()
  });
});

const issueSchema = z.object({
  certificateId: z.string().min(6),
  recipientName: z.string().min(2),
  recipientEmail: z.string().email().optional(),
  courseName: z.string().min(2),
  issuedOn: z.preprocess(
    (val) => {
      if (!val) return new Date(); // default to "now" if missing
      if (typeof val === "string" || typeof val === "number") {
        return new Date(val);
      }
      return val;
    },
    z.date()
  ),
  validUntil: z.preprocess(
    (val) => {
      if (!val || val === '') return undefined; // no expiration if not provided
      if (typeof val === "string" || typeof val === "number") {
        return new Date(val);
      }
      return val;
    },
    z.date().optional()
  ),
  metadata: z.record(z.any()).optional(),
});

router.post('/issue', authenticate, authorize(USER_ROLES.ISSUER, USER_ROLES.ADMIN), async (req, res, next) => {
  try {
    // issuer must be approved
    if (req.currentUser.role === USER_ROLES.ISSUER && req.currentUser.approvalStatus !== 'approved') {
      return res.status(403).json({ message: 'Issuer not approved' });
    }
    
    // Check if user has linked a wallet (optional for now, but recommended)
    if (!req.currentUser.walletAddress) {
      console.log('⚠️ User issuing certificate without linked wallet address');
    }
    const input = issueSchema.parse(req.body);
    const verificationToken = crypto.randomUUID();
    const exists = await Certificate.findOne({ certificateId: input.certificateId });
    if (exists) return res.status(409).json({ message: 'Certificate ID already exists' });
    let pinned = { cid: null, url: null };
    try {
      pinned = await pinJSON(`cert-${input.certificateId}`, {
        certificateId: input.certificateId,
        recipientName: input.recipientName,
        courseName: input.courseName,
        issuedOn: input.issuedOn,
        metadata: input.metadata || {},
      });
    } catch(e) {
      console.error("IPFS pin failed:", e.message);
    }

    const cert = await Certificate.create({
      ...input,
      issuer: req.currentUser._id,
      verificationToken,
      metadata: { ...(input.metadata || {}), ipfs: pinned },
      ipfsHash: pinned.cid,
    });

    // Record on chain (optional). Store tx hash if success
    let blockchainResult = null;
    
    // Check if MetaMask is being used (frontend handles blockchain)
    if (input.useMetaMask && input.blockchainTxHash) {
      console.log('🦊 Using MetaMask transaction hash from frontend:', input.blockchainTxHash);
      cert.blockchainTxHash = input.blockchainTxHash;
      // Note: Block number and gas used not available from frontend MetaMask
      await cert.save();
    } else {
      // Backend handles blockchain transaction
      const validUntilTimestamp = input.validUntil ? Math.floor(new Date(input.validUntil).getTime() / 1000) : 0;
      
      // Debug: Log the parameters being sent to blockchain
      console.log('🔍 Blockchain call parameters:');
      console.log('  Recipient Name:', input.recipientName);
      console.log('  Course Name:', input.courseName);
      console.log('  Valid Until (timestamp):', validUntilTimestamp);
      console.log('  Valid Until (date):', input.validUntil ? new Date(input.validUntil).toISOString() : 'N/A');
      console.log('  IPFS Hash:', pinned.cid || 'EMPTY');
      console.log('  IPFS Pinning Success:', !!pinned.cid);
      
      blockchainResult = await issueOnChain(input.recipientName, input.courseName, validUntilTimestamp, pinned.cid || '');
      if (blockchainResult) {
        cert.blockchainTxHash = blockchainResult.hash;
        cert.blockchainBlockNumber = blockchainResult.blockNumber;
        cert.blockchainGasUsed = blockchainResult.gasUsed;
        await cert.save();
      }
    }

    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:4000';
    const verifyUrl = `${baseUrl}/api/cert/verify?token=${verificationToken}`;
    
    // Generate enhanced QR with hash data
    const qr = await generateCertificateQr(cert, verificationToken, baseUrl);
    
    // Generate student hash for additional verification
    const studentHash = generateStudentHash(input);
    
    // Update certificate with student hash
    cert.studentHash = studentHash;
    await cert.save();

    if (input.recipientEmail) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">🎓 Certificate Issued Successfully!</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">Certificate Details</h3>
            <p><strong>Recipient:</strong> ${input.recipientName}</p>
            <p><strong>Course:</strong> ${input.courseName}</p>
            <p><strong>Certificate ID:</strong> ${input.certificateId}</p>
            <p><strong>Issued On:</strong> ${new Date(input.issuedOn).toLocaleDateString()}</p>
            ${input.validUntil ? `<p><strong>Valid Until:</strong> ${new Date(input.validUntil).toLocaleDateString()}</p>` : ''}
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1976d2; margin-top: 0;">🔐 Certificate Hash (for verification)</h4>
            <p style="font-family: monospace; background: #fff; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
              ${studentHash}
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h4 style="color: #495057; margin-top: 0;">📱 QR Code for Verification</h4>
            <p style="color: #6c757d; margin-bottom: 15px;">Scan this QR code with any QR scanner (Google Lens, camera app, etc.) to verify the certificate:</p>
            <img src="${qr}" alt="Certificate QR Code" style="max-width: 200px; height: auto; border: 2px solid #dee2e6; border-radius: 8px;">
            <p style="color: #6c757d; font-size: 12px; margin-top: 10px;">Or click the button below to verify online</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              🔍 Verify Certificate Online
            </a>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              <strong>Note:</strong> This certificate is secured on the blockchain and can be verified by:<br>
              • Scanning the QR code with any QR scanner (Google Lens, camera app, etc.)<br>
              • Using the verification link above<br>
              • Using the certificate hash for manual verification
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          <p style="color: #6c757d; font-size: 12px; text-align: center;">
            This is an automated message from CertVerify System
          </p>
        </div>
      `;
      
      sendCertificateEmail(
        input.recipientEmail,
        `🎓 Your ${input.courseName} Certificate is Ready!`,
        emailHtml
      ).catch((error) => {
        console.error('Failed to send email:', error.message);
      });
    }

    res.status(201).json({ 
      certificate: cert, 
      qr, 
      verifyUrl, 
      studentHash,
      ipfsHash: pinned.cid,
      blockchainTxHash: blockchainResult?.hash,
      blockchainBlockNumber: blockchainResult?.blockNumber,
      blockchainGasUsed: blockchainResult?.gasUsed
    });
  } catch (err) {
    if (err instanceof ZodError) {
        console.error("Validation error:", err.issues);
        return res.status(400).json({ message: 'Invalid input', issues: err.issues });
      }
      next(err);
  }
});



router.get('/verify', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Missing token' });
    const cert = await Certificate.findOne({ verificationToken: token });
    if (!cert) return res.status(404).json({ message: 'Invalid token' });
    
    // Check if certificate was issued on blockchain (has tx hash)
    const wasIssuedOnChain = !!cert.blockchainTxHash;
    
    // Try blockchain verification, but don't fail if blockchain is unavailable
    let onChainValid = false;
    try {
      onChainValid = await verifyOnChain(cert.certificateId);
    } catch (blockchainError) {
      console.warn('Blockchain verification failed, but certificate was issued on chain:', blockchainError.message);
      // If certificate was issued on blockchain but we can't verify now, consider it valid
      onChainValid = wasIssuedOnChain;
    }
    
    // Certificate is valid if:
    // 1. Database status is 'valid' AND
    // 2. Either blockchain verification passes OR certificate was issued on blockchain (even if we can't verify now)
    // 3. For development, allow certificates without blockchain verification
    const isValid = cert.status === 'valid' && (onChainValid || wasIssuedOnChain || process.env.NODE_ENV === 'development');
    
    res.json({ 
      isValid, 
      certificate: cert,
      blockchainVerification: onChainValid,
      wasIssuedOnChain,
      ipfsHash: cert.ipfsHash || cert.metadata?.ipfs?.cid || null
    });
  } catch (err) {
    next(err);
  }
});

router.get('/verify/by-id/:certificateId', async (req, res, next) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId });
    if (!cert) return res.status(404).json({ isValid: false, message: 'Not found' });
    
    // Check if certificate was issued on blockchain (has tx hash)
    const wasIssuedOnChain = !!cert.blockchainTxHash;
    
    // Try blockchain verification, but don't fail if blockchain is unavailable
    let onChainValid = false;
    try {
      onChainValid = await verifyOnChain(cert.certificateId);
    } catch (blockchainError) {
      console.warn('Blockchain verification failed, but certificate was issued on chain:', blockchainError.message);
      // If certificate was issued on blockchain but we can't verify now, consider it valid
      onChainValid = wasIssuedOnChain;
    }
    
    // Certificate is valid if:
    // 1. Database status is 'valid' AND
    // 2. Either blockchain verification passes OR certificate was issued on blockchain (even if we can't verify now)
    // 3. For development, allow certificates without blockchain verification
    const isValid = cert.status === 'valid' && (onChainValid || wasIssuedOnChain || process.env.NODE_ENV === 'development');
    
    res.json({ 
      isValid, 
      certificate: cert,
      blockchainVerification: onChainValid,
      wasIssuedOnChain,
      ipfsHash: cert.ipfsHash || cert.metadata?.ipfs?.cid || null
    });
  } catch (err) {
    next(err);
  }
});

// New endpoint for hash verification
router.post('/verify/hash', async (req, res, next) => {
  try {
    const { certificateId, providedHash } = req.body;
    if (!certificateId || !providedHash) {
      return res.status(400).json({ message: 'Certificate ID and hash are required' });
    }
    
    const cert = await Certificate.findOne({ certificateId });
    if (!cert) return res.status(404).json({ isValid: false, message: 'Certificate not found' });
    
    const storedHash = cert.metadata?.ipfs?.cid;
    const hashMatch = storedHash === providedHash;
    const onChainValid = await verifyOnChain(cert.certificateId);
    const isValid = cert.status === 'valid' && (onChainValid || process.env.NODE_ENV === 'development') && hashMatch;
    
    res.json({ 
      isValid, 
      hashMatch,
      onChainValid,
      certificate: cert,
      storedHash,
      providedHash
    });
  } catch (err) {
    next(err);
  }
});

// New endpoint for QR data verification
router.post('/verify/qr', async (req, res, next) => {
  try {
    const { qrData } = req.body;
    if (!qrData) {
      return res.status(400).json({ message: 'QR data is required' });
    }
    
    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid QR data format' });
    }
    
    if (parsedData.type === 'certificate') {
      const cert = await Certificate.findOne({ certificateId: parsedData.certificateId });
      if (!cert) return res.status(404).json({ isValid: false, message: 'Certificate not found' });
      
      const hashMatch = cert.metadata?.ipfs?.cid === parsedData.hash;
      const onChainValid = await verifyOnChain(cert.certificateId);
      const isValid = cert.status === 'valid' && (onChainValid || process.env.NODE_ENV === 'development') && hashMatch;
      
      res.json({ 
        isValid, 
        hashMatch,
        onChainValid,
        certificate: cert,
        qrData: parsedData
      });
    } else {
      res.status(400).json({ message: 'Unsupported QR type' });
    }
  } catch (err) {
    next(err);
  }
});

// Get all certificates issued by the current issuer
router.get('/issuer-certificates', authenticate, authorize(USER_ROLES.ISSUER, USER_ROLES.ADMIN), async (req, res, next) => {
  try {
    // Use _id from the database user object
    const certificates = await Certificate.find({ issuer: req.currentUser._id })
      .sort({ createdAt: -1 })
      .populate('issuer', 'name email organization');
    
    res.json({ certificates });
  } catch (err) {
    next(err);
  }
});

// Revoke a certificate
router.post('/revoke/:certificateId', authenticate, authorize(USER_ROLES.ISSUER, USER_ROLES.ADMIN), async (req, res, next) => {
  try {
    const { reason } = req.body;
    const certificateId = req.params.certificateId;
    
    const cert = await Certificate.findOne({ 
      certificateId,
      issuer: req.currentUser._id 
    });
    
    if (!cert) {
      return res.status(404).json({ message: 'Certificate not found or not authorized' });
    }
    
    if (cert.status === 'revoked') {
      return res.status(400).json({ message: 'Certificate already revoked' });
    }
    
    // Update database status
    cert.status = 'revoked';
    cert.revokeReason = reason || 'No reason provided';
    await cert.save();
    
    // Revoke on blockchain
    const txHash = await revokeCertificateOnChain(certificateId, reason);
    if (txHash) {
      cert.blockchainRevokeTxHash = txHash;
      await cert.save();
    }
    
    res.json({ 
      message: 'Certificate revoked successfully',
      certificate: cert 
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:certificateId', authenticate, async (req, res, next) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId }).populate('issuer', 'name email organization role');
    if (!cert) return res.status(404).json({ message: 'Not found' });
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:4000';
    const verifyUrl = `${baseUrl}/api/cert/verify?token=${cert.verificationToken}`;
    const qr = await generateCertificateQr(cert, cert.verificationToken, baseUrl);
    res.json({ certificate: cert, qr, verifyUrl });
  } catch (err) {
    next(err);
  }
});
router.get('/download/:certificateId', async (req, res, next) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId }).populate('issuer', 'name organization');
    if (!cert) return res.status(404).json({ message: 'Not found' });
    const onChainValid = await verifyOnChain(cert.certificateId);
    const isValid = cert.status === 'valid' && (onChainValid || process.env.NODE_ENV === 'development');

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${cert.certificateId}.pdf"`);
    doc.pipe(res);
    doc.fontSize(22).text('Certificate of Completion', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Recipient: ${cert.recipientName}`);
    doc.text(`Course: ${cert.courseName}`);
    doc.text(`Issued On: ${new Date(cert.issuedOn).toDateString()}`);
    doc.text(`Certificate ID: ${cert.certificateId}`);
    doc.text(`Issuer: ${cert.issuer?.name || ''} (${cert.issuer?.organization || ''})`);
    doc.moveDown();
    doc.text(`Status: ${isValid ? 'VALID' : 'INVALID'}`);
    doc.end();
  } catch (err) {
    next(err);
  }
});

// Get contract ABI for frontend
router.get('/contract/abi', async (req, res, next) => {
  try {
    const abiPath = './abi/Certificate.json';
    const abi = JSON.parse(fs.readFileSync(abiPath, 'utf-8')).abi || JSON.parse(fs.readFileSync(abiPath, 'utf-8'));
    res.json(abi);
  } catch (error) {
    console.error('Error loading contract ABI:', error);
    res.status(500).json({ message: 'Failed to load contract ABI' });
  }
});

// Link wallet address to user account
router.post('/link-wallet', authenticate, async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ message: 'Wallet address is required' });
    }
    
    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ message: 'Invalid wallet address format' });
    }
    
    // Check if wallet is already linked to another user
    const existingUser = await User.findOne({ walletAddress });
    if (existingUser && existingUser._id.toString() !== req.user.id) {
      return res.status(400).json({ message: 'Wallet address is already linked to another account' });
    }
    
    // Update user with wallet address
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { walletAddress },
      { new: true }
    );
    
    res.json({ 
      message: 'Wallet linked successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress
      }
    });
  } catch (error) {
    console.error('Error linking wallet:', error);
    res.status(500).json({ message: 'Failed to link wallet' });
  }
});

// Unlink wallet address from user account
router.delete('/unlink-wallet', authenticate, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $unset: { walletAddress: 1 } },
      { new: true }
    );
    
    res.json({ 
      message: 'Wallet unlinked successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress
      }
    });
  } catch (error) {
    console.error('Error unlinking wallet:', error);
    res.status(500).json({ message: 'Failed to unlink wallet' });
  }
});

// Get user's wallet status
router.get('/wallet-status', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      hasWallet: !!user.walletAddress,
      walletAddress: user.walletAddress,
      canIssue: user.canIssue()
    });
  } catch (error) {
    console.error('Error getting wallet status:', error);
    res.status(500).json({ message: 'Failed to get wallet status' });
  }
});

export default router;


