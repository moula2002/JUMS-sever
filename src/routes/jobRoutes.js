const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  getJobs,
  getJobById,
  getJobCategories,
  createJob,
  updateJob,
  deleteJob
} = require('../controllers/jobController');

router.route('/')
  .get(getJobs)
  .post(upload.fields([{ name: 'image', maxCount: 1 }, { name: 'companyLogo', maxCount: 1 }]), createJob);

router.route('/categories')
  .get(getJobCategories);

router.route('/:id')
  .get(getJobById)
  .put(upload.fields([{ name: 'image', maxCount: 1 }, { name: 'companyLogo', maxCount: 1 }]), updateJob)
  .delete(deleteJob);

module.exports = router;
