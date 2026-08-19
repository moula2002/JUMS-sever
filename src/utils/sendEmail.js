const nodemailer = require('nodemailer');

/**
 * Utility to send emails using Nodemailer.
 * Configured for Gmail by default (based on the 16-char app password format).
 * Can be adapted to other services if needed.
 */
const sendEmail = async (options) => {
  // 1. Create a transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Use 'gmail' as default for standard app passwords
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 2. Define the email options
  const mailOptions = {
    from: `"JUMS Careers" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Optional HTML version
    attachments: options.attachments || [] // Optional file attachments (e.g. Resume)
  };

  // 3. Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
