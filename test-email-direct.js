// Direct email test
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'nashtychitti@gmail.com',
    pass: 'mbyr bnon shlh tini'
  }
});

async function testEmail() {
  try {
    console.log('📧 Testing Gmail SMTP...');
    
    const result = await transporter.sendMail({
      from: 'nashtychitti@gmail.com',
      to: 'nashtychitti@gmail.com',
      subject: '🧪 Test Email from CertVerify',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">🧪 Test Email</h2>
          <p>This is a test email to verify Gmail SMTP is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Status:</strong> SMTP connection successful!</p>
        </div>
      `
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Check your Gmail inbox!');
    
  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Response:', error.response);
  }
}

testEmail();
