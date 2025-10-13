import nodemailer from 'nodemailer';

let transporter;

export function getTransporter() {
  if (transporter) return transporter;
  
  console.log('🔍 Email configuration check:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST ? 'SET' : 'NOT SET');
  console.log('SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'NOT SET');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // Try to use Gmail SMTP for actual email sending
  const smtpConfig = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };

  // For development, try to send real emails
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Using Gmail SMTP for email sending');
    transporter = nodemailer.createTransport(smtpConfig);
    return transporter;
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
  
  transporter = nodemailer.createTransport({ 
    host, 
    port, 
    secure: port === 465, 
    auth: { user, pass } 
  });
  return transporter;
}

export async function sendCertificateEmail(toEmail, subject, html) {
  try {
    const from = process.env.EMAIL_FROM || 'CertVerify System <nashtychitti@gmail.com>';
    const tx = await getTransporter().sendMail({ from, to: toEmail, subject, html });
    console.log('✅ Email sent successfully:', tx.messageId);
    return tx;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    console.error('Full error:', error);
    throw error;
  }
}