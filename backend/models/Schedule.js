const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },
  faculty: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  day: {
    type: String,
    required: true, // e.g., 'Monday', 'Tuesday'
  },
  startTime: {
    type: String,
    required: true, // Format "HH:MM"
  },
  endTime: {
    type: String,
    required: true, // Format "HH:MM"
  },
  room: {
    type: String,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
