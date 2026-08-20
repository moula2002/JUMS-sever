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

// @desc    Get logged in admin profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');
    if (admin) {
      res.json(admin);
    } else {
      res.status(404).json({ message: 'Admin not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update admin profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);

    if (admin) {
      admin.firstName = req.body.firstName !== undefined ? req.body.firstName : admin.firstName || 'Admin';
      admin.lastName = req.body.lastName !== undefined ? req.body.lastName : admin.lastName || 'User';
      admin.name = `${admin.firstName} ${admin.lastName}`.trim();
      admin.email = req.body.email || admin.email;
      if (req.body.bio !== undefined) admin.bio = req.body.bio;
      
      if (req.file) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        admin.profilePhoto = `${baseUrl}/uploads/${req.file.filename}`;
      }

      const updatedAdmin = await admin.save();

      res.json({
        _id: updatedAdmin._id,
        name: updatedAdmin.name,
        firstName: updatedAdmin.firstName,
        lastName: updatedAdmin.lastName,
        email: updatedAdmin.email,
        bio: updatedAdmin.bio,
        profilePhoto: updatedAdmin.profilePhoto,
        token: generateToken(updatedAdmin._id),
      });
    } else {
      res.status(404).json({ message: 'Admin not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update admin password
// @route   PUT /api/auth/security
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);

    if (admin) {
      const { currentPassword, newPassword } = req.body;

      // Verify current password
      if (!(await admin.matchPassword(currentPassword))) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }

      admin.password = newPassword;
      await admin.save();

      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(404).json({ message: 'Admin not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  login,
  initAdmin,
  getProfile,
  updateProfile,
  updatePassword
};
