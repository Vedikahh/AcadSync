const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
