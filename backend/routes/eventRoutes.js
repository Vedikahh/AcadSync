const express = require('express');
const router = express.Router();
const { 
  getEvents, getMyEvents, createEvent, 
  approveEvent, rejectEvent, deleteEvent 
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Public/All authenticated users
router.route('/')
  .get(protect, getEvents)
  .post(protect, createEvent);

router.get('/my-events', protect, getMyEvents);

// Admin Only
router.patch('/:id/approve', protect, authorizeRoles('admin'), approveEvent);
router.patch('/:id/reject', protect, authorizeRoles('admin'), rejectEvent);
router.delete('/:id', protect, authorizeRoles('admin'), deleteEvent);

module.exports = router;
