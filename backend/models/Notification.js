const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['event', 'approval', 'rejection', 'announcement', 'reminder', 'conflict', 'system'],
    default: 'system',
  },
  read: {
    type: Boolean,
    default: false,
  },
  link: {
    type: String,
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
  }
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
