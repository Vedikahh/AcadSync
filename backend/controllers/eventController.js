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
    const conflicts = await checkConflicts({ date, startTime, endTime, venue });

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

    // Create Approval Notification for the requester
    await Notification.create({
      userId: event.createdBy,
      message: `Your event "${event.title}" has been officially approved.`,
      type: 'approval',
      link: '/events'
    });

    res.json(event);
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

    await Notification.create({
      userId: event.createdBy,
      message: `Your event proposal "${event.title}" was declined.`,
      type: 'rejection',
      link: '/events'
    });

    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    await event.deleteOne();
    res.json({ message: 'Event removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
