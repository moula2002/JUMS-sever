const nodemailer = require('nodemailer');

/**
 * Utility to send emails using Nodemailer.
 * Configured for SMTP (like Gmail via App Passwords) using environment variables.
 * Includes Promise wrappers to fix Vercel Serverless Function hanging issues.
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
    tls: {
      // Do not fail on invalid certs in some serverless environments
      rejectUnauthorized: false
    }
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

  // 3. Verify connection configuration (important for Serverless/Vercel)
  await new Promise((resolve, reject) => {
    transporter.verify(function (error, success) {
      if (error) {
        console.error('Nodemailer verification error:', error);
        reject(error);
      } else {
        resolve(success);
      }
    });
  });

  // 4. Actually send the email (Wrapped in a new Promise to guarantee execution in Vercel)
  return await new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(`Error sending email to ${options.email || process.env.SMTP_TO_ADMIN}:`, error);
        reject(error);
      } else {
        console.log(`Email sent successfully: ${info.messageId}`);
        resolve(info);
      }
    });
  });
};

module.exports = sendEmail;
