@echo off
echo 🚀 CertVerify Mobile Setup
echo ========================

echo.
echo 📍 Getting your local IP address...
node get-local-ip.js

echo.
echo 🔧 Setting up environment variables...
set EMAIL_USER=nashtychitti@gmail.com
set EMAIL_PASS=mbyr bnon shlh tini
set NODE_ENV=development

echo.
echo 📱 To complete mobile setup:
echo 1. Note your local IP address above
echo 2. Set APP_BASE_URL=http://YOUR_IP:4000
echo 3. Start backend: cd backend ^&^& npm start
echo 4. Start frontend: cd frontend ^&^& npm run dev
echo 5. Test with mobile device!

echo.
echo 🧪 To test email functionality:
echo curl http://localhost:4000/api/cert/test-email-config

echo.
echo Press any key to continue...
pause > nul


