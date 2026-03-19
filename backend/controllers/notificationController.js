const Notification = require('../models/Notification');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    // Only fetch for specific user OR global system events
    const notifications = await Notification.find({
      $or: [
        { userId: req.user.id },
        { userId: { $exists: false } } // system wide alerts
      ]
    }).sort({ createdAt: -1 });
    
    res.json(notifications);
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
    
    notif.read = true;
    await notif.save();
    
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { 
        $or: [
          { userId: req.user.id },
          { userId: { $exists: false } }
        ],
        read: false
      },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
