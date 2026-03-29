const mongoose = require('mongoose');

const diffSchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
    from: { type: mongoose.Schema.Types.Mixed, default: null },
    to: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      role: {
        type: String,
        enum: ['student', 'organizer', 'admin'],
        required: true,
      },
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    target: {
      entityType: {
        type: String,
        required: true,
        trim: true,
      },
      entityId: {
        type: String,
        required: true,
        trim: true,
      },
      label: {
        type: String,
        default: '',
      },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    diffSummary: {
      type: [diffSchema],
      default: [],
    },
    source: {
      ip: { type: String, default: '' },
      userAgent: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ 'target.entityType': 1, createdAt: -1 });
auditLogSchema.index({ 'actor.id': 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);