const Event = require('../models/Event');
const User = require('../models/User');
const { checkConflicts } = require('../utils/conflictChecker');
const socket = require('../utils/socket');
const {
  createNotificationForUser,
  createNotificationsForUsers,
} = require('./notificationController');
const { scheduleEventReminder, cancelEventReminder } = require('../utils/eventReminderJob');
const { writeAuditLog, createDiffSummary } = require('../utils/auditLogger');
const { getAiConflictConfig } = require('../config/env');
const { generateConflictAssistance } = require('../services/aiConflictAssistant');
const { generateAdminAssistance } = require('../services/aiAdminAssistant');
const {
  ValidationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
} = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/pagination');


// @desc    Get all events
// @route   GET /api/events
// @access  Private (Anyone logged in)
exports.getEvents = async (req, res, next) => {
  try {
    const { limit, offset, sort } = parsePaginationParams(req.query, {
      defaultSort: { date: 1, startTime: 1, createdAt: -1 },
      allowedSortFields: ['date', 'startTime', 'createdAt', 'title', 'status', 'department', 'type'],
    });

    const [events, totalCount] = await Promise.all([
      Event.find()
        .populate('createdBy', 'name email department')
        .populate('reviewedBy', 'name email')
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .lean(),
      Event.countDocuments(),
    ]);

    return res.json({
      items: events,
      meta: {
        ...buildPaginationMeta({
          totalCount,
          limit,
          offset,
          returnedCount: events.length,
        }),
        sort,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get logged in user's events
// @route   GET /api/events/my-events
// @access  Private
exports.getMyEvents = async (req, res, next) => {
  try {
    const { limit, offset, sort } = parsePaginationParams(req.query, {
      defaultSort: { date: 1, startTime: 1, createdAt: -1 },
      allowedSortFields: ['date', 'startTime', 'createdAt', 'title', 'status', 'department', 'type'],
    });

    const filter = { createdBy: req.user.id };
    const [events, totalCount] = await Promise.all([
      Event.find(filter)
        .populate('createdBy', 'name')
        .populate('reviewedBy', 'name email')
        .sort(sort)
        .skip(offset)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
    ]);

    return res.json({
      items: events,
      meta: {
        ...buildPaginationMeta({
          totalCount,
          limit,
          offset,
          returnedCount: events.length,
        }),
        sort,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new event proposal
// @route   POST /api/events
// @access  Private (Students/Faculty)
exports.createEvent = async (req, res, next) => {
  try {
    const {
      title,
      description,
      department,
      type,
      venue,
      date,
      startTime,
      endTime,
      participants,
      organizer,
      category,
    } = req.body;

    // Run overlap check
    const ai = getAiConflictConfig();
    const conflictResult = await checkConflicts({ date, startTime, endTime, type });
    const conflictMessages = (conflictResult.conflicts || []).map((c) => c.message || c);

    if (conflictResult.blocked) {
      throw new ConflictError('Schedule conflict with a higher-priority item. Please choose another time slot.');
    }

    const event = await Event.create({
      title,
      description,
      department,
      type: type || 'event',
      venue,
      date,
      startTime,
      endTime,
      participants,
      organizer,
      category,
      createdBy: req.user.id,
      status: 'pending',
      conflicts: conflictMessages // attach calculated conflicts
    });

    // Notify admins about the new event request
    const admins = await User.find({ role: 'admin' });
    const adminIds = admins.map((admin) => admin._id);

    await createNotificationsForUsers({
      userIds: adminIds,
      message: `New event request: "${title}" is pending approval.`,
      type: 'event',
      link: '/manage',
      payloadBuilder: (userId) => ({ eventId: event._id, recipientId: userId }),
    });

    if (conflictMessages.length > 0) {
      await createNotificationsForUsers({
        userIds: adminIds,
        message: `Conflict Warning: New event "${title}" has ${conflictMessages.length} overlapping issue(s).`,
        type: 'conflict',
        link: '/conflict',
        payloadBuilder: (userId) => ({ eventId: event._id, recipientId: userId, conflictCount: conflictMessages.length }),
      });
    }

    // Real-time Update
    socket.getIO().emit('calendarUpdate', { type: 'event', action: 'create', data: event });

    res.status(201).json(event);
    logger.info(`Event created: ${event._id} by ${req.user.id}`);

  } catch (err) {
    next(err);
  }
};

// @desc    Approve an event
// @route   PATCH /api/events/:id/approve
// @access  Private (Admin)
exports.approveEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) throw new NotFoundError('Event not found');
    if (event.status !== 'pending') {
      throw new ConflictError('Only pending events can be approved.');
    }

    const beforeEvent = {
      status: event.status,
      adminReviewNote: event.adminReviewNote,
      rejectionReason: event.rejectionReason,
      reviewedBy: event.reviewedBy,
      reviewedAt: event.reviewedAt,
    };

    const providedNote = typeof req.body?.adminReviewNote === 'string'
      ? req.body.adminReviewNote
      : typeof req.body?.note === 'string'
        ? req.body.note
        : null;

    const adminReviewNote = providedNote && providedNote.trim().length > 0
      ? providedNote.trim()
      : null;

    event.status = 'approved';
    event.adminReviewNote = adminReviewNote;
    event.rejectionReason = null;
    event.reviewedBy = req.user.id;
    event.reviewedAt = new Date();
    await event.save();
    const populatedEvent = await Event.findById(event._id)
      .populate('createdBy', 'name email department')
      .populate('reviewedBy', 'name email');

    // Create Approval Notification for the requester
    const approvalNoteLine = adminReviewNote ? ` Note: ${adminReviewNote}` : '';
    await createNotificationForUser({
      userId: event.createdBy,
      message: `Your event "${event.title}" has been officially approved.${approvalNoteLine}`,
      type: 'approval',
      link: '/events',
      payload: {
        eventId: event._id,
        reviewedBy: req.user.id,
      },
    });

    // Notify all users about the approved event
    const allUsers = await User.find({}).select('_id');
    const allUserIds = allUsers
      .map((user) => String(user._id))
      .filter((id) => id !== String(event.createdBy));
    
    if (allUserIds.length > 0) {
      await createNotificationsForUsers({
        userIds: allUserIds,
        message: `New approved event: "${event.title}" is now available on campus.`,
        type: 'approval',
        link: '/events',
        payloadBuilder: (userId) => ({ eventId: event._id, recipientId: userId }),
      });
    }

    // Schedule 24h reminder for the event
    scheduleEventReminder(event);

    // Real-time Update
    socket.getIO().emit('calendarUpdate', { type: 'event', action: 'approve', data: populatedEvent });

    await writeAuditLog(req, {
      action: 'event.approve',
      target: {
        entityType: 'event',
        entityId: event._id,
        label: event.title,
      },
      metadata: {
        status: event.status,
        organizerId: String(event.createdBy),
      },
      diffSummary: createDiffSummary(beforeEvent, {
        status: event.status,
        adminReviewNote: event.adminReviewNote,
        rejectionReason: event.rejectionReason,
        reviewedBy: event.reviewedBy,
        reviewedAt: event.reviewedAt,
      }, ['status', 'adminReviewNote', 'rejectionReason', 'reviewedBy', 'reviewedAt']),
    });

    res.json(populatedEvent);
    logger.info(`Event approved: ${event._id} by ${req.user.id}`);

  } catch (err) {
    next(err);
  }
};

// @desc    Reject an event
// @route   PATCH /api/events/:id/reject
// @access  Private (Admin)
exports.rejectEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) throw new NotFoundError('Event not found');
    if (event.status !== 'pending') {
      throw new ConflictError('Only pending events can be rejected.');
    }

    const beforeEvent = {
      status: event.status,
      adminReviewNote: event.adminReviewNote,
      rejectionReason: event.rejectionReason,
      reviewedBy: event.reviewedBy,
      reviewedAt: event.reviewedAt,
    };

    const providedReason = typeof req.body?.rejectionReason === 'string'
      ? req.body.rejectionReason
      : typeof req.body?.reason === 'string'
        ? req.body.reason
        : null;
    const rejectionReason = providedReason && providedReason.trim().length > 0
      ? providedReason.trim()
      : null;

    if (!rejectionReason) {
      throw new ValidationError('Rejection reason is required.');
    }

    const providedNote = typeof req.body?.adminReviewNote === 'string'
      ? req.body.adminReviewNote
      : typeof req.body?.note === 'string'
        ? req.body.note
        : null;
    const adminReviewNote = providedNote && providedNote.trim().length > 0
      ? providedNote.trim()
      : null;

    event.status = 'rejected';
    event.rejectionReason = rejectionReason;
    event.adminReviewNote = adminReviewNote;
    event.reviewedBy = req.user.id;
    event.reviewedAt = new Date();
    await event.save();
    const populatedEvent = await Event.findById(event._id)
      .populate('createdBy', 'name email department')
      .populate('reviewedBy', 'name email');

    const noteLine = adminReviewNote ? ` Additional note: ${adminReviewNote}` : '';

    // Notify event creator about rejection
    await createNotificationForUser({
      userId: event.createdBy,
      message: `Your event proposal "${event.title}" was declined. Reason: ${rejectionReason}.${noteLine} You can edit and resubmit for review.`,
      type: 'rejection',
      link: '/events',
      payload: {
        eventId: event._id,
        reviewedBy: req.user.id,
      },
    });

    // Notify all admins about the rejection
    const admins = await User.find({ role: 'admin' }).select('_id');
    const adminIds = admins
      .map((admin) => String(admin._id))
      .filter((id) => id !== String(event.createdBy));
    
    if (adminIds.length > 0) {
      await createNotificationsForUsers({
        userIds: adminIds,
        message: `Event "${event.title}" has been rejected. Reason: ${rejectionReason}`,
        type: 'rejection',
        link: '/manage-events',
        payloadBuilder: (userId) => ({ eventId: event._id, recipientId: userId, rejectionReason }),
      });
    }

    // Cancel any scheduled reminders for this event
    cancelEventReminder(event._id);

    // Real-time Update
    socket.getIO().emit('calendarUpdate', { type: 'event', action: 'reject', data: populatedEvent });

    await writeAuditLog(req, {
      action: 'event.reject',
      target: {
        entityType: 'event',
        entityId: event._id,
        label: event.title,
      },
      metadata: {
        status: event.status,
        organizerId: String(event.createdBy),
      },
      diffSummary: createDiffSummary(beforeEvent, {
        status: event.status,
        adminReviewNote: event.adminReviewNote,
        rejectionReason: event.rejectionReason,
        reviewedBy: event.reviewedBy,
        reviewedAt: event.reviewedAt,
      }, ['status', 'adminReviewNote', 'rejectionReason', 'reviewedBy', 'reviewedAt']),
    });

    res.json(populatedEvent);
    logger.info(`Event rejected: ${event._id} by ${req.user.id}`);

  } catch (err) {
    next(err);
  }
};

// @desc    Update event
// @route   PATCH /api/events/:id
// @access  Private (Owner/Admin)
exports.updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);
    if (!event) throw new NotFoundError('Event not found');

    const beforeEvent = {
      title: event.title,
      description: event.description,
      venue: event.venue,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      type: event.type,
      participants: event.participants,
      organizer: event.organizer,
      category: event.category,
      status: event.status,
    };

    // Check ownership or admin
    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new AuthorizationError('Not authorized to update this event');
    }

    const { title, description, venue, date, startTime, endTime, participants, organizer, category, type } = req.body;
    
    // Only recalculate conflicts if time/venue changed
    if (venue || date || startTime || endTime || type) {
      const conflictResult = await checkConflicts({ 
        date: date || event.date, 
        startTime: startTime || event.startTime, 
        endTime: endTime || event.endTime,
        type: type || event.type
      });

      if (conflictResult.blocked) {
        throw new ConflictError('Schedule conflict with a higher-priority item. Please choose another time slot.');
      }

      event.conflicts = (conflictResult.conflicts || []).map((c) => c.message || c);
    }

    event.title = title || event.title;
    event.description = description || event.description;
    event.venue = venue || event.venue;
    event.date = date || event.date;
    event.startTime = startTime || event.startTime;
    event.endTime = endTime || event.endTime;
    event.type = type || event.type;
    event.participants = participants || event.participants;
    event.organizer = organizer || event.organizer;
    event.category = category || event.category;

    // Reset status to pending if updated by non-admin? 
    // Usually if an organizer edits, it should go back to pending.
    if (req.user.role !== 'admin') {
      event.status = 'pending';
      event.adminReviewNote = null;
      event.rejectionReason = null;
      event.reviewedBy = null;
      event.reviewedAt = null;
    }

    const updatedEvent = await event.save();
    const populatedEvent = await Event.findById(updatedEvent._id)
      .populate('createdBy', 'name email department')
      .populate('reviewedBy', 'name email');

    // Real-time Update
    socket.getIO().emit('calendarUpdate', { type: 'event', action: 'update', data: populatedEvent });

    await writeAuditLog(req, {
      action: 'event.update',
      target: {
        entityType: 'event',
        entityId: populatedEvent._id,
        label: populatedEvent.title,
      },
      metadata: {
        status: populatedEvent.status,
        updatedByRole: req.user.role,
      },
      diffSummary: createDiffSummary(beforeEvent, {
        title: populatedEvent.title,
        description: populatedEvent.description,
        venue: populatedEvent.venue,
        date: populatedEvent.date,
        startTime: populatedEvent.startTime,
        endTime: populatedEvent.endTime,
        type: populatedEvent.type,
        participants: populatedEvent.participants,
        organizer: populatedEvent.organizer,
        category: populatedEvent.category,
        status: populatedEvent.status,
      }, ['title', 'description', 'venue', 'date', 'startTime', 'endTime', 'type', 'participants', 'organizer', 'category', 'status']),
    });

    res.json(populatedEvent);
    logger.info(`Event updated: ${populatedEvent._id} by ${req.user.id}`);

  } catch (err) {
    next(err);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Owner/Admin)
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) throw new NotFoundError('Event not found');
    
    // Check ownership or admin
    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new AuthorizationError('Not authorized to delete this event');
    }

    const deletedEvent = {
      id: event._id,
      title: event.title,
      status: event.status,
      department: event.department,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      createdBy: event.createdBy,
    };

    // Cancel any scheduled reminders for this event
    cancelEventReminder(event._id);

    await event.deleteOne();

    // Real-time Update
    socket.getIO().emit('calendarUpdate', { type: 'event', action: 'delete', id: req.params.id });

    await writeAuditLog(req, {
      action: 'event.delete',
      target: {
        entityType: 'event',
        entityId: deletedEvent.id,
        label: deletedEvent.title,
      },
      metadata: {
        status: deletedEvent.status,
        department: deletedEvent.department,
        date: deletedEvent.date,
        startTime: deletedEvent.startTime,
        endTime: deletedEvent.endTime,
        organizerId: String(deletedEvent.createdBy),
      },
      diffSummary: [],
    });

    res.json({ message: 'Event removed' });
    logger.info(`Event deleted: ${deletedEvent.id} by ${req.user.id}`);

  } catch (err) {
    next(err);
  }
};

// @desc    Check conflicts for an event without creating it
// @route   POST /api/events/check-conflicts
// @access  Private (Students/Organizer)
exports.checkEventConflicts = async (req, res, next) => {
  try {
    const ai = getAiConflictConfig();
    const { date, startTime, endTime, type } = req.body;
    const { conflicts, suggestions, blockingConflicts, hasConflict, blocked } = await checkConflicts({ date, startTime, endTime, type });
    res.json({
      conflicts,
      suggestions,
      blockingConflicts,
      hasConflict,
      blocked,
      ai,
      suggestionEngine: ai.available ? 'ai-plus-rules' : 'rules-only',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get AI-assisted conflict explanation and ranked suggestions
// @route   POST /api/events/ai-conflict-assistance
// @access  Private (Organizer/Admin)
exports.getConflictAssistance = async (req, res, next) => {
  try {
    const ai = getAiConflictConfig();
    const payload = req.body || {};
    const event = payload.event || {};

    const result = await generateConflictAssistance({
      event,
      providedState: {
        conflicts: payload.conflicts,
        blockingConflicts: payload.blockingConflicts,
        suggestions: payload.suggestions,
        hasConflict: payload.hasConflict,
        blocked: payload.blocked,
      },
      aiConfig: ai,
      timeoutMs: 5000,
    });

    return res.json({
      ...result,
      ai,
      suggestionEngine: result.source === 'ai' ? 'ai-plus-rules' : 'rules-only',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get AI-assisted admin decision recommendation for conflicting proposal
// @route   POST /api/events/ai-admin-assistance
// @access  Private (Admin)
exports.getAdminAssistance = async (req, res, next) => {
  try {
    const ai = getAiConflictConfig();
    const payload = req.body || {};

    const result = await generateAdminAssistance({
      eventMeta: payload.event || {},
      conflictDetail: payload.conflictDetail || {},
      policyFlags: payload.policyFlags || {},
      aiConfig: ai,
      timeoutMs: 5000,
    });

    return res.json({
      ...result,
      ai,
      suggestionEngine: result.source === 'ai' ? 'ai-plus-rules' : 'rules-only',
    });
  } catch (err) {
    next(err);
  }
};
