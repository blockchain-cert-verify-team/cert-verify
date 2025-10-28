# CertVerify - Blockchain Certificate Verification

Monorepo with `backend/` (Node/Express/MongoDB) and `frontend/` (React + Vite) to issue and verify certificates on Ethereum Sepolia with IPFS and QR/email delivery.

## Features

- Blockchain (Sepolia) issuance and on-chain verification
- IPFS (Pinata) metadata pinning
- QR codes that open the frontend verify page on any scanner
- Email delivery with embedded QR and verify button
- MetaMask support and role-based admin/issuer workflow

## Repo structure

- `backend/` API, auth, certificate issuance/verification, email, IPFS
- `frontend/` SPA with dashboard, issuing and verification UI
- `contracts/` Solidity and Hardhat config/scripts

## Requirements

- Node.js 18+
- MongoDB (Atlas or local)
- MetaMask wallet + Sepolia ETH
- Pinata API keys
- SMTP or Gmail App Password

## Install

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

## Backend env (`backend/.env`)

```env
PORT=4000
NODE_ENV=development

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# App URLs
# IMPORTANT: QR and emails use this URL to open the verify page
FRONTEND_ORIGIN=http://localhost:5173
APP_BASE_URL=http://localhost:4000

# Email (choose ONE setup)
# Development with Gmail (requires App Password)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=CertVerify System <your_gmail@gmail.com>

# OR Production SMTP
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your_user
# SMTP_PASS=your_pass
# EMAIL_FROM=no-reply@example.com

# IPFS (Pinata)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key

# Blockchain (Sepolia)
CHAIN_RPC_URL=https://sepolia.infura.io/v3/your_infura_key
CONTRACT_ADDRESS=0xYourContractAddress
WALLET_PRIVATE_KEY=your_private_key
```

## Run

```bash
# Start both
npm run start:all

# Or separately
npm run start:backend    # http://localhost:4000
npm run start:frontend   # http://localhost:5173
```

## Contract deploy (optional)

```bash
npm run deploy
```

## Verification flow

- When a certificate is issued, the email includes a QR and a button.
- The QR encodes `FRONTEND_ORIGIN/verify?token=...` so any scanner opens the web page.
- The frontend `VerifyPage` reads `?token` and calls `GET /api/cert/verify?token=...` to show VALID/INVALID.

Quick checks
- Backend email config check: `GET /api/cert/test-email-config`
- Verify by ID (UI): use the Verify page field
- Verify by token (URL): open `FRONTEND_ORIGIN/verify?token=...`

## Scripts

- `npm run start:backend` Start API
- `npm run start:frontend` Start UI
- `npm run start:all` Run both concurrently
- `npm run deploy` Deploy contracts to Sepolia
- `npm run test:sepolia` Connection test

## Troubleshooting

- Emails not arriving: confirm Gmail App Password or SMTP creds; check `/api/cert/test-email-config`.
- QR opens JSON: ensure `FRONTEND_ORIGIN` is set; reissue cert so email uses the new URL.
- CORS: keep `FRONTEND_ORIGIN` and `APP_BASE_URL` aligned for local and production.

## License

ISC