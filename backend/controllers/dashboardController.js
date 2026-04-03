const Event = require('../models/Event');
const Schedule = require('../models/Schedule');
const Notification = require('../models/Notification');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { AuthorizationError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

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
exports.getDashboardStats = async (req, res, next) => {
  try {
    const { role, id, department } = req.user;
    const todayName = getTodayName();
    logger.debug(`Dashboard stats requested by user ${id} with role ${role}`);

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
        conflictSummary,
        examsThisMonth,
        approvedEvents,
        unreadNotifications,
      ] = await Promise.all([
        Schedule.countDocuments(scheduleFilter),
        Event.aggregate([
          {
            $match: {
              createdBy: req.user._id,
              'conflicts.0': { $exists: true },
            },
          },
          {
            $group: {
              _id: null,
              conflictAlerts: { $sum: 1 },
              highPriorityConflicts: {
                $sum: {
                  $cond: [
                    { $gt: [{ $size: '$conflicts' }, 1] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ]),
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

      const summary = conflictSummary[0] || { conflictAlerts: 0, highPriorityConflicts: 0 };
      const conflictAlerts = summary.conflictAlerts || 0;
      const highPriorityConflicts = summary.highPriorityConflicts || 0;

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

    throw new AuthorizationError(`Unsupported role: ${role}`);
  } catch (err) {
    return next(err);
  }
};

// @desc    Get paginated/filterable audit logs (admin)
// @route   GET /api/dashboard/audit-logs
// @access  Private (Admin)
exports.getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const { action, entityType, actorId, from, to, search } = req.query;
    const filter = {};

    if (action) {
      filter.action = action;
    }

    if (entityType) {
      filter['target.entityType'] = entityType;
    }

    if (actorId) {
      filter['actor.id'] = actorId;
    }

    if (from || to) {
      filter.createdAt = {};

      if (from) {
        const fromDate = new Date(from);
        if (!Number.isNaN(fromDate.getTime())) {
          filter.createdAt.$gte = fromDate;
        }
      }

      if (to) {
        const toDate = new Date(to);
        if (!Number.isNaN(toDate.getTime())) {
          filter.createdAt.$lte = toDate;
        }
      }

      if (Object.keys(filter.createdAt).length === 0) {
        delete filter.createdAt;
      }
    }

    if (search && String(search).trim()) {
      const escapedSearch = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');

      filter.$or = [
        { action: searchRegex },
        { 'target.entityType': searchRegex },
        { 'target.entityId': searchRegex },
        { 'target.label': searchRegex },
      ];
    }

    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actor.id', 'name email role')
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    return next(err);
  }
};
