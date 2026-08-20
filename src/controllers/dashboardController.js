const Job = require('../models/Job');
const Admin = require('../models/Admin');
const Application = require('../models/Application');
const Contact = require('../models/Contact');

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

    // Aggregate chart data for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const appAgg = await Application.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          count: { $sum: 1 }
        }
      }
    ]);

    const enqAgg = await Contact.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          count: { $sum: 1 }
        }
      }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1; // 1-12
      const y = d.getFullYear();
      
      const appCount = appAgg.find(a => a._id.month === m && a._id.year === y)?.count || 0;
      const enqCount = enqAgg.find(e => e._id.month === m && e._id.year === y)?.count || 0;
      
      chartData.push({
        name: monthNames[m - 1],
        applications: appCount,
        enquiries: enqCount
      });
    }

    res.json({
      stats,
      recentActivity,
      chartData
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats
};
