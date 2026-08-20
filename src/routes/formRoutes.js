const express = require('express');
const router = express.Router();
const { 
  submitContactForm, 
  submitPropertyEnquiry,
  getContacts,
  getContactById,
  updateContactStatus,
  deleteContact 
} = require('../controllers/formController');

router.route('/contact')
  .post(submitContactForm)
  .get(getContacts);

router.route('/contact/:id')
  .get(getContactById)
  .delete(deleteContact);

router.route('/contact/:id/status')
  .put(updateContactStatus);

router.post('/property-enquiry', submitPropertyEnquiry);

module.exports = router;
