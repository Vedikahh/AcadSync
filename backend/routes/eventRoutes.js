const express = require('express');
const router = express.Router();
const { 
  getEvents, getMyEvents, createEvent, updateEvent,
  approveEvent, rejectEvent, deleteEvent, checkEventConflicts
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Public/All authenticated users
router.route('/')
  .get(protect, getEvents)
  .post(protect, authorizeRoles('organizer', 'admin'), createEvent);

router.get('/my-events', protect, authorizeRoles('organizer', 'admin'), getMyEvents);
router.post('/check-conflicts', protect, authorizeRoles('organizer', 'admin'), checkEventConflicts);

// Admin Only (Status updates)
router.patch('/:id/approve', protect, authorizeRoles('admin'), approveEvent);
router.patch('/:id/reject', protect, authorizeRoles('admin'), rejectEvent);

// Owner/Admin
router.route('/:id')
  .patch(protect, authorizeRoles('organizer', 'admin'), updateEvent)
  .delete(protect, authorizeRoles('organizer', 'admin'), deleteEvent);

module.exports = router;
