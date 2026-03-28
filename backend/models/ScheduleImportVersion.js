const mongoose = require('mongoose');

const rowErrorSchema = new mongoose.Schema(
  {
    rowNumber: { type: Number, required: true },
    errors: [{ type: String, required: true }],
    rawRow: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const scheduleSnapshotSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    title: { type: String },
    faculty: { type: String, required: true },
    department: { type: String, required: true },
    day: { type: String, required: true },
    date: { type: Date },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String, required: true },
    type: {
      type: String,
      enum: ['lecture', 'lab', 'exam'],
      default: 'lecture',
      required: true,
    },
  },
  { _id: false }
);

const scheduleImportVersionSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ['replace', 'append', 'rollback'],
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sourceVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScheduleImportVersion',
    },
    totalRows: {
      type: Number,
      required: true,
      default: 0,
    },
    validRows: {
      type: Number,
      required: true,
      default: 0,
    },
    invalidRows: {
      type: Number,
      required: true,
      default: 0,
    },
    insertedCount: {
      type: Number,
      required: true,
      default: 0,
    },
    rowErrors: {
      type: [rowErrorSchema],
      default: [],
    },
    beforeSnapshot: {
      type: [scheduleSnapshotSchema],
      default: [],
    },
    afterSnapshot: {
      type: [scheduleSnapshotSchema],
      default: [],
    },
  },
  { timestamps: true }
);

scheduleImportVersionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ScheduleImportVersion', scheduleImportVersionSchema);
