const express = require('express');
const router = express.Router();
const {
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication
} = require('../controllers/applicationController');

router.route('/')
  .get(getApplications);

router.route('/:id')
  .get(getApplicationById)
  .delete(deleteApplication);

router.route('/:id/status')
  .put(updateApplicationStatus);

module.exports = router;
