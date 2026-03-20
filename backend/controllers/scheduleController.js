const Schedule = require('../models/Schedule');
const socket = require('../utils/socket');


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
    const schedule = await Schedule.create(req.body);


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
    const { rows, mode = 'replace' } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'No schedule rows provided for import' });
    }

    const allowedTypes = new Set(['lecture', 'lab', 'exam']);

    const normalizedRows = rows.map((row, index) => {
      const cleaned = {
        subject: String(row.subject || '').trim(),
        faculty: String(row.faculty || '').trim(),
        department: String(row.department || '').trim(),
        day: String(row.day || '').trim(),
        startTime: String(row.startTime || '').trim(),
        endTime: String(row.endTime || '').trim(),
        room: String(row.room || '').trim(),
        type: String(row.type || 'lecture').trim().toLowerCase(),
      };

      if (!cleaned.subject || !cleaned.faculty || !cleaned.department || !cleaned.day || !cleaned.startTime || !cleaned.endTime || !cleaned.room) {
        throw new Error(`Row ${index + 1} is missing required fields`);
      }

      if (!allowedTypes.has(cleaned.type)) {
        throw new Error(`Row ${index + 1} has invalid type. Allowed values: lecture, lab, exam`);
      }

      return cleaned;
    });

    if (mode === 'replace') {
      await Schedule.deleteMany({});
    }

    const inserted = await Schedule.insertMany(normalizedRows);

    // Real-time Update
    socket.getIO().emit('calendarUpdate', {
      type: 'schedule',
      action: 'import',
      mode,
      count: inserted.length,
    });

    res.status(201).json({
      message: `Imported ${inserted.length} schedule row(s) successfully`,
      insertedCount: inserted.length,
      mode,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
