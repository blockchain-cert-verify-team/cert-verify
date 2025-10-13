#!/usr/bin/env node

/**
 * Setup script for mobile access to CertVerify
 * This script helps you configure the system to work with mobile devices
 */

import os from 'os';
import { execSync } from 'child_process';

console.log('🚀 CertVerify Mobile Access Setup');
console.log('=====================================\n');

// Get local IP address
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
console.log(`📍 Your local IP address: ${localIP}`);
console.log(`📍 Your localhost: http://localhost:4000\n`);

console.log('📱 Mobile Access Options:');
console.log('========================\n');

console.log('Option 1: Use Local Network IP (Recommended for testing)');
console.log(`   • Backend URL: http://${localIP}:4000`);
console.log(`   • Frontend URL: http://${localIP}:3000`);
console.log('   • Make sure your phone is on the same WiFi network');
console.log('   • Update APP_BASE_URL in your environment\n');

console.log('Option 2: Use ngrok (Recommended for external access)');
console.log('   • Install ngrok: https://ngrok.com/download');
console.log('   • Run: ngrok http 4000');
console.log('   • Use the provided https URL for APP_BASE_URL\n');

console.log('Option 3: Deploy to a cloud service');
console.log('   • Deploy backend to Heroku, Railway, or similar');
console.log('   • Deploy frontend to Vercel, Netlify, or similar');
console.log('   • Use the deployed URLs\n');

console.log('🔧 Quick Setup Commands:');
console.log('=======================\n');

console.log('For Local Network (Option 1):');
console.log(`export APP_BASE_URL=http://${localIP}:4000`);
console.log('npm run dev\n');

console.log('For ngrok (Option 2):');
console.log('1. Install ngrok: npm install -g ngrok');
console.log('2. Run: ngrok http 4000');
console.log('3. Copy the https URL and set:');
console.log('   export APP_BASE_URL=https://your-ngrok-url.ngrok.io');
console.log('4. Run: npm run dev\n');

console.log('📋 Environment Variables to Set:');
console.log('================================');
console.log(`APP_BASE_URL=http://${localIP}:4000  # or your ngrok URL`);
console.log('EMAIL_USER=nashtychitti@gmail.com');
console.log('EMAIL_PASS=mbyr bnon shlh tini');
console.log('NODE_ENV=development\n');

console.log('🧪 Testing Mobile Access:');
console.log('========================');
console.log('1. Start your backend: cd backend && npm start');
console.log('2. Start your frontend: cd frontend && npm run dev');
console.log('3. Issue a test certificate');
console.log('4. Scan the QR code with your phone');
console.log('5. The verification should work on mobile!\n');

// Check if ngrok is installed
try {
  execSync('ngrok version', { stdio: 'ignore' });
  console.log('✅ ngrok is installed and ready to use');
} catch (error) {
  console.log('❌ ngrok is not installed. Install it for external access:');
  console.log('   npm install -g ngrok');
  console.log('   or visit: https://ngrok.com/download\n');
}

console.log('🎯 Next Steps:');
console.log('==============');
console.log('1. Choose an option above');
console.log('2. Set the APP_BASE_URL environment variable');
console.log('3. Restart your backend server');
console.log('4. Test with a mobile device');
console.log('5. Check that emails are being sent properly\n');

console.log('Happy testing! 🎉');


