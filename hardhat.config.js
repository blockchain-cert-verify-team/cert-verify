import "@nomicfoundation/hardhat-ethers";
import dotenv from "dotenv";

dotenv.config();

export default {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      type: "http",
      url: process.env.CHAIN_RPC_URL || "https://sepolia.infura.io/v3/77500932fa5142a88b06de9ac9a9c8c1",
      accounts: process.env.WALLET_PRIVATE_KEY ? [process.env.WALLET_PRIVATE_KEY] : []
    }
  }
};
