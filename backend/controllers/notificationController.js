const Notification = require('../models/Notification');
const User = require('../models/User');
const socket = require('../utils/socket');
const mailService = require('../utils/mailService');
const emailTemplates = require('../utils/emailTemplates');

const PREF_KEY_BY_TYPE = {
  event: 'event',
  approval: 'approval',
  rejection: 'rejection',
  reminder: 'reminder',
};

const shouldDeliverNotification = (notificationType, notificationPreferences = {}, notificationChannels = {}) => {
  const prefKey = PREF_KEY_BY_TYPE[notificationType];
  if (!prefKey) return true;

  const channelSetting = notificationChannels?.[prefKey]?.inApp;
  if (typeof channelSetting === 'boolean') {
    return channelSetting;
  }

  const enabled = notificationPreferences[prefKey];
  return enabled !== false;
};

const shouldSendEmail = (notificationType, emailPreferences = {}, notificationChannels = {}) => {
  if (!emailPreferences.enabled) return false;
  const prefKey = PREF_KEY_BY_TYPE[notificationType];
  if (!prefKey) return false;

  const channelSetting = notificationChannels?.[prefKey]?.email;
  if (typeof channelSetting === 'boolean') {
    return channelSetting;
  }

  const enabled = emailPreferences[prefKey];
  return enabled !== false;
};

const sendEmailNotification = async (user, notification) => {
  try {
    if (!shouldSendEmail(notification.type, user.emailPreferences || {}, user.notificationChannels || {})) {
      return;
    }

    const { type, message, link, payload } = notification;
    let htmlContent;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const actionUrl = link ? `${baseUrl}${link}` : baseUrl;

    const eventName = payload?.eventName || 'Event';
    const eventDetails = payload?.eventDetails || '';
    const requesterName = payload?.requesterName || 'Admin';
    const reason = payload?.reason || '';
    const eventTime = payload?.eventTime || '';
    const conflictDetails = payload?.conflictDetails || '';

    switch (type) {
      case 'event':
        htmlContent = emailTemplates.eventNotification(eventName, eventDetails, actionUrl);
        break;
      case 'approval':
        htmlContent = emailTemplates.approvalNotification(eventName, requesterName, actionUrl);
        break;
      case 'rejection':
        htmlContent = emailTemplates.rejectionNotification(eventName, reason, actionUrl);
        break;
      case 'reminder':
        htmlContent = emailTemplates.remindNotification(eventName, eventTime, actionUrl);
        break;
      case 'conflict':
        htmlContent = emailTemplates.conflictNotification(eventName, conflictDetails, actionUrl);
        break;
      default:
        htmlContent = emailTemplates.systemNotification(eventName, message, actionUrl);
    }

    await mailService.sendMail({
      to: user.email,
      subject: message,
      html: htmlContent,
      text: message,
    });
  } catch (error) {
    console.error(`[NotificationController] Error sending email to ${user.email}:`, error.message);
  }
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

  const user = await User.findById(userId).select('notificationPreferences notificationChannels emailPreferences name email');
  if (!user) return null;
  if (!shouldDeliverNotification(type, user.notificationPreferences || {}, user.notificationChannels || {})) return null;

  const notification = await Notification.create({ userId, message, type, link, payload });

  socket.emitToUser(userId, 'notification:new', notification);

  // Send email asynchronously (non-blocking)
  sendEmailNotification(user, notification).catch((error) => {
    console.error(`[NotificationController] Failed to send email notification:`, error);
  });

  return notification;
};

exports.createNotificationsForUsers = async ({ userIds = [], message, type = 'system', link, payloadBuilder }) => {
  if (!Array.isArray(userIds) || userIds.length === 0 || !message) return [];

  const uniqueUserIds = [...new Set(userIds.map((id) => String(id)))];
  const users = await User.find({ _id: { $in: uniqueUserIds } }).select('_id name email notificationPreferences notificationChannels emailPreferences');

  const notificationsToInsert = [];
  const allowedUsers = [];
  const emailUsers = [];

  users.forEach((user) => {
    if (!shouldDeliverNotification(type, user.notificationPreferences || {}, user.notificationChannels || {})) return;

    const userId = String(user._id);
    const payload = typeof payloadBuilder === 'function' ? payloadBuilder(userId) : undefined;
    const notification = { userId, message, type, link };
    if (payload !== undefined) {
      notification.payload = payload;
    }
    notificationsToInsert.push(notification);
    allowedUsers.push(userId);

    if (shouldSendEmail(type, user.emailPreferences || {}, user.notificationChannels || {})) {
      emailUsers.push({ user, notification });
    }
  });

  if (!notificationsToInsert.length) return [];

  const inserted = await Notification.insertMany(notificationsToInsert);
  inserted.forEach((notification, idx) => {
    socket.emitToUser(allowedUsers[idx], 'notification:new', notification);
  });

  // Send emails asynchronously (non-blocking)
  emailUsers.forEach((item, idx) => {
    sendEmailNotification(item.user, inserted[idx]).catch((error) => {
      console.error(`[NotificationController] Failed to send batch email:`, error);
    });
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
