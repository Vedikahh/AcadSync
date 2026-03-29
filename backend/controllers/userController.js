const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Event = require('../models/Event');
const Notification = require('../models/Notification');
const { writeAuditLog, createDiffSummary } = require('../utils/auditLogger');

const NOTIFICATION_TYPES = ['event', 'approval', 'rejection', 'reminder'];
const MAX_AVATAR_LENGTH = 3 * 1024 * 1024;
const MAX_BIO_LENGTH = 500;
const MAX_INTERESTS = 10;
const ALLOWED_YEARS = new Set([
  '',
  'First Year',
  'Second Year',
  'Third Year',
  'Fourth Year',
  'Fifth Year',
  'Postgraduate',
]);

const normalizeText = (value, maxLength = 120) => {
  if (value === undefined || value === null) return '';
  const text = String(value).trim();
  return text.slice(0, maxLength);
};

const isPhoneValid = (value) => {
  if (!value) return true;
  return /^\+?[0-9\s()\-]{7,20}$/.test(value);
};

const normalizeNotificationPreferences = (preferences = {}) => {
  const result = {};
  NOTIFICATION_TYPES.forEach((type) => {
    result[type] = preferences[type] !== false;
  });
  return result;
};

const normalizeEmailPreferences = (preferences = {}) => {
  const normalized = {
    enabled: preferences.enabled !== false,
  };

  NOTIFICATION_TYPES.forEach((type) => {
    normalized[type] = preferences[type] !== false;
  });

  return normalized;
};

const normalizeNotificationChannels = (channels = {}, legacyNotification = {}, legacyEmail = {}) => {
  const normalizedLegacyNotification = normalizeNotificationPreferences(legacyNotification);
  const normalizedLegacyEmail = normalizeEmailPreferences(legacyEmail);
  const response = {};

  NOTIFICATION_TYPES.forEach((type) => {
    const raw = channels[type] || {};
    const inApp = typeof raw.inApp === 'boolean' ? raw.inApp : normalizedLegacyNotification[type];
    const email = typeof raw.email === 'boolean'
      ? raw.email
      : (normalizedLegacyEmail.enabled && normalizedLegacyEmail[type]);

    response[type] = {
      inApp,
      email,
    };
  });

  return response;
};

const deriveLegacyPreferencesFromChannels = (channels = {}) => {
  const notificationPreferences = {};
  const emailPreferences = { enabled: false };

  NOTIFICATION_TYPES.forEach((type) => {
    const inAppEnabled = channels[type]?.inApp !== false;
    const emailEnabled = channels[type]?.email !== false;

    notificationPreferences[type] = inAppEnabled;
    emailPreferences[type] = emailEnabled;
    emailPreferences.enabled = emailPreferences.enabled || emailEnabled;
  });

  return { notificationPreferences, emailPreferences };
};

const isSupportedImageDataUrl = (value) => /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i.test(value);

const buildProfileResponse = (user) => {
  const notificationChannels = normalizeNotificationChannels(
    user.notificationChannels || {},
    user.notificationPreferences || {},
    user.emailPreferences || {}
  );
  const { notificationPreferences, emailPreferences } = deriveLegacyPreferencesFromChannels(notificationChannels);

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    bio: user.bio || '',
    year: user.year || '',
    interests: Array.isArray(user.interests) ? user.interests : [],
    phone: user.phone || '',
    alternateContact: user.alternateContact || '',
    avatar: user.avatar || '',
    provider: user.provider,
    notificationChannels,
    notificationPreferences,
    emailPreferences,
  };
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      res.json(buildProfileResponse(user));
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
    if (typeof req.body.avatar === 'string' && req.body.avatar.length > MAX_AVATAR_LENGTH) {
      return res.status(400).json({ message: 'Profile photo is too large' });
    }

    if (
      typeof req.body.avatar === 'string' &&
      req.body.avatar.trim() !== '' &&
      !isSupportedImageDataUrl(req.body.avatar)
    ) {
      return res.status(400).json({ message: 'Unsupported profile photo format' });
    }

    if (req.body.name !== undefined && !normalizeText(req.body.name, 80)) {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }

    if (req.body.bio !== undefined && String(req.body.bio).length > MAX_BIO_LENGTH) {
      return res.status(400).json({ message: `Bio must be under ${MAX_BIO_LENGTH} characters` });
    }

    if (req.body.year !== undefined && !ALLOWED_YEARS.has(normalizeText(req.body.year, 30))) {
      return res.status(400).json({ message: 'Please select a valid academic year' });
    }

    if (!isPhoneValid(normalizeText(req.body.phone, 20))) {
      return res.status(400).json({ message: 'Please enter a valid phone number' });
    }

    const user = await User.findById(req.user.id);

    if (user) {
      const beforeProfile = {
        name: user.name,
        department: user.department,
        bio: user.bio,
        year: user.year,
        phone: user.phone,
        alternateContact: user.alternateContact,
        avatar: user.avatar,
      };

      user.name = req.body.name !== undefined ? normalizeText(req.body.name, 80) : user.name;
      user.department = req.body.department !== undefined ? normalizeText(req.body.department, 80) : user.department;
      user.bio = req.body.bio !== undefined ? normalizeText(req.body.bio, MAX_BIO_LENGTH) : user.bio;
      user.year = req.body.year !== undefined ? normalizeText(req.body.year, 30) : (user.year || '');
      user.phone = req.body.phone !== undefined ? normalizeText(req.body.phone, 20) : (user.phone || '');
      user.alternateContact = req.body.alternateContact !== undefined
        ? normalizeText(req.body.alternateContact, 120)
        : (user.alternateContact || '');
      user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;

      if (req.body.interests !== undefined) {
        const sourceInterests = Array.isArray(req.body.interests)
          ? req.body.interests
          : String(req.body.interests || '').split(',');

        user.interests = sourceInterests
          .map((item) => normalizeText(item, 40))
          .filter(Boolean)
          .slice(0, MAX_INTERESTS);
      }

      let nextNotificationChannels = normalizeNotificationChannels(
        user.notificationChannels || {},
        user.notificationPreferences || {},
        user.emailPreferences || {}
      );

      if (req.body.notificationChannels && typeof req.body.notificationChannels === 'object') {
        nextNotificationChannels = normalizeNotificationChannels(
          {
            ...nextNotificationChannels,
            ...req.body.notificationChannels,
          },
          user.notificationPreferences || {},
          user.emailPreferences || {}
        );
      }
      
      if (req.body.notificationPreferences && typeof req.body.notificationPreferences === 'object') {
        const inAppPreferences = normalizeNotificationPreferences({
          ...deriveLegacyPreferencesFromChannels(nextNotificationChannels).notificationPreferences,
          ...req.body.notificationPreferences,
        });

        NOTIFICATION_TYPES.forEach((type) => {
          nextNotificationChannels[type] = {
            ...nextNotificationChannels[type],
            inApp: inAppPreferences[type],
          };
        });
      }

      if (req.body.emailPreferences && typeof req.body.emailPreferences === 'object') {
        const mergedEmailPreferences = normalizeEmailPreferences({
          ...deriveLegacyPreferencesFromChannels(nextNotificationChannels).emailPreferences,
          ...req.body.emailPreferences,
        });

        NOTIFICATION_TYPES.forEach((type) => {
          nextNotificationChannels[type] = {
            ...nextNotificationChannels[type],
            email: mergedEmailPreferences.enabled && mergedEmailPreferences[type],
          };
        });
      }

      user.notificationChannels = nextNotificationChannels;
      const { notificationPreferences, emailPreferences } = deriveLegacyPreferencesFromChannels(nextNotificationChannels);
      user.notificationPreferences = normalizeNotificationPreferences(notificationPreferences);
      user.emailPreferences = normalizeEmailPreferences(emailPreferences);
      
      const updatedUser = await user.save();

      if (req.user.role === 'admin') {
        await writeAuditLog(req, {
          action: 'profile.update',
          target: {
            entityType: 'user',
            entityId: updatedUser._id,
            label: updatedUser.email,
          },
          metadata: {
            targetRole: updatedUser.role,
          },
          diffSummary: createDiffSummary(beforeProfile, {
            name: updatedUser.name,
            department: updatedUser.department,
            bio: updatedUser.bio,
            year: updatedUser.year,
            phone: updatedUser.phone,
            alternateContact: updatedUser.alternateContact,
            avatar: updatedUser.avatar,
          }, ['name', 'department', 'bio', 'year', 'phone', 'alternateContact', 'avatar']),
        });
      }

      res.json(buildProfileResponse(updatedUser));
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Change password for local users
// @route   POST /api/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    if (confirmNewPassword !== undefined && newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'New password and confirmation do not match' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.provider !== 'local' || !user.password) {
      return res.status(400).json({ message: 'Password change is not available for this account' });
    }

    const isCurrentMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    if (req.user.role === 'admin') {
      await writeAuditLog(req, {
        action: 'profile.passwordChange',
        target: {
          entityType: 'user',
          entityId: user._id,
          label: user.email,
        },
        metadata: {
          provider: user.provider,
        },
        diffSummary: [],
      });
    }

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete current user account
// @route   DELETE /api/users/delete-account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const { currentPassword, confirmText } = req.body || {};

    if (confirmText !== 'DELETE') {
      return res.status(400).json({ message: 'Please type DELETE to confirm account deletion' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.provider === 'local') {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to delete your account' });
      }

      const isCurrentMatch = await bcrypt.compare(currentPassword, user.password || '');
      if (!isCurrentMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
    }

    const deletedUser = {
      id: user._id,
      email: user.email,
      role: user.role,
      department: user.department,
      provider: user.provider,
    };

    await Promise.all([
      Notification.deleteMany({ userId: user._id }),
      Event.deleteMany({ createdBy: user._id }),
      Event.updateMany(
        { reviewedBy: user._id },
        { $set: { reviewedBy: null, reviewedAt: null } }
      ),
      User.deleteOne({ _id: user._id }),
    ]);

    if (req.user.role === 'admin') {
      await writeAuditLog(req, {
        action: 'profile.deleteAccount',
        target: {
          entityType: 'user',
          entityId: deletedUser.id,
          label: deletedUser.email,
        },
        metadata: {
          targetRole: deletedUser.role,
          department: deletedUser.department,
          provider: deletedUser.provider,
        },
        diffSummary: [],
      });
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

