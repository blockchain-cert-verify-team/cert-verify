#!/usr/bin/env node

/**
 * Test script for mobile setup and email functionality
 */

import os from 'os';
import { sendCertificateEmail } from './backend/src/services/email.js';
import { generateCertificateQr } from './backend/src/services/qr.js';

console.log('🧪 Testing Mobile Setup and Email');
console.log('==================================\n');

// Get local IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();
const baseUrl = `http://${localIP}:4000`;

console.log(`📍 Using base URL: ${baseUrl}`);
console.log(`📍 Make sure your backend is running on port 4000\n`);

// Test QR code generation
console.log('🔍 Testing QR Code Generation...');
try {
  const testCert = {
    certificateId: 'TEST-123',
    recipientName: 'Test User',
    courseName: 'Test Course'
  };
  
  const verificationToken = 'test-token-123';
  const qrCode = await generateCertificateQr(testCert, verificationToken, baseUrl);
  
  console.log('✅ QR Code generated successfully');
  console.log(`🔗 Verification URL: ${baseUrl}/api/cert/verify?token=${verificationToken}`);
  console.log('📱 This URL should work on mobile devices on the same network\n');
  
} catch (error) {
  console.error('❌ QR Code generation failed:', error.message);
}

// Test email sending
console.log('📧 Testing Email Sending...');
try {
  const testEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; text-align: center;">🧪 Test Email</h2>
      <p>This is a test email to verify the email system is working.</p>
      <p><strong>Base URL:</strong> ${baseUrl}</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p><strong>Status:</strong> Email system test successful!</p>
    </div>
  `;
  
  await sendCertificateEmail(
    'nashtychitti@gmail.com',
    '🧪 CertVerify Test Email',
    testEmailHtml
  );
  
  console.log('✅ Test email sent successfully!');
  console.log('📧 Check your Gmail inbox for the test email\n');
  
} catch (error) {
  console.error('❌ Email sending failed:', error.message);
  console.error('Full error:', error);
}

console.log('🎯 Next Steps:');
console.log('==============');
console.log('1. Make sure your backend is running: cd backend && npm start');
console.log('2. Make sure your frontend is running: cd frontend && npm run dev');
console.log('3. Set environment variable: export APP_BASE_URL=' + baseUrl);
console.log('4. Issue a test certificate through the web interface');
console.log('5. Scan the QR code with your mobile device');
console.log('6. Verify that the mobile verification works!\n');

console.log('📱 Mobile Testing Tips:');
console.log('======================');
console.log('• Use your phone\'s camera app or Google Lens to scan QR codes');
console.log('• Make sure your phone is on the same WiFi network as your computer');
console.log('• The verification URL should open in your phone\'s browser');
console.log('• If it doesn\'t work, try using ngrok for external access\n');

console.log('Happy testing! 🎉');


