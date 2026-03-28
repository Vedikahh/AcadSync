const Event = require('../models/Event');
const Schedule = require('../models/Schedule');
const Notification = require('../models/Notification');
const User = require('../models/User');

function getTodayName() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

async function getUnreadNotificationsCount(userId) {
  return Notification.countDocuments({
    read: false,
    $or: [
      { userId },
      { userId: { $exists: false } },
    ],
  });
}

function roleResponse(role, stats) {
  return {
    role,
    stats,
    generatedAt: new Date().toISOString(),
  };
}

// @desc    Get role-aware dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const { role, id, department } = req.user;
    const todayName = getTodayName();

    if (role === 'admin') {
      const [
        totalStudents,
        pendingApprovals,
        approvedEvents,
        conflictReports,
        unreadNotifications,
        eventDepartments,
        scheduleDepartments,
      ] = await Promise.all([
        User.countDocuments({ role: 'student' }),
        Event.countDocuments({ status: 'pending' }),
        Event.countDocuments({ status: 'approved' }),
        Event.countDocuments({ 'conflicts.0': { $exists: true } }),
        getUnreadNotificationsCount(id),
        Event.distinct('department'),
        Schedule.distinct('department'),
      ]);

      const uniqueDepartments = new Set([
        ...(eventDepartments || []).filter(Boolean),
        ...(scheduleDepartments || []).filter(Boolean),
      ]);

      return res.json(
        roleResponse(role, {
          totalStudents,
          pendingApprovals,
          approvedEvents,
          conflictReports,
          unreadNotifications,
          activeDepartments: uniqueDepartments.size,
        })
      );
    }

    if (role === 'organizer') {
      const { start, end } = getMonthRange();
      const scheduleFilter = { day: todayName };

      if (department) {
        scheduleFilter.department = department;
      }

      const [
        classesToday,
        myConflictedEvents,
        examsThisMonth,
        approvedEvents,
        unreadNotifications,
      ] = await Promise.all([
        Schedule.countDocuments(scheduleFilter),
        Event.find({
          createdBy: id,
          'conflicts.0': { $exists: true },
        }).select('conflicts'),
        Schedule.countDocuments({
          type: 'exam',
          date: { $gte: start, $lt: end },
          ...(department ? { department } : {}),
        }),
        Event.countDocuments({
          createdBy: id,
          status: 'approved',
        }),
        getUnreadNotificationsCount(id),
      ]);

      const conflictAlerts = myConflictedEvents.length;
      const highPriorityConflicts = myConflictedEvents.filter(
        (event) => Array.isArray(event.conflicts) && event.conflicts.length > 1
      ).length;

      return res.json(
        roleResponse(role, {
          classesToday,
          conflictAlerts,
          highPriorityConflicts,
          examsThisMonth,
          approvedEvents,
          unreadNotifications,
        })
      );
    }

    if (role === 'student') {
      const scheduleFilter = { day: todayName };

      if (department) {
        scheduleFilter.department = department;
      }

      const [
        campusEvents,
        classesToday,
        conflictedApprovedEvents,
        unreadNotifications,
      ] = await Promise.all([
        Event.countDocuments({ status: 'approved' }),
        Schedule.countDocuments(scheduleFilter),
        Event.countDocuments({
          status: 'approved',
          'conflicts.0': { $exists: true },
        }),
        getUnreadNotificationsCount(id),
      ]);

      return res.json(
        roleResponse(role, {
          campusEvents,
          activeDay: 'Today',
          classesToday,
          conflictAlerts: conflictedApprovedEvents,
          unreadNotifications,
        })
      );
    }

    return res.status(403).json({ message: `Unsupported role: ${role}` });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
