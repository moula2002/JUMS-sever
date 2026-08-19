const mongoose = require('mongoose');

const propertyEnquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number']
  },
  propertyType: {
    type: String,
    required: false
  },
  message: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PropertyEnquiry', propertyEnquirySchema);
