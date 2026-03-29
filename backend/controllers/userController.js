const User = require('../models/User');

const normalizeNotificationPreferences = (preferences = {}) => ({
  event: preferences.event !== false,
  approval: preferences.approval !== false,
  rejection: preferences.rejection !== false,
  reminder: preferences.reminder !== false,
});

const normalizeEmailPreferences = (preferences = {}) => ({
  enabled: preferences.enabled !== false,
  event: preferences.event !== false,
  approval: preferences.approval !== false,
  rejection: preferences.rejection !== false,
  reminder: preferences.reminder !== false,
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      res.json({
        ...user.toObject(),
        notificationPreferences: normalizeNotificationPreferences(user.notificationPreferences || {}),
        emailPreferences: normalizeEmailPreferences(user.emailPreferences || {}),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/update
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    if (typeof req.body.avatar === 'string' && req.body.avatar.length > 3 * 1024 * 1024) {
      return res.status(400).json({ message: 'Profile photo is too large' });
    }

    const user = await User.findById(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.department = req.body.department !== undefined ? req.body.department : user.department;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
      user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;
      
      // Update in-app notification preferences
      if (req.body.notificationPreferences && typeof req.body.notificationPreferences === 'object') {
        user.notificationPreferences = normalizeNotificationPreferences({
          ...user.notificationPreferences,
          ...req.body.notificationPreferences,
        });
      }

      // Update email notification preferences
      if (req.body.emailPreferences && typeof req.body.emailPreferences === 'object') {
        user.emailPreferences = normalizeEmailPreferences({
          ...user.emailPreferences,
          ...req.body.emailPreferences,
        });
      }
      
      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        notificationPreferences: normalizeNotificationPreferences(updatedUser.notificationPreferences || {}),
        emailPreferences: normalizeEmailPreferences(updatedUser.emailPreferences || {}),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

