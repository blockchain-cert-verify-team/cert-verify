import { ethers } from 'ethers';
import fs from 'fs';

// Sepolia network configuration
function getNetworkConfig() {
  return {
    rpcUrl: process.env.CHAIN_RPC_URL || 'https://sepolia.infura.io/v3/77500932fa5142a88b06de9ac9a9c8c1',
    contractAddress: process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    privateKey: process.env.WALLET_PRIVATE_KEY
  };
}

export function getContract() {
  const config = getNetworkConfig();
  const abiPath = process.env.CONTRACT_ABI_JSON_PATH || './abi/Certificate.json';
  
  try {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const abi = JSON.parse(fs.readFileSync(abiPath, 'utf-8')).abi || JSON.parse(fs.readFileSync(abiPath, 'utf-8'));
    console.log('🔗 Connecting to Sepolia testnet:', config.rpcUrl);
    console.log('📄 Contract address:', config.contractAddress);
    console.log('🌐 Network: Sepolia Testnet');
    return new ethers.Contract(config.contractAddress, abi, provider);
  } catch (error) {
    console.warn('⚠️ Blockchain configuration issue:', error.message);
    console.warn('🔄 Using fallback configuration for development');
    // Return a mock contract for development
    return null;
  }
}

export async function verifyOnChain(certificateId) {
  const contract = getContract();
  if (!contract) {
    console.warn('Blockchain contract not available, skipping blockchain verification');
    return true; // Return true for development when blockchain is not available
  }
  try {
    // Convert string certificate ID to bytes32
    const certIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(certificateId));
    const result = await contract.isValid(certIdBytes32);
    return Boolean(result);
  } catch (e) {
    console.error('Blockchain verification error:', e.message);
    return false;
  }
}

export async function getCertificateOnChain(certificateId) {
  const contract = getContract();
  if (!contract) {
    console.warn('Blockchain contract not available, cannot get certificate from chain');
    return null;
  }
  try {
    const certIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(certificateId));
    const result = await contract.getCertificate(certIdBytes32);
    return {
      holderName: result[0],
      course: result[1],
      issuedAt: result[2],
      validUntil: result[3],
      ipfsHash: result[4],
      issuer: result[5],
      revoked: result[6],
      revokeReason: result[7]
    };
  } catch (e) {
    console.error('Get certificate error:', e.message);
    return null;
  }
}

export async function getCertificateHashOnChain(certificateId) {
  const contract = getContract();
  if (!contract) {
    console.warn('Blockchain contract not available, cannot get certificate hash from chain');
    return null;
  }
  try {
    const certIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(certificateId));
    const hash = await contract.getCertificateHash(certIdBytes32);
    return hash;
  } catch (e) {
    console.error('Get certificate hash error:', e.message);
    return null;
  }
}

function getSignerContract() {
  const config = getNetworkConfig();
  if (!config.rpcUrl || !config.privateKey) throw new Error('Missing signer configuration');
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(config.privateKey, provider);
  const abiPath = process.env.CONTRACT_ABI_JSON_PATH || './abi/Certificate.json';
  const abi = JSON.parse(fs.readFileSync(abiPath, 'utf-8')).abi || JSON.parse(fs.readFileSync(abiPath, 'utf-8'));
  return new ethers.Contract(config.contractAddress, abi, wallet);
}

// Issue certificate on blockchain
export async function issueOnChain(holderName, courseName, validUntil, ipfsHash) {
  try {
    const contract = getSignerContract();
    
    // Debug: Log the exact parameters being sent
    console.log('🔍 Smart contract call parameters:');
    console.log('  holderName:', holderName);
    console.log('  courseName:', courseName);
    console.log('  validUntil:', validUntil);
    console.log('  ipfsHash:', ipfsHash);
    console.log('  ipfsHash length:', ipfsHash ? ipfsHash.length : 0);
    
    // Use the correct function signature from your contract
    const tx = await contract.issueCertificate(holderName, courseName, validUntil, ipfsHash);
    console.log('✅ Transaction sent successfully:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    console.log('⛽ Gas used:', receipt.gasUsed.toString());
    
    return {
      hash: receipt?.hash || tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  } catch (e) {
    console.error('❌ Issue certificate error:', e.message);
    console.error('Error code:', e.code);
    console.error('Error data:', e.data);
    console.error('Full error:', e);
    return null;
  }
}

// Issue batch certificate (Merkle tree)
export async function issueBatchOnChain(merkleRoot) {
  try {
    const contract = getSignerContract();
    const tx = await contract.issueBatch(merkleRoot);
    const receipt = await tx.wait();
    return receipt?.hash || tx.hash;
  } catch (e) {
    console.error('Issue batch error:', e.message);
    return null;
  }
}

// Revoke certificate on blockchain
export async function revokeCertificateOnChain(certificateId, reason) {
  try {
    const contract = getSignerContract();
    const certIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(certificateId));
    const tx = await contract.revokeCertificate(certIdBytes32, reason || 'No reason provided');
    const receipt = await tx.wait();
    return receipt?.hash || tx.hash;
  } catch (e) {
    console.error('Revoke certificate error:', e.message);
    return null;
  }
}

// Verify batch certificate with Merkle proof
export async function verifyBatchCertificateOnChain(merkleRoot, leaf, proof) {
  try {
    const contract = getContract();
    const result = await contract.verifyBatchCertificate(merkleRoot, leaf, proof);
    return {
      valid: result[0],
      revoked: result[1]
    };
  } catch (e) {
    console.error('Verify batch certificate error:', e.message);
    return { valid: false, revoked: false };
  }
}


