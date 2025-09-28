Backend - Blockchain Certificate Verification

Setup
- Create `.env` based on the keys below:

Required env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/cert_verify
JWT_SECRET=replace_me
JWT_EXPIRES_IN=7d
APP_BASE_URL=http://localhost:4000
FRONTEND_ORIGIN=http://localhost:5173
CHAIN_RPC_URL=YOUR_RPC
CONTRACT_ADDRESS=0x...
CONTRACT_ABI_JSON_PATH=./abi/Certificate.json

Start
- npm install
- npm run dev

API
- Auth: POST /api/auth/signup, POST /api/auth/login, GET /api/auth/me
- Cert: POST /api/cert/issue (issuer/admin), GET /api/cert/:certificateId, GET /api/cert/verify?token=...
- Admin: GET /api/admin/users, PATCH /api/admin/users/:id/role




