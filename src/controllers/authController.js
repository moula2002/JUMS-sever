const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

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
        profilePhoto: admin.profilePhoto,
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

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const admin = await Admin.findOne({ email: req.body.email });

    if (!admin) {
      return res.status(404).json({ message: 'There is no admin with that email' });
    }

    // Get reset token
    const resetToken = admin.getResetPasswordToken();

    await admin.save({ validateBeforeSave: false });

    // Create reset url (change to your frontend domain)
    // We get the origin from the request or use a hardcoded default for frontend
    const frontendUrl = req.headers.origin || 'https://jums-adminpanel.vercel.app';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a put request to: \n\n ${resetUrl}`;
    
    const html = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your JUMS Admin Panel account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#ff6600;color:white;text-decoration:none;border-radius:5px;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `;

    try {
      await sendEmail({
        email: admin.email,
        subject: 'JUMS Admin - Password Reset Token',
        message,
        html
      });

      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
      admin.resetPasswordToken = undefined;
      admin.resetPasswordExpire = undefined;
      await admin.save({ validateBeforeSave: false });

      console.error('Email send failed:', err);
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

    const admin = await Admin.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Set new password
    admin.password = req.body.password;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token: generateToken(admin._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  login,
  initAdmin,
  getProfile,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword
};
