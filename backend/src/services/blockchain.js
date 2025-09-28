import { ethers } from 'ethers';
import fs from 'fs';

export function getContract() {
  const rpcUrl = process.env.CHAIN_RPC_URL;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const abiPath = process.env.CONTRACT_ABI_JSON_PATH;
  if (!rpcUrl || !contractAddress || !abiPath) {
    throw new Error('Blockchain env vars missing');
  }
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const abi = JSON.parse(fs.readFileSync(abiPath, 'utf-8')).abi || JSON.parse(fs.readFileSync(abiPath, 'utf-8'));
  return new ethers.Contract(contractAddress, abi, provider);
}

export async function verifyOnChain(certificateId) {
  const contract = getContract();
  try {
    // Use the correct function name from your contract
    const result = await contract.isValid(certificateId);
    return Boolean(result);
  } catch (e) {
    console.error('Blockchain verification error:', e.message);
    return false;
  }
}

export async function getCertificateOnChain(certificateId) {
  const contract = getContract();
  try {
    const result = await contract.getCertificate(certificateId);
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
  try {
    const hash = await contract.getCertificateHash(certificateId);
    return hash;
  } catch (e) {
    console.error('Get certificate hash error:', e.message);
    return null;
  }
}

function getSignerContract() {
  const rpcUrl = process.env.CHAIN_RPC_URL;
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!rpcUrl || !privateKey) throw new Error('Missing signer configuration');
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const abiPath = process.env.CONTRACT_ABI_JSON_PATH;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const abi = JSON.parse(fs.readFileSync(abiPath, 'utf-8')).abi || JSON.parse(fs.readFileSync(abiPath, 'utf-8'));
  return new ethers.Contract(contractAddress, abi, wallet);
}

// Issue certificate on blockchain
export async function issueOnChain(holderName, courseName, validUntil, ipfsHash) {
  try {
    const contract = getSignerContract();
    // Use the correct function signature from your contract
    const tx = await contract.issueCertificate(holderName, courseName, validUntil, ipfsHash);
    const receipt = await tx.wait();
    return receipt?.hash || tx.hash;
  } catch (e) {
    console.error('Issue certificate error:', e.message);
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

// Revoke certificate
export async function revokeCertificateOnChain(certificateId, reason) {
  try {
    const contract = getSignerContract();
    const tx = await contract.revokeCertificate(certificateId, reason);
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


