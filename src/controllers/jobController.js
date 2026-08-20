const Job = require('../models/Job');
const Application = require('../models/Application');
const sendEmail = require('../utils/sendEmail');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Use OS temporary directory for Vercel compatibility
const resumeUploadDir = os.tmpdir();

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, resumeUploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const resumeFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and Word documents are allowed for resumes!'), false);
  }
};

const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: resumeFilter,
  limits: { fileSize: 4.5 * 1024 * 1024 } // Vercel strict limit is 4.5MB for Serverless function bodies
});

// @desc    Get all jobs with search and pagination
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res) => {
  try {
    const { keyword, category, location, page = 1, limit = 10 } = req.query;

    let query = { status: 'Active' };

    if (keyword) {
      query.title = { $regex: keyword, $options: 'i' };
    }
    if (category && category !== 'All Categories') {
      query.department = category;
    }
    if (location && location !== 'All Locations') {
      query.location = { $regex: location, $options: 'i' };
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const totalJobs = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    res.json({
      jobs,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalJobs / limitNumber),
      totalJobs
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (job) {
      res.json(job);
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get job categories and counts
// @route   GET /api/jobs/categories
// @access  Public
const getJobCategories = async (req, res) => {
  try {
    const categories = await Job.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $project: { name: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);

    const totalJobs = await Job.countDocuments({ status: 'Active' });

    res.json({
      total: totalJobs,
      categories
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getBaseUrl = (req) => `${req.protocol}://${req.get('host')}`;

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Public
const createJob = async (req, res) => {
  try {
    const jobData = { ...req.body };
    const baseUrl = getBaseUrl(req);

    // Convert empty strings to null to prevent CastError from FormData
    ['salaryMin', 'salaryMax', 'vacancies', 'applicationDeadline'].forEach(field => {
      if (jobData[field] === '') jobData[field] = null;
    });

    // Parse stringified arrays
    if (jobData.skills && typeof jobData.skills === 'string') {
      try { jobData.skills = JSON.parse(jobData.skills); } catch (e) { }
    }
    if (jobData.keywords && typeof jobData.keywords === 'string') {
      try { jobData.keywords = JSON.parse(jobData.keywords); } catch (e) { }
    }

    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        jobData.image = `${baseUrl}/uploads/${req.files.image[0].filename}`;
      }
      if (req.files.companyLogo && req.files.companyLogo[0]) {
        jobData.companyLogo = `${baseUrl}/uploads/${req.files.companyLogo[0].filename}`;
      }
    }

    const job = new Job(jobData);
    const createdJob = await job.save();
    res.status(201).json(createdJob);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Public
const updateJob = async (req, res) => {
  try {
    const jobData = { ...req.body };
    const baseUrl = getBaseUrl(req);

    // Convert empty strings to null to prevent CastError from FormData
    ['salaryMin', 'salaryMax', 'vacancies', 'applicationDeadline'].forEach(field => {
      if (jobData[field] === '') jobData[field] = null;
    });

    // Parse stringified arrays
    if (jobData.skills && typeof jobData.skills === 'string') {
      try { jobData.skills = JSON.parse(jobData.skills); } catch (e) { }
    }
    if (jobData.keywords && typeof jobData.keywords === 'string') {
      try { jobData.keywords = JSON.parse(jobData.keywords); } catch (e) { }
    }

    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        jobData.image = `${baseUrl}/uploads/${req.files.image[0].filename}`;
      }
      if (req.files.companyLogo && req.files.companyLogo[0]) {
        jobData.companyLogo = `${baseUrl}/uploads/${req.files.companyLogo[0].filename}`;
      }
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      jobData,
      { new: true, runValidators: true }
    );

    if (updatedJob) {
      res.json(updatedJob);
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Public
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (job) {
      await Job.deleteOne({ _id: job._id });
      res.json({ message: 'Job removed' });
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Apply for a job (sends email)
// @route   POST /api/jobs/:id/apply
// @access  Public
const applyJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const { fullName, email, phone, experience, coverLetter, resumeFileName } = req.body;

    // Save to Database
    const application = await Application.create({
      jobId: job._id,
      jobTitle: job.title,
      fullName,
      email,
      phone,
      experience,
      coverLetter,
      resumePath: req.file ? req.file.path : resumeFileName || null
    });

    // Construct email content
    const emailSubject = `New Job Application: ${job.title} - ${fullName}`;
    const emailHtml = `
      <h2>New Job Application Received</h2>
      <p><strong>Job Title:</strong> ${job.title} (${job.department})</p>
      <p><strong>Applicant Name:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Experience:</strong> ${experience}</p>
      <br />
      <h3>Cover Letter:</h3>
      <p>${coverLetter ? coverLetter.replace(/\n/g, '<br/>') : 'No cover letter provided.'}</p>
    `;

    const emailOptions = {
      email: job.companyEmail || process.env.SMTP_TO_ADMIN, // Send to the company email or fallback to admin
      subject: emailSubject,
      html: emailHtml,
      attachments: req.file ? [{
        filename: req.file.originalname,
        path: req.file.path
      }] : []
    };

    if (!req.body.skipEmail) {
      console.log(`Sending job application email for ${fullName}...`);
      await sendEmail(emailOptions);
      console.log(`Job application email sent for ${fullName}`);
    }

    res.status(200).json({ message: 'Application submitted successfully!', data: application });
  } catch (error) {
    console.error('Job Application Error (Vercel Log):', error.message, error.stack);
    res.status(500).json({ message: 'Failed to submit application', error: error.message || 'Unknown Server Error' });
  }
};

module.exports = {
  getJobs,
  getJobById,
  getJobCategories,
  createJob,
  updateJob,
  deleteJob,
  applyJob,
  uploadResume
};
