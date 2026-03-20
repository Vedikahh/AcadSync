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
  conflicts: [{
    type: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
