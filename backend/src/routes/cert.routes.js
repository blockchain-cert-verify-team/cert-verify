import express from 'express';
import { z, ZodError} from 'zod';
import crypto from 'crypto';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES, User } from '../models/User.js';
import { Certificate } from '../models/Certificate.js';
import { generateQrDataUrl, generateCertificateQr, generateStudentHash } from '../services/qr.js';
import { verifyOnChain, issueOnChain } from '../services/blockchain.js';
import { pinJSON } from '../services/ipfs.js';
import { sendCertificateEmail } from '../services/email.js';
import PDFDocument from 'pdfkit';

const router = express.Router();

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
  metadata: z.record(z.any()).optional(),
});

router.post('/issue', authenticate, authorize(USER_ROLES.ISSUER, USER_ROLES.ADMIN), async (req, res, next) => {
  try {
    // issuer must be approved
    if (req.currentUser.role === USER_ROLES.ISSUER && req.currentUser.approvalStatus !== 'approved') {
      return res.status(403).json({ message: 'Issuer not approved' });
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
    const txHash = await issueOnChain(input.recipientName, input.courseName, input.validUntil || 0, pinned.cid || '');
    if (txHash) {
      cert.blockchainTxHash = txHash;
      await cert.save();
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
      sendCertificateEmail(
        input.recipientEmail,
        'Your certificate is issued',
        `<p>Hi ${input.recipientName},</p>
         <p>Your certificate for <b>${input.courseName}</b> has been issued.</p>
         <p>Verify: <a href="${verifyUrl}">${verifyUrl}</a></p>`
      ).catch(() => null);
    }

    res.status(201).json({ 
      certificate: cert, 
      qr, 
      verifyUrl, 
      studentHash,
      ipfsHash: pinned.cid,
      blockchainTxHash: txHash
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
    const onChainValid = await verifyOnChain(cert.certificateId);
    const isValid = cert.status === 'valid' && onChainValid;
    res.json({ isValid, certificate: cert });
  } catch (err) {
    next(err);
  }
});

router.get('/verify/by-id/:certificateId', async (req, res, next) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.certificateId });
    if (!cert) return res.status(404).json({ isValid: false, message: 'Not found' });
    const onChainValid = await verifyOnChain(cert.certificateId);
    const isValid = cert.status === 'valid' && onChainValid;
    res.json({ isValid, certificate: cert });
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
    const isValid = cert.status === 'valid' && onChainValid && hashMatch;
    
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
      const isValid = cert.status === 'valid' && onChainValid && hashMatch;
      
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
    const isValid = cert.status === 'valid' && onChainValid;

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

export default router;


