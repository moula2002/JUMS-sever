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

    const recentActivity = [
      { id: 1, action: 'New order', target: '#12341', time: '10m ago' },
      { id: 2, action: 'New order', target: '#12342', time: '20m ago' },
      { id: 3, action: 'New order', target: '#12343', time: '30m ago' },
      { id: 4, action: 'New order', target: '#12344', time: '40m ago' },
    ];

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
