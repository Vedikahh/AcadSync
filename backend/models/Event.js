const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  department: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['event', 'lecture', 'exam'],
    default: 'event',
  },
  venue: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true, // Expected format "HH:MM" e.g "14:00"
  },
  endTime: {
    type: String,
    required: true, // Expected format "HH:MM"
  },
  participants: {
    type: Number,
    min: 1,
  },
  organizer: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  adminReviewNote: {
    type: String,
    default: null,
  },
  rejectionReason: {
    type: String,
    default: null,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  conflicts: [{
    type: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
