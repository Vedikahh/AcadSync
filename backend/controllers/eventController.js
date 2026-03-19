const Event = require('../models/Event');
const Notification = require('../models/Notification');
const { checkConflicts } = require('../utils/conflictChecker');

// @desc    Get all events
// @route   GET /api/events
// @access  Private (Anyone logged in)
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('createdBy', 'name email department')
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
    const { title, description, department, venue, date, startTime, endTime } = req.body;

    // Run overlap check
    const { conflicts } = await checkConflicts({ date, startTime, endTime, venue });

    const event = await Event.create({
      title,
      description,
      department,
      venue,
      date,
      startTime,
      endTime,
      createdBy: req.user.id,
      status: 'pending',
      conflicts: conflicts // attach calculated conflicts
    });

    // Notify admins if there is a conflict
    if (conflicts.length > 0) {
      // Find all admins (mock approach without importing User, usually find roles)
      // Just creating a system notification log
      await Notification.create({
        message: `Conflict Warning: New event "${title}" has ${conflicts.length} overlapping issue(s).`,
        type: 'conflict',
        link: '/conflict'
      });
    }

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

    event.status = 'approved';
    await event.save();
    const populatedEvent = await Event.findById(event._id).populate('createdBy', 'name email department');

    // Create Approval Notification for the requester
    await Notification.create({
      userId: event.createdBy,
      message: `Your event "${event.title}" has been officially approved.`,
      type: 'approval',
      link: '/events'
    });

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

    event.status = 'rejected';
    await event.save();
    const populatedEvent = await Event.findById(event._id).populate('createdBy', 'name email department');

    await Notification.create({
      userId: event.createdBy,
      message: `Your event proposal "${event.title}" was declined.`,
      type: 'rejection',
      link: '/events'
    });

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

    const { title, description, venue, date, startTime, endTime } = req.body;
    
    // Only recalculate conflicts if time/venue changed
    if (venue || date || startTime || endTime) {
      const { conflicts } = await checkConflicts({ 
        date: date || event.date, 
        startTime: startTime || event.startTime, 
        endTime: endTime || event.endTime, 
        venue: venue || event.venue 
      });
      event.conflicts = conflicts;
    }

    event.title = title || event.title;
    event.description = description || event.description;
    event.venue = venue || event.venue;
    event.date = date || event.date;
    event.startTime = startTime || event.startTime;
    event.endTime = endTime || event.endTime;

    // Reset status to pending if updated by non-admin? 
    // Usually if an organizer edits, it should go back to pending.
    if (req.user.role !== 'admin') {
      event.status = 'pending';
    }

    const updatedEvent = await event.save();
    const populatedEvent = await Event.findById(updatedEvent._id).populate('createdBy', 'name email department');
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

    await event.deleteOne();
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
    const { date, startTime, endTime, venue } = req.body;
    const { conflicts, suggestions } = await checkConflicts({ date, startTime, endTime, venue });
    res.json({ conflicts, suggestions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
