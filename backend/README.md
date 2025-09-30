# Backend - Blockchain Certificate Verification

## Setup

Create a `.env` file in the `backend/` folder with the following variables:

```env
PORT=4000
NODE_ENV=development

# MongoDB connection string (replace with your own)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-address>/<database>?retryWrites=true&w=majority

# JWT secret key for signing tokens (use a strong, random string)
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# CORS / App URLs
APP_BASE_URL=http://localhost:4000
FRONTEND_ORIGIN=http://localhost:5173

# Email (SMTP) configuration for sending emails
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM=no-reply@example.com

# IPFS (Pinata) API keys
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_api_key

# Blockchain settings
CHAIN_RPC_URL=https://sepolia.infura.io/v3/your_infura_project_id
CONTRACT_ADDRESS=0xYourContractAddressHere
CONTRACT_ABI_JSON_PATH=./abi/Certificate.json

# Wallet private key (keep secret!)
WALLET_PRIVATE_KEY=your_wallet_private_key_here
```
Ensure your .env is encoded with UTF8 only

## Start the backend sever
 ```bash
npm install
npm start
```

## API
- Base URL
```bash
http://localhost:4000/api
```

- Auth Routes (/api/auth)
  - POST /signup   -> register a new user
  - POST /login  -> Login user and receive JWT token
  - GET /me  -> Get current logged-in user info [Auth req]
  - POST /request-access -> Request approval/access (issuer role) [Auth req]
- Certificate Routes (/api/cert)
  - POST /issue  -> Issue a new certificate [Auth req by issuer or admin]
  - GET  /:certificateId -> Get certificate details by certificate ID [Auth req]
  - GET  /verify -> Verify certificate by verification token
  - GET /verify/by-id/:certificateId -> Verify certificate by certificate ID
  - POST /verify/hash -> Verify certificate using certificate ID and hash
  - POST /verify/qr -> Verify certificate using QR data
  - GET /download/:certificateId  -> Download certificate PDF
- Admin Routes (/api/admin)
  - GET  /users  -> Get all users [Auth req by admin]
  - PATCH  /users/:id/role -> Update user role [Auth req by admin]
  - POST  /issuers/:id/approve  ->  Approve an issuer [Auth req by admin]
  - POST  /issuers/:id/reject -> Reject an issuer [Auth req by admin]




