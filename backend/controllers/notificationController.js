const Notification = require('../models/Notification');
const User = require('../models/User');
const socket = require('../utils/socket');

const PREF_KEY_BY_TYPE = {
  event: 'event',
  approval: 'approval',
  rejection: 'rejection',
  reminder: 'reminder',
};

const shouldDeliverNotification = (notificationType, notificationPreferences = {}) => {
  const prefKey = PREF_KEY_BY_TYPE[notificationType];
  if (!prefKey) return true;

  const enabled = notificationPreferences[prefKey];
  return enabled !== false;
};

const normalizePagination = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit };
};

const shapeListResponse = ({ items, page, limit, totalItems }) => {
  const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
  return {
    items,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

exports.createNotificationForUser = async ({ userId, message, type = 'system', link, payload }) => {
  if (!userId || !message) return null;

  const user = await User.findById(userId).select('notificationPreferences');
  if (!user) return null;
  if (!shouldDeliverNotification(type, user.notificationPreferences || {})) return null;

  const notification = await Notification.create({ userId, message, type, link, payload });

  socket.emitToUser(userId, 'notification:new', notification);
  return notification;
};

exports.createNotificationsForUsers = async ({ userIds = [], message, type = 'system', link, payloadBuilder }) => {
  if (!Array.isArray(userIds) || userIds.length === 0 || !message) return [];

  const uniqueUserIds = [...new Set(userIds.map((id) => String(id)))];
  const users = await User.find({ _id: { $in: uniqueUserIds } }).select('_id notificationPreferences');

  const notificationsToInsert = [];
  const allowedUsers = [];

  users.forEach((user) => {
    if (!shouldDeliverNotification(type, user.notificationPreferences || {})) return;

    const userId = String(user._id);
    const payload = typeof payloadBuilder === 'function' ? payloadBuilder(userId) : undefined;
    const notification = { userId, message, type, link };
    if (payload !== undefined) {
      notification.payload = payload;
    }
    notificationsToInsert.push(notification);
    allowedUsers.push(userId);
  });

  if (!notificationsToInsert.length) return [];

  const inserted = await Notification.insertMany(notificationsToInsert);
  inserted.forEach((notification, idx) => {
    socket.emitToUser(allowedUsers[idx], 'notification:new', notification);
  });

  return inserted;
};

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const { page, limit } = normalizePagination(req.query);

    // Only fetch for specific user OR global system events
    const baseQuery = {
      $or: [
        { userId: req.user.id },
        { userId: { $exists: false } } // system wide alerts
      ]
    };

    const [notifications, totalItems, unreadCount] = await Promise.all([
      Notification.find(baseQuery)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(baseQuery),
      Notification.countDocuments({ ...baseQuery, read: false }),
    ]);
    
    const response = shapeListResponse({
      items: notifications,
      page,
      limit,
      totalItems,
    });

    response.meta = {
      unreadCount,
      fetchedAt: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Mark as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ message: 'Not found' });

    const isOwner = notif.userId && String(notif.userId) === String(req.user.id);
    const isGlobal = !notif.userId;
    if (!isOwner && !isGlobal) {
      return res.status(403).json({ message: 'Not authorized to update this notification' });
    }
    
    notif.read = true;
    await notif.save();
    
    res.json({ message: 'Marked as read', item: notif });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.markAllRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { 
        $or: [
          { userId: req.user.id },
          { userId: { $exists: false } }
        ],
        read: false
      },
      { read: true }
    );
    res.json({
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount || 0,
      meta: {
        markedAllAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
