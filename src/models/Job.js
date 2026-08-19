const mongoose = require('mongoose');

const jobSchema = mongoose.Schema({
  // Basic Job Details
  title: { type: String, required: true },
  image: { type: String }, // Optional job image URL
  department: { type: String, required: true },
  type: { type: String, required: true },
  location: { type: String, required: true },
  vacancies: { type: Number, required: true, default: 1 },

  // Experience & Qualification
  experience: { type: String, required: true },
  qualification: { type: String, required: true },
  skills: [{ type: String }],

  // Salary Details
  salaryType: { type: String, enum: ['Fixed', 'Range', 'Negotiable'], default: 'Range' },
  salaryMin: { type: Number },
  salaryMax: { type: Number },

  // Job Description
  shortDescription: { type: String, required: true },
  jobDescription: { type: String, required: true },
  responsibilities: { type: String, required: true },
  requirements: { type: String, required: true },

  // Company Information
  companyName: { type: String, required: true },
  companyLogo: { type: String },
  companyWebsite: { type: String },
  companyEmail: { type: String },
  companyPhone: { type: String },

  // Application Details
  applicationDeadline: { type: Date, required: true },
  applicationMethod: { type: String, enum: ['Apply Form', 'Email', 'External Link'], default: 'Apply Form' },
  applyLink: { type: String, required: true },

  // Status & Visibility
  status: { type: String, enum: ['Active', 'Draft', 'Closed'], default: 'Active' },
  featured: { type: Boolean, default: false },
  urgentHiring: { type: Boolean, default: false },

  // SEO Fields
  metaTitle: { type: String },
  metaDescription: { type: String },
  keywords: [{ type: String }],

}, {
  timestamps: true,
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
