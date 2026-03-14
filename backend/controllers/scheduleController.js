const Schedule = require('../models/Schedule');

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
    res.json({ message: 'Schedule removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
