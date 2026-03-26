const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      res.json(user);
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
      user.organization = req.body.organization !== undefined ? req.body.organization : user.organization;
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
      user.year = req.body.year !== undefined ? req.body.year : user.year;
      user.designation = req.body.designation !== undefined ? req.body.designation : user.designation;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
      user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;
      
      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        organization: updatedUser.organization,
        phone: updatedUser.phone,
        year: updatedUser.year,
        designation: updatedUser.designation,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

