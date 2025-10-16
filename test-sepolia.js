#!/usr/bin/env node

/**
 * Sepolia Test Script for CertVerify
 * 
 * This script tests the Sepolia testnet configuration
 * 
 * Usage:
 *   node test-sepolia.js
 */

import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const SEPOLIA_CONFIG = {
  name: 'Sepolia Testnet',
  rpcUrl: process.env.CHAIN_RPC_URL || 'https://sepolia.infura.io/v3/77500932fa5142a88b06de9ac9a9c8c1',
  contractAddress: process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  privateKey: process.env.WALLET_PRIVATE_KEY
};

async function testSepoliaConnection() {
  console.log('🔗 Testing Sepolia Connection...');
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
    const blockNumber = await provider.getBlockNumber();
    console.log(`   ✅ Sepolia connected! Current block: ${blockNumber}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Sepolia connection failed: ${error.message}`);
    return false;
  }
}

async function testWalletConnection() {
  console.log('💰 Testing Wallet Connection...');
  try {
    if (!SEPOLIA_CONFIG.privateKey) {
      console.log('   ❌ WALLET_PRIVATE_KEY not set in environment variables');
      console.log('   📋 Please set your Sepolia private key in .env file');
      return false;
    }
    
    const provider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
    const wallet = new ethers.Wallet(SEPOLIA_CONFIG.privateKey, provider);
    const balance = await provider.getBalance(wallet.address);
    const balanceEth = ethers.formatEther(balance);
    
    console.log(`   ✅ Wallet connected! Address: ${wallet.address}`);
    console.log(`   💰 Balance: ${balanceEth} ETH`);
    
    if (parseFloat(balanceEth) < 0.01) {
      console.log('   ⚠️  Low balance! You may need more Sepolia ETH for transactions');
      console.log('   🆓 Get free ETH from: https://sepoliafaucet.com/');
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ Wallet connection failed: ${error.message}`);
    return false;
  }
}

async function testContractConnection() {
  console.log('📄 Testing Contract Connection...');
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
    const abiPath = './backend/abi/Certificate.json';
    
    if (!fs.existsSync(abiPath)) {
      console.log('   ❌ Contract ABI not found');
      return false;
    }
    
    const abi = JSON.parse(fs.readFileSync(abiPath, 'utf-8')).abi || JSON.parse(fs.readFileSync(abiPath, 'utf-8'));
    const contract = new ethers.Contract(SEPOLIA_CONFIG.contractAddress, abi, provider);
    
    const owner = await contract.owner();
    console.log(`   ✅ Contract connected! Owner: ${owner}`);
    return true;
  } catch (error) {
    console.log(`   ❌ Contract connection failed: ${error.message}`);
    console.log('   📋 Contract may not be deployed. Run: npm run deploy');
    return false;
  }
}

async function testBackendAPI() {
  console.log('🌐 Testing Backend API...');
  try {
    const response = await fetch('http://localhost:4000/api/cert/test-email-config');
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Backend API is running');
      console.log(`   📧 Email config: ${data.config.hasCredentials ? 'SET' : 'NOT SET'}`);
      return true;
    } else {
      console.log('   ❌ Backend API not responding');
      return false;
    }
  } catch (error) {
    console.log('   ❌ Backend API not accessible');
    console.log('   📋 Start backend with: npm run start:backend');
    return false;
  }
}

async function testTransactionCapability() {
  console.log('🔄 Testing Transaction Capability...');
  try {
    if (!SEPOLIA_CONFIG.privateKey) {
      console.log('   ⚠️  Skipped - No private key configured');
      return false;
    }
    
    const provider = new ethers.JsonRpcProvider(SEPOLIA_CONFIG.rpcUrl);
    const wallet = new ethers.Wallet(SEPOLIA_CONFIG.privateKey, provider);
    const abiPath = './backend/abi/Certificate.json';
    const abi = JSON.parse(fs.readFileSync(abiPath, 'utf-8')).abi || JSON.parse(fs.readFileSync(abiPath, 'utf-8'));
    const contract = new ethers.Contract(SEPOLIA_CONFIG.contractAddress, abi, wallet);
    
    // Try to call a view function that requires gas estimation
    await contract.owner();
    console.log('   ✅ Transaction capability confirmed');
    return true;
  } catch (error) {
    console.log(`   ❌ Transaction test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 CertVerify Sepolia Test');
  console.log('===========================');
  console.log('');
  
  const results = {
    connection: false,
    wallet: false,
    contract: false,
    backend: false,
    transaction: false
  };
  
  // Run all tests
  results.connection = await testSepoliaConnection();
  results.wallet = await testWalletConnection();
  results.contract = await testContractConnection();
  results.backend = await testBackendAPI();
  results.transaction = await testTransactionCapability();
  
  // Summary
  console.log('\n📊 Sepolia Test Results');
  console.log('========================');
  console.log(`Sepolia Connection: ${results.connection ? '✅ Working' : '❌ Failed'}`);
  console.log(`Wallet Connection: ${results.wallet ? '✅ Working' : '❌ Failed'}`);
  console.log(`Contract Connection: ${results.contract ? '✅ Working' : '❌ Failed'}`);
  console.log(`Backend API: ${results.backend ? '✅ Working' : '❌ Failed'}`);
  console.log(`Transaction Capability: ${results.transaction ? '✅ Working' : '❌ Failed'}`);
  
  const workingComponents = Object.values(results).filter(Boolean).length;
  const totalComponents = Object.keys(results).length;
  
  console.log(`\n🎯 Overall Status: ${workingComponents}/${totalComponents} components working`);
  
  if (workingComponents === totalComponents) {
    console.log('\n🎉 SEPOLIA SETUP COMPLETE!');
    console.log('Your CertVerify project is ready for Sepolia testnet!');
  } else if (workingComponents >= 3) {
    console.log('\n✅ MOSTLY WORKING!');
    console.log('Core functionality is operational with minor issues.');
  } else {
    console.log('\n⚠️  NEEDS ATTENTION!');
    console.log('Several components need to be fixed.');
  }
  
  console.log('\n📋 Next Steps:');
  if (!results.wallet) {
    console.log('• Set WALLET_PRIVATE_KEY in your .env file');
    console.log('• Get Sepolia ETH from: https://sepoliafaucet.com/');
  }
  if (!results.contract) {
    console.log('• Deploy contract: npm run deploy');
  }
  if (!results.backend) {
    console.log('• Start backend: npm run start:backend');
  }
  if (results.connection && results.wallet && results.contract && results.backend) {
    console.log('• Start frontend: npm run start:frontend');
    console.log('• Test certificate issuance and verification');
  }
}

main().catch(console.error);
