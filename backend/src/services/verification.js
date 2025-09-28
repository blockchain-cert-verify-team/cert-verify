import crypto from 'crypto';
import { Certificate } from '../models/Certificate.js';
import { verifyOnChain } from './blockchain.js';

export async function verifyCertificateHash(certificateId, providedHash) {
  try {
    const cert = await Certificate.findOne({ certificateId });
    if (!cert) {
      return { isValid: false, error: 'Certificate not found' };
    }
    
    const storedHash = cert.metadata?.ipfs?.cid;
    const hashMatch = storedHash === providedHash;
    
    return {
      isValid: hashMatch,
      hashMatch,
      storedHash,
      providedHash,
      certificate: cert
    };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
}

export async function verifyStudentDetails(studentDetails) {
  try {
    const { certificateId, recipientName, courseName, issuedOn } = studentDetails;
    
    const cert = await Certificate.findOne({ certificateId });
    if (!cert) {
      return { isValid: false, error: 'Certificate not found' };
    }
    
    // Verify student details match
    const detailsMatch = 
      cert.recipientName === recipientName &&
      cert.courseName === courseName &&
      new Date(cert.issuedOn).getTime() === new Date(issuedOn).getTime();
    
    return {
      isValid: detailsMatch,
      detailsMatch,
      certificate: cert
    };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
}

export async function verifyCompleteCertificate(certificateId, providedHash, studentDetails) {
  try {
    const cert = await Certificate.findOne({ certificateId });
    if (!cert) {
      return { isValid: false, error: 'Certificate not found' };
    }
    
    // Verify hash
    const hashVerification = await verifyCertificateHash(certificateId, providedHash);
    
    // Verify student details
    const detailsVerification = await verifyStudentDetails(studentDetails);
    
    // Verify on blockchain
    const onChainValid = await verifyOnChain(certificateId);
    
    // Check certificate status
    const statusValid = cert.status === 'valid';
    
    const isValid = 
      hashVerification.isValid &&
      detailsVerification.isValid &&
      onChainValid &&
      statusValid;
    
    return {
      isValid,
      hashVerification,
      detailsVerification,
      onChainValid,
      statusValid,
      certificate: cert
    };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
}

export function generateCertificateHash(certificateData) {
  const hashData = {
    certificateId: certificateData.certificateId,
    recipientName: certificateData.recipientName,
    courseName: certificateData.courseName,
    issuedOn: certificateData.issuedOn,
    issuer: certificateData.issuer
  };
  
  return crypto.createHash('sha256')
    .update(JSON.stringify(hashData))
    .digest('hex');
}

export function verifyQRData(qrData) {
  try {
    const parsed = JSON.parse(qrData);
    
    if (parsed.type === 'certificate') {
      const requiredFields = ['certificateId', 'recipientName', 'courseName', 'issuedOn', 'hash'];
      const hasAllFields = requiredFields.every(field => parsed[field] !== undefined);
      
      return {
        isValid: hasAllFields,
        type: 'certificate',
        data: parsed
      };
    } else if (parsed.type === 'batch_certificate') {
      const requiredFields = ['merkleRoot', 'proof', 'leaf'];
      const hasAllFields = requiredFields.every(field => parsed[field] !== undefined);
      
      return {
        isValid: hasAllFields,
        type: 'batch_certificate',
        data: parsed
      };
    } else {
      return {
        isValid: false,
        error: 'Unknown QR type'
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid QR data format'
    };
  }
}
