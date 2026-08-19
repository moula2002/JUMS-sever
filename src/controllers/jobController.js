const Job = require('../models/Job');

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
      try { jobData.skills = JSON.parse(jobData.skills); } catch (e) {}
    }
    if (jobData.keywords && typeof jobData.keywords === 'string') {
      try { jobData.keywords = JSON.parse(jobData.keywords); } catch (e) {}
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
      try { jobData.skills = JSON.parse(jobData.skills); } catch (e) {}
    }
    if (jobData.keywords && typeof jobData.keywords === 'string') {
      try { jobData.keywords = JSON.parse(jobData.keywords); } catch (e) {}
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

module.exports = {
  getJobs,
  getJobById,
  getJobCategories,
  createJob,
  updateJob,
  deleteJob
};
