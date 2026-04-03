const express = require('express');
const router = express.Router();
const { 
  getEvents, getMyEvents, createEvent, updateEvent,
  approveEvent, rejectEvent, deleteEvent, checkEventConflicts
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  createEventSchema,
  updateEventSchema,
  checkConflictsSchema,
  eventIdParamSchema,
} = require('../validators/eventValidator');

// Public/All authenticated users
router.route('/')
  // Supports query params: limit, offset, sort
  .get(protect, getEvents)
  .post(protect, authorizeRoles('organizer', 'admin'), validate(createEventSchema), createEvent);

// Supports query params: limit, offset, sort
router.get('/my-events', protect, authorizeRoles('organizer', 'admin'), getMyEvents);
router.post('/check-conflicts', protect, authorizeRoles('organizer', 'admin'), validate(checkConflictsSchema), checkEventConflicts);

// Admin Only (Status updates)
router.patch('/:id/approve', protect, authorizeRoles('admin'), validate(eventIdParamSchema, 'params'), approveEvent);
router.patch('/:id/reject', protect, authorizeRoles('admin'), validate(eventIdParamSchema, 'params'), rejectEvent);

// Owner/Admin
router.route('/:id')
  .patch(protect, authorizeRoles('organizer', 'admin'), validate(eventIdParamSchema, 'params'), validate(updateEventSchema), updateEvent)
  .delete(protect, authorizeRoles('organizer', 'admin'), validate(eventIdParamSchema, 'params'), deleteEvent);

module.exports = router;
