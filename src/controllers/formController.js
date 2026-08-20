const Contact = require('../models/Contact');
const PropertyEnquiry = require('../models/PropertyEnquiry');
const sendEmail = require('../utils/sendEmail');

// @desc    Submit Contact Form
// @route   POST /api/forms/contact
// @access  Public
const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message, phone } = req.body;

    // Validate inputs
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    // Save to DB
    const contact = await Contact.create({
      name,
      email,
      phone,
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

    if (!req.body.skipEmail) {
      console.log(`Sending contact form email for ${name}...`);
      await sendEmail({
        subject: `New Contact Submission: ${subject || 'No Subject'}`,
        html: emailHtml
      }); // uses SMTP_TO_ADMIN by default
      console.log(`Contact form email sent for ${name}`);
    }

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

// @desc    Get all Contacts
// @route   GET /api/forms/contact
// @access  Public (Should be private in a real app)
const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single Contact
// @route   GET /api/forms/contact/:id
// @access  Public
const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update Contact Status
// @route   PUT /api/forms/contact/:id/status
// @access  Public
const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete Contact
// @route   DELETE /api/forms/contact/:id
// @access  Public
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    res.status(200).json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  submitContactForm,
  submitPropertyEnquiry,
  getContacts,
  getContactById,
  updateContactStatus,
  deleteContact
};
