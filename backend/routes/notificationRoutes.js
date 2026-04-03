const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { notificationIdParamSchema } = require('../validators/userValidator');

router.route('/')
  // Supports query params: limit, offset, sort
  .get(protect, getNotifications);

router.patch('/read-all', protect, markAllRead);
router.patch('/:id/read', protect, validate(notificationIdParamSchema, 'params'), markAsRead);

module.exports = router;
