import nodemailer from 'nodemailer';

let transporter;

export function getTransporter() {
  if (transporter) return transporter;
  
  console.log('🔍 Email configuration check:');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // Try to use Gmail SMTP for actual email sending
  const smtpConfig = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  };
  
  // For development, try to send real emails if configured
  if (process.env.NODE_ENV === 'development') {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log('📧 Using Gmail SMTP for email sending');
      transporter = nodemailer.createTransporter(smtpConfig);
      return transporter;
    } else {
      // Fallback to console logging if no email config
      console.log('⚠️ No email configuration found. Using console logging.');
      transporter = {
        sendMail: async (mailOptions) => {
          console.log('📧 EMAIL WOULD BE SENT:');
          console.log('From:', mailOptions.from);
          console.log('To:', mailOptions.to);
          console.log('Subject:', mailOptions.subject);
          console.log('HTML Content:', mailOptions.html);
          console.log('---');
          return { messageId: 'test-' + Date.now() };
        }
      };
      return transporter;
    }
  }
  
  // For production, use real SMTP
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  
  if (!host || !user || !pass) {
    console.warn('⚠️ Email configuration missing. Using console logging instead.');
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('📧 EMAIL WOULD BE SENT:');
        console.log('From:', mailOptions.from);
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('HTML Content:', mailOptions.html);
        console.log('---');
        return { messageId: 'test-' + Date.now() };
      }
    };
    return transporter;
  }
  
  transporter = nodemailer.createTransporter({ 
    host, 
    port, 
    secure: port === 465, 
    auth: { user, pass } 
  });
  return transporter;
}

export async function sendCertificateEmail(toEmail, subject, html) {
  try {
    const from = process.env.EMAIL_FROM || 'no-reply@certverify.com';
    const tx = await getTransporter().sendMail({ from, to: toEmail, subject, html });
    console.log('✅ Email sent successfully:', tx.messageId);
    return tx;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw error;
  }
}