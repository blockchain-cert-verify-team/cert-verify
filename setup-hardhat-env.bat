@echo off
echo Setting up Hardhat environment variables...

REM Set environment variables for Hardhat localhost
set CHAIN_RPC_URL=http://localhost:8545
set CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
set WALLET_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

echo Environment variables set:
echo CHAIN_RPC_URL=%CHAIN_RPC_URL%
echo CONTRACT_ADDRESS=%CONTRACT_ADDRESS%
echo WALLET_PRIVATE_KEY=%WALLET_PRIVATE_KEY%

echo.
echo Starting backend with Hardhat configuration...
cd backend
npm start

