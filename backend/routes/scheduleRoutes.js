const express = require('express');
const router = express.Router();
const { 
  getSchedules, createSchedule, updateSchedule, deleteSchedule, importSchedules 
} = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.route('/')
  .get(protect, getSchedules)
  .post(protect, authorizeRoles('admin'), createSchedule);

router.route('/:id')
  .put(protect, authorizeRoles('admin'), updateSchedule)
  .delete(protect, authorizeRoles('admin'), deleteSchedule);

router.post('/import', protect, authorizeRoles('admin'), importSchedules);

module.exports = router;
