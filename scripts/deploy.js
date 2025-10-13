import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  console.log("Starting deployment...");
  
  // Get the contract artifact
  const contractArtifact = await hre.artifacts.readArtifact("CertificateRegistryOptimized");
  console.log("Contract artifact loaded successfully");
  
  // Get network configuration
  const networkName = hre.network.name;
  let rpcUrl, privateKey;
  
  if (networkName === 'sepolia') {
    rpcUrl = process.env.CHAIN_RPC_URL || 'https://sepolia.infura.io/v3/77500932fa5142a88b06de9ac9a9c8c1';
    privateKey = process.env.WALLET_PRIVATE_KEY;
  } else {
    rpcUrl = 'http://127.0.0.1:8545';
    privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
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
  console.log("Network:", hre.network.name);
  console.log("Contract Address:", contractAddress);
  console.log("Deployment successful!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
