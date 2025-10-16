import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  console.log("Starting deployment...");
  
  // Get the contract artifact
  const contractArtifact = await hre.artifacts.readArtifact("CertificateRegistryOptimized");
  console.log("Contract artifact loaded successfully");
  
  // Sepolia network configuration
  const rpcUrl = process.env.CHAIN_RPC_URL || 'https://sepolia.infura.io/v3/77500932fa5142a88b06de9ac9a9c8c1';
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('WALLET_PRIVATE_KEY not set in environment variables. Please set your Sepolia private key.');
  }
  
  // Create a provider for the network
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  // Create a wallet with the configured private key
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log("Deploying with account:", wallet.address);
  
  // Create contract factory
  const Contract = new ethers.ContractFactory(contractArtifact.abi, contractArtifact.bytecode, wallet);
  
  // Deploy the contract
  console.log("Deploying CertificateRegistryOptimized...");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("Contract deployed at:", contractAddress);
  
  // Verify deployment by calling a view function
  const owner = await contract.owner();
  console.log("Contract owner:", owner);
  
  // Save deployment info
  console.log("\n=== Deployment Summary ===");
  console.log("Network: Sepolia Testnet");
  console.log("Contract Address:", contractAddress);
  console.log("RPC URL:", rpcUrl);
  console.log("Deployment successful!");
  
  console.log("\n📋 Next Steps:");
  console.log("1. Update your .env file with the contract address");
  console.log("2. Start the backend: cd backend && npm start");
  console.log("3. Start the frontend: cd frontend && npm run dev");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
