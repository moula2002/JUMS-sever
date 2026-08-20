const Contact = require('../models/Contact');
const PropertyEnquiry = require('../models/PropertyEnquiry');
const sendEmail = require('../utils/sendEmail');

// @desc    Submit Contact Form
// @route   POST /api/forms/contact
// @access  Public
const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate inputs
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    // Save to DB
    const contact = await Contact.create({
      name,
      email,
      subject,
      message
    });

    // Send Email to Admin
    const emailHtml = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject || 'No Subject'}</p>
      <br/>
      <h3>Message:</h3>
      <p>${message.replace(/\n/g, '<br/>')}</p>
    `;

    console.log(`Sending contact form email for ${name}...`);
    await sendEmail({
      subject: `New Contact Submission: ${subject || 'No Subject'}`,
      html: emailHtml
    }); // uses SMTP_TO_ADMIN by default
    console.log(`Contact form email sent for ${name}`);

    res.status(201).json({ message: 'Contact form submitted successfully!', data: contact });
  } catch (error) {
    console.error('Contact Form Error (Vercel Log):', error.message, error.stack);
    res.status(500).json({ message: 'Failed to submit contact form', error: error.message || 'Unknown Server Error' });
  }
};

// @desc    Submit Property Enquiry Form
// @route   POST /api/forms/property-enquiry
// @access  Public
const submitPropertyEnquiry = async (req, res) => {
  try {
    const { name, email, phone, propertyType, message } = req.body;

    // Validate inputs
    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'Name, email, and phone are required.' });
    }

    // Save to DB
    const enquiry = await PropertyEnquiry.create({
      name,
      email,
      phone,
      propertyType,
      message
    });

    // Send Email to Admin
    const emailHtml = `
      <h2>New Property Enquiry</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Property Type:</strong> ${propertyType || 'Not specified'}</p>
      <br/>
      <h3>Message:</h3>
      <p>${message ? message.replace(/\n/g, '<br/>') : 'No message provided.'}</p>
    `;

    console.log(`Sending property enquiry email for ${name}...`);
    await sendEmail({
      subject: `New Property Enquiry from ${name}`,
      html: emailHtml
    }); // uses SMTP_TO_ADMIN by default
    console.log(`Property enquiry email sent for ${name}`);

    res.status(201).json({ message: 'Property enquiry submitted successfully!', data: enquiry });
  } catch (error) {
    console.error('Property Enquiry Error (Vercel Log):', error.message, error.stack);
    res.status(500).json({ message: 'Failed to submit property enquiry', error: error.message || 'Unknown Server Error' });
  }
};

module.exports = {
  submitContactForm,
  submitPropertyEnquiry
};
