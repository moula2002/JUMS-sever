const express = require('express');
const router = express.Router();
const { submitContactForm, submitPropertyEnquiry } = require('../controllers/formController');

router.post('/contact', submitContactForm);
router.post('/property-enquiry', submitPropertyEnquiry);

module.exports = router;
