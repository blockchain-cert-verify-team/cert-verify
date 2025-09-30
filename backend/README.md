Backend - Blockchain Certificate Verification

Setup
- Create `.env` based on the keys below:

## Environment Variables (.env)

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


Start
- npm install
- npm start

API
- Auth: POST /api/auth/signup, POST /api/auth/login, GET /api/auth/me
- Cert: POST /api/cert/issue (issuer/admin), GET /api/cert/:certificateId, GET /api/cert/verify?token=...
- Admin: GET /api/admin/users, PATCH /api/admin/users/:id/role




