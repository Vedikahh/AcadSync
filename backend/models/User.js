const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function() { return this.provider === 'local'; },
  },
  role: {
    type: String,
    enum: ['student', 'organizer', 'admin'],
    default: 'student',
  },
  department: {
    type: String,
  },
  bio: {
    type: String,
  },
  year: {
    type: String,
    default: '',
  },
  interests: {
    type: [String],
    default: [],
  },
  phone: {
    type: String,
    default: '',
  },
  alternateContact: {
    type: String,
    default: '',
  },
  avatar: {
    type: String,
    default: '',
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerifiedAt: {
    type: Date,
  },
  emailVerificationToken: {
    type: String,
  },
  emailVerificationExpires: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  passwordResetUsedAt: {
    type: Date,
  },
  notificationPreferences: {
    event: {
      type: Boolean,
      default: true,
    },
    approval: {
      type: Boolean,
      default: true,
    },
    rejection: {
      type: Boolean,
      default: true,
    },
    reminder: {
      type: Boolean,
      default: true,
    },
  },
  notificationChannels: {
    event: {
      inApp: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: true,
      },
    },
    approval: {
      inApp: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: true,
      },
    },
    rejection: {
      inApp: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: true,
      },
    },
    reminder: {
      inApp: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: true,
      },
    },
  },
  emailPreferences: {
    enabled: {
      type: Boolean,
      default: true,
    },
    event: {
      type: Boolean,
      default: true,
    },
    approval: {
      type: Boolean,
      default: true,
    },
    rejection: {
      type: Boolean,
      default: true,
    },
    reminder: {
      type: Boolean,
      default: true,
    },
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
