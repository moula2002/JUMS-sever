const express = require('express');
const router = express.Router();
const { login, initAdmin, getProfile, updateProfile, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/login', login);
router.post('/init', initAdmin); // Call once to setup default admin

router.route('/profile')
  .get(protect, getProfile)
  .put(protect, upload.single('profilePhoto'), updateProfile);

router.put('/security', protect, updatePassword);

module.exports = router;
