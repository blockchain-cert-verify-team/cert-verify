# Deployment Instructions

## **Issues Fixed:**

1. **hardhat.config.js** - Fixed network configuration with proper types
2. **scripts/deploy.js** - Updated to use working ethers import pattern
3. **package.json** - Added deployment scripts
Before deployment of smart contract, compile it using the command "npx hardhat compile"

## **How to Deploy:**

### 1. **Local Development (Hardhat Network)**

```bash
# Terminal 1: Start local node
npm run node

# Terminal 2: Deploy to localhost
npm run deploy:localhost
```

### 2. **Sepolia Testnet**

1. **Set up environment variables:**
   - Create a `.env` file in the root directory
   - Add your Sepolia RPC URL and private key:

```env
CHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

2. **Deploy to Sepolia:**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## **Available Scripts:**

- `npm run compile` - Compile contracts
- `npm run deploy` - Deploy to default network
- `npm run deploy:sepolia` - Deploy to Sepolia testnet
- `npm run deploy:localhost` - Deploy to localhost
- `npm run node` - Start local hardhat node
- `npm run clean` - Clean build artifacts

## **Troubleshooting:**

If you get ethers-related errors, the deployment script now uses a working pattern that:
- Uses direct ethers import instead of hre.ethers
- Creates a JsonRpcProvider for network connection
- Uses ContractFactory with artifacts

## **Deployment Success:**

Your contract `CertificateRegistryOptimized` has been successfully deployed at:
**0x5FbDB2315678afecb367f032d93F642f64180aa3**

The deployment includes:
- Contract compilation
- Network connection
- Contract deployment
- Owner verification
- Deployment summary
