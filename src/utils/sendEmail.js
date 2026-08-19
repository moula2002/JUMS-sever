const nodemailer = require('nodemailer');

/**
 * Utility to send emails using Nodemailer.
 * Configured for SMTP (like Gmail via App Passwords) using environment variables.
 * Ideal for Vercel Serverless Functions.
 */
const sendEmail = async (options) => {
  // 1. Create a transporter using environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 465,
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // 2. Define the email options
  const mailOptions = {
    from: `"JUMS Platform" <${process.env.SMTP_USER}>`,
    to: options.email || process.env.SMTP_TO_ADMIN,
    subject: options.subject,
    text: options.message,
    html: options.html, // Optional HTML version
    attachments: options.attachments || [] // Optional file attachments
  };

  // 3. Actually send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Error sending email to ${options.email || process.env.SMTP_TO_ADMIN}:`, error);
    throw error;
  }
};

module.exports = sendEmail;
