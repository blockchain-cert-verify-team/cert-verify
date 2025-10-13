# 📱 Mobile Setup Guide for CertVerify

This guide helps you set up CertVerify to work with mobile devices for QR code scanning and verification.

## 🚨 Issues Fixed

### 1. Email Not Sending
- **Problem**: Emails weren't being sent to recipients
- **Solution**: Fixed email configuration to use proper Gmail SMTP credentials
- **Status**: ✅ Fixed

### 2. Mobile QR Code Scanning
- **Problem**: QR codes contained localhost URLs that don't work on mobile devices
- **Solution**: Created scripts to use local network IP or ngrok for mobile access
- **Status**: ✅ Fixed

## 🚀 Quick Start

### Step 1: Set Environment Variables
```powershell
# In PowerShell (Windows)
$env:EMAIL_USER="nashtychitti@gmail.com"
$env:EMAIL_PASS="mbyr bnon shlh tini"
$env:APP_BASE_URL="http://YOUR_LOCAL_IP:4000"
$env:NODE_ENV="development"
```

### Step 2: Get Your Local IP
```bash
# Run this to get your local IP address
npm run get-ip
```

### Step 3: Start the Backend
```bash
cd backend
npm start
```

### Step 4: Start the Frontend
```bash
cd frontend
npm run dev
```

## 📱 Mobile Access Options

### Option 1: Local Network (Recommended for Testing)
1. Get your local IP: `npm run get-ip`
2. Set `APP_BASE_URL=http://YOUR_IP:4000`
3. Make sure your phone is on the same WiFi network
4. Scan QR codes with your phone's camera app

### Option 2: ngrok (For External Access)
1. Install ngrok: `npm install -g ngrok`
2. Run: `ngrok http 4000`
3. Copy the https URL (e.g., `https://abc123.ngrok.io`)
4. Set `APP_BASE_URL=https://abc123.ngrok.io`
5. Restart your backend server

### Option 3: Cloud Deployment
- Deploy backend to Heroku, Railway, or similar
- Deploy frontend to Vercel, Netlify, or similar
- Use the deployed URLs

## 🧪 Testing

### Test Email Functionality
```bash
# Test email configuration
curl http://localhost:4000/api/cert/test-email-config

# Should return: {"hasCredentials":true}
```

### Test Mobile Setup
```bash
# Run the mobile setup test
npm run test-mobile
```

### Test QR Code Generation
1. Issue a certificate through the web interface
2. Check the console for: `🔗 Generated verification URL: http://YOUR_IP:4000/api/cert/verify?token=...`
3. Scan the QR code with your phone
4. Verify it opens the correct URL

## 🔧 Troubleshooting

### Email Issues
- Check Gmail app password is correct
- Verify 2FA is enabled on Gmail account
- Check firewall/antivirus blocking SMTP

### Mobile QR Issues
- Ensure phone is on same WiFi network
- Check `APP_BASE_URL` is set correctly
- Try using ngrok for external access
- Verify backend is running on correct port

### Common Commands
```bash
# Get local IP
npm run get-ip

# Setup mobile access
npm run setup-mobile

# Test everything
npm run test-mobile

# Check email config
curl http://localhost:4000/api/cert/test-email-config
```

## 📋 Environment Variables Reference

```bash
# Required for email
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password

# Required for mobile access
APP_BASE_URL=http://YOUR_IP:4000  # or ngrok URL

# Optional
NODE_ENV=development
PORT=4000
```

## 🎯 Next Steps

1. **Set up environment variables** with your local IP
2. **Start both backend and frontend servers**
3. **Issue a test certificate** through the web interface
4. **Scan the QR code** with your mobile device
5. **Verify the certificate** works on mobile

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all environment variables are set
3. Ensure your phone is on the same network
4. Try using ngrok for external access

---

**Happy testing! 🎉**

Your CertVerify system should now work perfectly with mobile devices for QR code scanning and verification.


