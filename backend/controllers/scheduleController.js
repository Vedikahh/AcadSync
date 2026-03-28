const Schedule = require('../models/Schedule');
const ScheduleImportVersion = require('../models/ScheduleImportVersion');
const socket = require('../utils/socket');

const ALLOWED_TYPES = new Set(['lecture', 'lab', 'exam']);
const ALLOWED_DAYS = new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toMinutes = (timeValue) => {
  const [hours, minutes] = timeValue.split(':').map(Number);
  return (hours * 60) + minutes;
};

const titleCaseDay = (dayValue) => {
  const normalized = String(dayValue || '').trim().toLowerCase();
  if (!normalized) return '';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const sanitizeSchedule = (row) => ({
  subject: String(row.subject || '').trim(),
  title: String(row.title || '').trim(),
  faculty: String(row.faculty || '').trim(),
  department: String(row.department || '').trim(),
  day: titleCaseDay(row.day),
  date: row.date ? new Date(row.date) : null,
  startTime: String(row.startTime || '').trim(),
  endTime: String(row.endTime || '').trim(),
  room: String(row.room || '').trim(),
  type: String(row.type || 'lecture').trim().toLowerCase(),
});

const toSnapshotRows = (rows) => rows.map((row) => ({
  subject: row.subject,
  title: row.title,
  faculty: row.faculty,
  department: row.department,
  day: row.day,
  date: row.date || null,
  startTime: row.startTime,
  endTime: row.endTime,
  room: row.room,
  type: row.type,
}));

const validateRows = (rows) => {
  const normalizedRows = [];
  const rowErrors = [];

  rows.forEach((inputRow, index) => {
    const row = sanitizeSchedule(inputRow || {});
    const errors = [];

    if (!row.subject) {
      errors.push('subject is required (or provide title)');
    }
    if (!row.faculty) {
      errors.push('faculty is required');
    }
    if (!row.department) {
      errors.push('department is required');
    }
    if (!row.room) {
      errors.push('room is required');
    }
    if (!row.startTime) {
      errors.push('startTime is required');
    }
    if (!row.endTime) {
      errors.push('endTime is required');
    }

    if (row.date && Number.isNaN(row.date.getTime())) {
      errors.push('date is invalid');
    }

    if (!row.day && row.date && !Number.isNaN(row.date.getTime())) {
      row.day = row.date.toLocaleDateString('en-US', { weekday: 'long' });
    }

    if (!row.day && !row.date) {
      errors.push('either day or date is required');
    }

    if (row.day && !ALLOWED_DAYS.has(row.day)) {
      errors.push('day must be one of Monday-Sunday');
    }

    if (row.startTime && !TIME_REGEX.test(row.startTime)) {
      errors.push('startTime must be in HH:MM 24-hour format');
    }

    if (row.endTime && !TIME_REGEX.test(row.endTime)) {
      errors.push('endTime must be in HH:MM 24-hour format');
    }

    if (
      row.startTime
      && row.endTime
      && TIME_REGEX.test(row.startTime)
      && TIME_REGEX.test(row.endTime)
      && toMinutes(row.endTime) <= toMinutes(row.startTime)
    ) {
      errors.push('endTime must be later than startTime');
    }

    if (!ALLOWED_TYPES.has(row.type)) {
      errors.push('type must be one of lecture, lab, exam');
    }

    if (errors.length > 0) {
      rowErrors.push({
        rowNumber: index + 2,
        errors,
        rawRow: inputRow,
      });
      return;
    }

    normalizedRows.push(row);
  });

  return {
    normalizedRows,
    rowErrors,
    report: {
      totalRows: rows.length,
      validRows: normalizedRows.length,
      invalidRows: rowErrors.length,
    },
  };
};

const commitImportVersion = async ({ mode, normalizedRows, userId, sourceVersion = null }) => {
  const session = await Schedule.startSession();
  session.startTransaction();

  try {
    const beforeRows = await Schedule.find().session(session).lean();

    const importVersion = await ScheduleImportVersion.create([
      {
        mode,
        createdBy: userId,
        sourceVersion,
        totalRows: normalizedRows.length,
        validRows: normalizedRows.length,
        invalidRows: 0,
        insertedCount: 0,
        rowErrors: [],
        beforeSnapshot: toSnapshotRows(beforeRows),
        afterSnapshot: [],
      },
    ], { session });

    const versionDoc = importVersion[0];

    if (mode === 'replace' || mode === 'rollback') {
      await Schedule.deleteMany({}, { session });
    }

    if (normalizedRows.length > 0) {
      const rowsToInsert = normalizedRows.map((row) => ({
        ...row,
        importVersion: versionDoc._id,
      }));
      await Schedule.insertMany(rowsToInsert, { session });
    }

    const afterRows = await Schedule.find().session(session).lean();

    versionDoc.insertedCount = normalizedRows.length;
    versionDoc.afterSnapshot = toSnapshotRows(afterRows);
    await versionDoc.save({ session });

    await session.commitTransaction();
    return versionDoc;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};


// @desc    Get all schedules
// @route   GET /api/schedule
// @access  Private
exports.getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find();
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a schedule entry
// @route   POST /api/schedule
// @access  Private (Admin only)
exports.createSchedule = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.subject && payload.title) {
      payload.subject = payload.title;
    }
    if (!payload.day && payload.date) {
      const parsed = new Date(payload.date);
      if (!Number.isNaN(parsed.getTime())) {
        payload.day = parsed.toLocaleDateString('en-US', { weekday: 'long' });
      }
    }

    const schedule = await Schedule.create(payload);


    // Real-time Update
    socket.getIO().emit('calendarUpdate', { type: 'schedule', action: 'create', data: schedule });

    res.status(201).json(schedule);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Update a schedule entry
// @route   PUT /api/schedule/:id
// @access  Private (Admin only)
exports.updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

    // Real-time Update
    socket.getIO().emit('calendarUpdate', { type: 'schedule', action: 'update', data: schedule });

    res.json(schedule);

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Delete a schedule entry
// @route   DELETE /api/schedule/:id
// @access  Private (Admin only)
exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    await schedule.deleteOne();

    // Real-time Update
    socket.getIO().emit('calendarUpdate', { type: 'schedule', action: 'delete', id: req.params.id });

    res.json({ message: 'Schedule removed' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Import schedules in bulk (CSV parsed rows)
// @route   POST /api/schedule/import
// @access  Private (Admin only)
exports.importSchedules = async (req, res) => {
  try {
    const { rows, mode = 'replace', dryRun = false } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'No schedule rows provided for import' });
    }

    if (!['replace', 'append'].includes(mode)) {
      return res.status(400).json({ message: 'Invalid mode. Allowed values: replace, append' });
    }

    const { normalizedRows, rowErrors, report } = validateRows(rows);

    if (dryRun) {
      return res.status(200).json({
        message: rowErrors.length > 0 ? 'Validation completed with errors' : 'Validation successful',
        dryRun: true,
        mode,
        report,
        rowErrors,
        previewRows: normalizedRows.slice(0, 100),
      });
    }

    if (rowErrors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed. Fix row-level errors and try again.',
        dryRun: false,
        mode,
        report,
        rowErrors,
      });
    }

    const importVersion = await commitImportVersion({
      mode,
      normalizedRows,
      userId: req.user._id,
    });

    // Real-time update
    socket.getIO().emit('calendarUpdate', {
      type: 'schedule',
      action: 'import',
      mode,
      count: report.validRows,
      importVersionId: importVersion._id,
    });

    res.status(201).json({
      message: `Imported ${report.validRows} schedule row(s) successfully`,
      insertedCount: report.validRows,
      mode,
      report,
      importVersion: {
        _id: importVersion._id,
        createdAt: importVersion.createdAt,
      },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Get import history
// @route   GET /api/schedule/import/history
// @access  Private (Admin only)
exports.getImportHistory = async (req, res) => {
  try {
    const history = await ScheduleImportVersion.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('createdBy', 'name email')
      .populate('sourceVersion', 'createdAt mode')
      .select('-beforeSnapshot -afterSnapshot')
      .lean();

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Roll back to pre-import schedule set of a selected version
// @route   POST /api/schedule/import/rollback/:versionId
// @access  Private (Admin only)
exports.rollbackImportVersion = async (req, res) => {
  try {
    const { versionId } = req.params;

    const targetVersion = await ScheduleImportVersion.findById(versionId).lean();
    if (!targetVersion) {
      return res.status(404).json({ message: 'Import version not found' });
    }

    const rollbackRows = Array.isArray(targetVersion.beforeSnapshot)
      ? targetVersion.beforeSnapshot
      : [];

    const rollbackVersion = await commitImportVersion({
      mode: 'rollback',
      normalizedRows: rollbackRows,
      userId: req.user._id,
      sourceVersion: targetVersion._id,
    });

    socket.getIO().emit('calendarUpdate', {
      type: 'schedule',
      action: 'rollback',
      sourceVersionId: targetVersion._id,
      rollbackVersionId: rollbackVersion._id,
      count: rollbackRows.length,
    });

    return res.status(200).json({
      message: 'Rollback completed successfully',
      restoredCount: rollbackRows.length,
      rollbackVersion: {
        _id: rollbackVersion._id,
        createdAt: rollbackVersion.createdAt,
      },
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
