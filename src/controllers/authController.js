const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Auth admin & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (admin && (await admin.matchPassword(password))) {
      res.json({
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        token: generateToken(admin._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Initialize a default admin account
// @route   POST /api/auth/init
// @access  Public (should be disabled in production)
const initAdmin = async (req, res) => {
  try {
    const adminExists = await Admin.findOne({ email: 'admin@jums.com' });

    if (adminExists) {
      return res.status(400).json({ message: 'Default admin already exists' });
    }

    const admin = await Admin.create({
      email: 'admin@jums.com',
      password: 'password123',
      name: 'Super Admin',
    });

    if (admin) {
      res.status(201).json({
        message: 'Admin account created successfully',
        email: 'admin@jums.com',
        password: 'password123',
      });
    } else {
      res.status(400).json({ message: 'Invalid admin data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  login,
  initAdmin,
};
