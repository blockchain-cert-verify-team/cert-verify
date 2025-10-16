#!/usr/bin/env node

/**
 * Sepolia Setup Script for CertVerify
 * 
 * This script helps you set up CertVerify for Sepolia testnet
 * 
 * Usage:
 *   node setup-sepolia.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_TEMPLATE = `# ========================================
# CERT-VERIFY SEPOLIA CONFIGURATION
# ========================================

# APPLICATION SETTINGS
PORT=4000
NODE_ENV=development

# DATABASE
MONGODB_URI=mongodb+srv://jyothiakkina7_db_user:8BGDIWXkkjSxPSmi@cluster0.dmjn2h8.mongodb.net/cert_verify?retryWrites=true&w=majority

# JWT AUTHENTICATION
JWT_SECRET=chjPxK9pNPoLs5cONR+mzumbr9l9ufi1DRUAvV8Or2ja2qB3zHsNgM9A9WF2Mq1o
JWT_EXPIRES_IN=7d

# CORS / APP
APP_BASE_URL=http://localhost:4000
FRONTEND_ORIGIN=http://localhost:5173

# EMAIL CONFIGURATION
EMAIL_USER=nashtychitti@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=CertVerify System <nashtychitti@gmail.com>

# IPFS (PINATA)
PINATA_API_KEY=a9d1a1be831ec3cd5833
PINATA_SECRET_API_KEY=1e16424b8b7355494bb80d59026ca35e59f657608b82991e503f768c2df9a9d1

# SEPOLIA BLOCKCHAIN CONFIGURATION
CHAIN_RPC_URL=https://sepolia.infura.io/v3/77500932fa5142a88b06de9ac9a9c8c1
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
WALLET_PRIVATE_KEY=your_sepolia_private_key_here`;

function createEnvFile() {
  const envPath = path.join(__dirname, 'backend', '.env');
  
  if (fs.existsSync(envPath)) {
    console.log('📄 .env file already exists');
    console.log('   Location:', envPath);
    return true;
  }
  
  try {
    fs.writeFileSync(envPath, ENV_TEMPLATE);
    console.log('✅ Created .env file successfully');
    console.log('   Location:', envPath);
    return true;
  } catch (error) {
    console.log('❌ Failed to create .env file:', error.message);
    return false;
  }
}

function showInstructions() {
  console.log('\n📋 Setup Instructions:');
  console.log('======================');
  console.log('');
  console.log('1. 🔑 Get Sepolia ETH:');
  console.log('   • Visit: https://sepoliafaucet.com/');
  console.log('   • Enter your wallet address');
  console.log('   • Get 0.5-1 ETH (free test currency)');
  console.log('');
  console.log('2. 🔧 Configure Environment:');
  console.log('   • Open: backend/.env');
  console.log('   • Replace "your_sepolia_private_key_here" with your actual private key');
  console.log('   • Replace "your_app_password_here" with your Gmail app password');
  console.log('');
  console.log('3. 🚀 Deploy and Start:');
  console.log('   • Deploy contract: npm run deploy');
  console.log('   • Start backend: npm run start:backend');
  console.log('   • Start frontend: npm run start:frontend');
  console.log('');
  console.log('4. 🧪 Test Everything:');
  console.log('   • Test Sepolia: npm run test:sepolia');
  console.log('   • Open: http://localhost:5173');
  console.log('');
}

function showFaucetLinks() {
  console.log('\n🆓 Sepolia Faucets:');
  console.log('==================');
  console.log('• https://sepoliafaucet.com/');
  console.log('• https://faucet.sepolia.dev/');
  console.log('• https://sepolia-faucet.pk910.de/');
  console.log('• https://sepoliafaucet.net/');
  console.log('');
}

function showCosts() {
  console.log('\n💰 Sepolia Costs:');
  console.log('=================');
  console.log('• Deploy Contract: ~0.01-0.05 ETH');
  console.log('• Issue Certificate: ~0.001-0.005 ETH');
  console.log('• Verify Certificate: ~0.0001-0.001 ETH');
  console.log('• Recommended Balance: 0.5-1 ETH');
  console.log('');
}

function main() {
  console.log('🚀 CertVerify Sepolia Setup');
  console.log('============================');
  console.log('');
  
  // Create .env file
  const envCreated = createEnvFile();
  
  if (envCreated) {
    showInstructions();
    showFaucetLinks();
    showCosts();
    
    console.log('🎯 Next Steps:');
    console.log('==============');
    console.log('1. Get Sepolia ETH from faucet');
    console.log('2. Update backend/.env with your private key');
    console.log('3. Run: npm run deploy');
    console.log('4. Run: npm run start:backend');
    console.log('5. Run: npm run start:frontend');
    console.log('');
    console.log('📚 For detailed instructions, see: SEPOLIA_SETUP.md');
  } else {
    console.log('❌ Setup failed. Please create the .env file manually.');
  }
}

main();
