const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
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
  subject: {
    type: String,
    required: false,
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Please provide a message']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema);
