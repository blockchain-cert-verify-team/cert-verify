import QRCode from 'qrcode';
import crypto from 'crypto';

export async function generateQrDataUrl(data) {
  return QRCode.toDataURL(data, { errorCorrectionLevel: 'M', margin: 1, width: 320 });
}

export async function generateCertificateQr(certificateData, verificationToken, baseUrl) {
  const verifyUrl = `${baseUrl}/api/cert/verify?token=${verificationToken}`;
  
  // Enhanced QR data with hash information
  const qrData = {
    type: 'certificate',
    certificateId: certificateData.certificateId,
    recipientName: certificateData.recipientName,
    courseName: certificateData.courseName,
    issuedOn: certificateData.issuedOn,
    hash: certificateData.metadata?.ipfs?.cid || null,
    verifyUrl: verifyUrl,
    timestamp: Date.now()
  };
  
  return QRCode.toDataURL(JSON.stringify(qrData), { 
    errorCorrectionLevel: 'H', 
    margin: 2, 
    width: 400 
  });
}

export async function generateVerificationQr(verifyUrl) {
  return QRCode.toDataURL(verifyUrl, { 
    errorCorrectionLevel: 'M', 
    margin: 1, 
    width: 320 
  });
}

export async function generateBatchQr(merkleRoot, proof, leaf, baseUrl) {
  const qrData = {
    type: 'batch_certificate',
    merkleRoot: merkleRoot,
    proof: proof,
    leaf: leaf,
    verifyUrl: `${baseUrl}/api/cert/verify/batch`,
    timestamp: Date.now()
  };
  
  return QRCode.toDataURL(JSON.stringify(qrData), { 
    errorCorrectionLevel: 'H', 
    margin: 2, 
    width: 400 
  });
}

export function generateStudentHash(studentDetails) {
  const hashData = {
    name: studentDetails.recipientName,
    course: studentDetails.courseName,
    issuedOn: studentDetails.issuedOn,
    certificateId: studentDetails.certificateId
  };
  
  return crypto.createHash('sha256')
    .update(JSON.stringify(hashData))
    .digest('hex');
}



