require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const formRoutes = require('./routes/formRoutes');
const applicationRoutes = require('./routes/applicationRoutes');

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy for HTTPS detection (e.g. Render, Vercel)
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve temporary files for resume downloads
const os = require('os');
app.use('/tmp', express.static(os.tmpdir()));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/applications', applicationRoutes);


app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the JUMS Server API!' });
});

// Listen on port if not in Vercel Serverless environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export the app for Vercel Serverless environments
module.exports = app;
