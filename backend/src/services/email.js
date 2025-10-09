import nodemailer from 'nodemailer';

let transporter;

export function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  return transporter;
}

export async function sendCertificateEmail(toEmail, subject, html) {
  const from = process.env.EMAIL_FROM || 'no-reply@example.com';
  const tx = await getTransporter().sendMail({ from, to: toEmail, subject, html });
  return tx;
}




