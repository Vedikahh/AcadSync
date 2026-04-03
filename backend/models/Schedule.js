const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: function () { return !this.title; },
  },
  title: {
    type: String,
    trim: true,
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
    required: function () { return !this.date; }, // e.g., 'Monday', 'Tuesday' (required if date is not provided)
  },
  date: {
    type: Date,
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
  },
  type: {
    type: String,
    enum: ['lecture', 'lab', 'exam'],
    default: 'lecture',
    required: true,
  },
  importVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScheduleImportVersion',
  }
}, { timestamps: true });

scheduleSchema.index({ date: 1 });
scheduleSchema.index({ day: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);
