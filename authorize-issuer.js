#!/usr/bin/env node

/**
 * Authorize issuer script for CertVerify
 * This script authorizes the wallet address as an issuer in the smart contract
 */

import { ethers } from 'ethers';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

async function authorizeIssuer() {
  try {
    console.log('🔐 Authorizing Issuer...');
    console.log('========================\n');

    // Get configuration from environment
    const rpcUrl = process.env.CHAIN_RPC_URL;
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const abiPath = './backend/abi/Certificate.json';

    if (!rpcUrl || !privateKey || !contractAddress) {
      throw new Error('Missing required environment variables');
    }

    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('📍 Wallet Address:', wallet.address);
    console.log('📍 Contract Address:', contractAddress);
    console.log('📍 RPC URL:', rpcUrl);

    // Load contract ABI
    const abi = JSON.parse(fs.readFileSync(abiPath, 'utf-8')).abi || JSON.parse(fs.readFileSync(abiPath, 'utf-8'));
    const contract = new ethers.Contract(contractAddress, abi, wallet);

    // Check if already authorized
    console.log('\n🔍 Checking current authorization status...');
    const isAuthorized = await contract.authorizedIssuers(wallet.address);
    console.log('Current authorization status:', isAuthorized);

    if (isAuthorized) {
      console.log('✅ Issuer is already authorized!');
      return;
    }

    // Authorize the issuer
    console.log('\n🔐 Authorizing issuer...');
    const tx = await contract.authorizeIssuer(wallet.address);
    console.log('Transaction hash:', tx.hash);
    
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);

    // Verify authorization
    console.log('\n🔍 Verifying authorization...');
    const isNowAuthorized = await contract.authorizedIssuers(wallet.address);
    console.log('New authorization status:', isNowAuthorized);

    if (isNowAuthorized) {
      console.log('🎉 Issuer successfully authorized!');
      console.log('You can now issue certificates on the blockchain.');
    } else {
      console.log('❌ Authorization failed');
    }

  } catch (error) {
    console.error('❌ Error authorizing issuer:', error.message);
    if (error.code === 'CALL_EXCEPTION') {
      console.error('This might be because the wallet is not the contract owner.');
      console.error('Only the contract owner can authorize issuers.');
    }
  }
}

authorizeIssuer();
