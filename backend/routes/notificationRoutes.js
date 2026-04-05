const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
  clearReadNotifications,
  createAnnouncement,
  previewAnnouncementAudience,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  notificationIdParamSchema,
  createAnnouncementSchema,
  announcementAudiencePreviewSchema,
} = require('../validators/userValidator');

router.route('/')
  // Supports query params: limit, offset, sort
  .get(protect, getNotifications);

router.patch('/read-all', protect, markAllRead);
router.delete('/clear-read', protect, clearReadNotifications);
router.patch('/:id/read', protect, validate(notificationIdParamSchema, 'params'), markAsRead);
router.delete('/:id', protect, validate(notificationIdParamSchema, 'params'), deleteNotification);
router.post('/announcements/preview', protect, authorizeRoles('admin', 'organizer'), validate(announcementAudiencePreviewSchema), previewAnnouncementAudience);
router.post('/announcements', protect, authorizeRoles('admin', 'organizer'), validate(createAnnouncementSchema), createAnnouncement);

module.exports = router;
