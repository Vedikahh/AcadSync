const Notification = require('../models/Notification');
const User = require('../models/User');
const socket = require('../utils/socket');
const mailService = require('../utils/mailService');
const emailTemplates = require('../utils/emailTemplates');
const { AuthorizationError, NotFoundError, ValidationError } = require('../utils/errorHandler');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/pagination');

const PREF_KEY_BY_TYPE = {
  event: 'event',
  approval: 'approval',
  rejection: 'rejection',
  reminder: 'reminder',
  announcement: 'announcement',
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

const buildAnnouncementAudienceQuery = ({ audienceType, role, department }) => {
  const query = {};
  if (audienceType === 'role') query.role = role;
  if (audienceType === 'department') query.department = department;
  return query;
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
    const announcementTitle = payload?.title || 'Announcement';
    const announcementContent = payload?.content || message;
    const announcementPriority = payload?.priority || 'normal';

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
      case 'announcement':
        htmlContent = emailTemplates.announcementNotification(announcementTitle, announcementContent, actionUrl, announcementPriority);
        break;
      default:
        htmlContent = emailTemplates.systemNotification(eventName, message, actionUrl);
    }

    const result = await mailService.sendMail({
      to: user.email,
      subject: message,
      html: htmlContent,
      text: message,
    });

    if (!result?.success) {
      throw new Error(result?.error || result?.message || 'Email delivery failed');
    }
  } catch (error) {
    console.error(`[NotificationController] Error sending email to ${user.email}:`, error.message);
  }
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

// @desc    Preview announcement audience size before publishing
// @route   POST /api/notifications/announcements/preview
// @access  Private (Admin, Organizer)
exports.previewAnnouncementAudience = async (req, res, next) => {
  try {
    const { audienceType, role, department } = req.body;
    const userQuery = buildAnnouncementAudienceQuery({ audienceType, role, department });
    const [targetCount, sampleUsers] = await Promise.all([
      User.countDocuments(userQuery),
      User.find(userQuery).select('name email role department').limit(3).lean(),
    ]);

    return res.json({
      audience: {
        type: audienceType,
        role: role || null,
        department: department || null,
      },
      targetCount,
      sampleRecipients: sampleUsers.map((user) => ({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || null,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create announcement notifications for selected audience
// @route   POST /api/notifications/announcements
// @access  Private (Admin, Organizer)
exports.createAnnouncement = async (req, res, next) => {
  try {
    const {
      title,
      content,
      audienceType,
      role,
      department,
      priority = 'normal',
      link,
    } = req.body;

    const userQuery = buildAnnouncementAudienceQuery({ audienceType, role, department });

    const users = await User.find(userQuery).select('_id');
    if (!users.length) {
      throw new ValidationError('No users found for the selected audience');
    }

    const message = content.trim();
    const userIds = users.map((user) => String(user._id));
    const normalizedLink = typeof link === 'string' && link.trim() ? link.trim() : '/notifications';
    const created = await exports.createNotificationsForUsers({
      userIds,
      message,
      type: 'announcement',
      link: normalizedLink,
      payloadBuilder: () => ({
        title: title.trim(),
        content: content.trim(),
        priority,
        audienceType,
        role: role || null,
        department: department || null,
        createdBy: req.user.id,
      }),
    });

    return res.status(201).json({
      message: 'Announcement published successfully',
      createdCount: created.length,
      targetCount: userIds.length,
      audience: {
        type: audienceType,
        role: role || null,
        department: department || null,
      },
      priority,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
  try {
    const { limit, offset, sort } = parsePaginationParams(req.query, {
      defaultSort: { createdAt: -1 },
      allowedSortFields: ['createdAt', 'read', 'type'],
    });

    // Only fetch for specific user OR global system events
    const baseQuery = {
      $or: [
        { userId: req.user.id },
        { userId: { $exists: false } } // system wide alerts
      ]
    };

    const [notifications, totalCount, unreadCount] = await Promise.all([
      Notification.find(baseQuery)
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .lean(),
      Notification.countDocuments(baseQuery),
      Notification.countDocuments({ ...baseQuery, read: false }),
    ]);

    return res.json({
      items: notifications,
      meta: {
        ...buildPaginationMeta({
          totalCount,
          limit,
          offset,
          returnedCount: notifications.length,
        }),
        sort,
        unreadCount,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) throw new NotFoundError('Not found');

    const isOwner = notif.userId && String(notif.userId) === String(req.user.id);
    const isGlobal = !notif.userId;
    if (!isOwner && !isGlobal) {
      throw new AuthorizationError('Not authorized to update this notification');
    }
    
    notif.read = true;
    await notif.save();
    
    res.json({ message: 'Marked as read', item: notif });
  } catch (err) {
    next(err);
  }
};
exports.markAllRead = async (req, res, next) => {
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
    next(err);
  }
};
