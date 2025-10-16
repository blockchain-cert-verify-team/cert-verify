# 🌐 Sepolia Setup Guide

This guide will help you set up CertVerify to work exclusively on Sepolia testnet.

## 🚀 **Quick Start**

```bash
# 1. Deploy contract to Sepolia
npm run deploy

# 2. Start backend
npm run start:backend

# 3. Start frontend
npm run start:frontend
```

## 🔧 **Environment Configuration**

Create `backend/.env` with the following content:

```env
# ========================================
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
WALLET_PRIVATE_KEY=your_sepolia_private_key_here
```

## 📋 **Setup Steps**

### **Step 1: Get Sepolia ETH**
1. Visit [Sepolia Faucet](https://sepoliafaucet.com/)
2. Enter your wallet address
3. Get 0.1-0.5 ETH (free test currency)

### **Step 2: Configure Environment**
1. Copy the environment template above to `backend/.env`
2. Replace `your_sepolia_private_key_here` with your actual private key
3. Replace `your_app_password_here` with your Gmail app password

### **Step 3: Deploy Contract**
```bash
npm run deploy
```

### **Step 4: Start Services**
```bash
# Terminal 1: Backend
npm run start:backend

# Terminal 2: Frontend
npm run start:frontend
```

## 🧪 **Testing**

```bash
# Test Sepolia configuration
npm run test:sepolia

# Test all components
npm run test:sepolia
```

## 💰 **Sepolia Costs**

- **Gas Price:** ~1 Gwei (very low)
- **Deploy Contract:** ~0.01-0.05 ETH
- **Issue Certificate:** ~0.001-0.005 ETH
- **Verify Certificate:** ~0.0001-0.001 ETH

**Recommended Balance:** 0.5-1 ETH for comfortable testing

## 🔗 **Useful Links**

- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Sepolia Explorer](https://sepolia.etherscan.io/)
- [MetaMask Sepolia](https://metamask.io/)

## ⚠️ **Important Notes**

- Sepolia ETH has no real value
- Transactions are permanent (unlike local blockchain)
- Gas prices fluctuate
- Always test on Sepolia before mainnet

## 🎯 **Benefits of Sepolia**

- ✅ Real blockchain network
- ✅ Permanent data storage
- ✅ MetaMask integration
- ✅ Production-like environment
- ✅ Free test ETH available
