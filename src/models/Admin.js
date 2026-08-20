const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: 'Admin User',
  },
  firstName: {
    type: String,
    default: 'Admin',
  },
  lastName: {
    type: String,
    default: 'User',
  },
  bio: {
    type: String,
    default: '',
  },
  profilePhoto: {
    type: String,
    default: '',
  }
}, {
  timestamps: true,
});

// Method to compare entered password to hashed password
adminSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to hash password before saving
adminSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
