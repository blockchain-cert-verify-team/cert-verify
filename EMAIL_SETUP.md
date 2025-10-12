# 📧 Email Setup Instructions

## Current Status
The email system is working but currently in **development mode** (console logging only). To send real emails, you need to configure SMTP settings.

## Option 1: Gmail SMTP (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Set Environment Variables**:
   ```bash
   $env:EMAIL_USER="your-email@gmail.com"
   $env:EMAIL_PASS="your-16-character-app-password"
   ```

## Option 2: Other SMTP Providers

You can use any SMTP provider by setting these environment variables:
```bash
$env:SMTP_HOST="smtp.your-provider.com"
$env:SMTP_PORT="587"
$env:SMTP_USER="your-email@domain.com"
$env:SMTP_PASS="your-password"
$env:EMAIL_FROM="your-email@domain.com"
```

## Option 3: Test Email Service (Free)

For testing, you can use services like:
- **Mailtrap** (free tier available)
- **Ethereal Email** (for testing only)
- **MailHog** (local testing)

## Quick Test

To test with Gmail right now:
1. Set up Gmail app password
2. Run these commands:
   ```bash
   $env:EMAIL_USER="your-email@gmail.com"
   $env:EMAIL_PASS="your-app-password"
   ```
3. Restart the backend
4. Issue a certificate with an email address

## Current Email Content

The system sends beautiful HTML emails with:
- ✅ Certificate details
- ✅ Certificate hash for verification
- ✅ Verification link
- ✅ Professional styling
- ✅ Security information

The email template is already working perfectly - you just need to configure SMTP to send real emails instead of console logging.
