const Event = require('../models/Event');
const User = require('../models/User');
const { checkConflicts } = require('../utils/conflictChecker');
const socket = require('../utils/socket');
const {
  createNotificationForUser,
  createNotificationsForUsers,
} = require('./notificationController');
const { scheduleEventReminder, cancelEventReminder } = require('../utils/eventReminderJob');


// @desc    Get all events
// @route   GET /api/events
// @access  Private (Anyone logged in)
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('createdBy', 'name email department')
      .populate('reviewedBy', 'name email')
      .sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get logged in user's events
// @route   GET /api/events/my-events
// @access  Private
exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user.id })
      .populate('createdBy', 'name')
      .populate('reviewedBy', 'name email')
      .sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a new event proposal
// @route   POST /api/events
// @access  Private (Students/Faculty)
exports.createEvent = async (req, res) => {
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
    const conflictResult = await checkConflicts({ date, startTime, endTime, type });
    const conflictMessages = (conflictResult.conflicts || []).map((c) => c.message || c);

    if (conflictResult.blocked) {
      return res.status(409).json({
        message: 'Schedule conflict with a higher-priority item. Please choose another time slot.',
        conflicts: conflictResult.conflicts,
        blockingConflicts: conflictResult.blockingConflicts,
        suggestions: conflictResult.suggestions,
        blocked: true,
      });
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

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Approve an event
// @route   PATCH /api/events/:id/approve
// @access  Private (Admin)
exports.approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

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

    // Schedule 24h reminder for the event
    scheduleEventReminder(event);

    // Real-time Update
    socket.getIO().emit('calendarUpdate', { type: 'event', action: 'approve', data: populatedEvent });

    res.json(populatedEvent);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Reject an event
// @route   PATCH /api/events/:id/reject
// @access  Private (Admin)
exports.rejectEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const providedReason = typeof req.body?.rejectionReason === 'string'
      ? req.body.rejectionReason
      : typeof req.body?.reason === 'string'
        ? req.body.reason
        : null;
    const rejectionReason = providedReason && providedReason.trim().length > 0
      ? providedReason.trim()
      : null;

    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required.' });
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

    // Cancel any scheduled reminders for this event
    cancelEventReminder(event._id);

    // Real-time Update
    socket.getIO().emit('calendarUpdate', { type: 'event', action: 'reject', data: populatedEvent });

    res.json(populatedEvent);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update event
// @route   PATCH /api/events/:id
// @access  Private (Owner/Admin)
exports.updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check ownership or admin
    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this event' });
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
        return res.status(409).json({
          message: 'Schedule conflict with a higher-priority item. Please choose another time slot.',
          conflicts: conflictResult.conflicts,
          blockingConflicts: conflictResult.blockingConflicts,
          suggestions: conflictResult.suggestions,
          blocked: true,
        });
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

    res.json(populatedEvent);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Owner/Admin)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    // Check ownership or admin
    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    // Cancel any scheduled reminders for this event
    cancelEventReminder(event._id);

    await event.deleteOne();

    // Real-time Update
    socket.getIO().emit('calendarUpdate', { type: 'event', action: 'delete', id: req.params.id });

    res.json({ message: 'Event removed' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Check conflicts for an event without creating it
// @route   POST /api/events/check-conflicts
// @access  Private (Students/Organizer)
exports.checkEventConflicts = async (req, res) => {
  try {
    const { date, startTime, endTime, type } = req.body;
    const { conflicts, suggestions, blockingConflicts, hasConflict, blocked } = await checkConflicts({ date, startTime, endTime, type });
    res.json({ conflicts, suggestions, blockingConflicts, hasConflict, blocked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
