const Job = require('../models/Job');
const Admin = require('../models/Admin');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Public
const getDashboardStats = async (req, res) => {
  try {
    const jobsCount = await Job.countDocuments();
    const activeJobsCount = await Job.countDocuments({ status: 'Active' });
    const adminsCount = await Admin.countDocuments();
    
    const stats = [
      { id: 1, title: 'Total Jobs', value: jobsCount.toString(), iconName: 'Briefcase', trend: 'up', trendValue: '+10.2%' },
      { id: 2, title: 'Active Jobs', value: activeJobsCount.toString(), iconName: 'Activity', trend: 'up', trendValue: '+5.1%' },
      { id: 3, title: 'Total Admins', value: adminsCount.toString(), iconName: 'Users', trend: 'up', trendValue: '+0.0%' },
    ];

    const recentJobs = await Job.find().sort({ createdAt: -1 }).limit(5);
    
    const timeAgo = (date) => {
      const seconds = Math.floor((new Date() - date) / 1000);
      let interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + 'd ago';
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + 'h ago';
      interval = seconds / 60;
      if (interval >= 1) return Math.floor(interval) + 'm ago';
      return 'Just now';
    };

    const recentActivity = recentJobs.map(job => ({
      id: job._id,
      action: 'New job posted:',
      target: job.title,
      time: timeAgo(job.createdAt)
    }));

    res.json({
      stats,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats
};
