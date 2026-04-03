const express = require('express');
const router = express.Router();
const { 
  getSchedules, createSchedule, updateSchedule, deleteSchedule, importSchedules, getImportHistory, rollbackImportVersion
} = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  createScheduleSchema,
  updateScheduleSchema,
  importScheduleSchema,
  idParamSchema,
  versionIdParamSchema,
} = require('../validators/scheduleValidator');

router.route('/')
  // Supports query params: limit, offset, sort
  .get(protect, getSchedules)
  .post(protect, authorizeRoles('admin'), validate(createScheduleSchema), createSchedule);

router.route('/:id')
  .put(protect, authorizeRoles('admin'), validate(idParamSchema, 'params'), validate(updateScheduleSchema), updateSchedule)
  .delete(protect, authorizeRoles('admin'), validate(idParamSchema, 'params'), deleteSchedule);

router.post('/import', protect, authorizeRoles('admin'), validate(importScheduleSchema), importSchedules);
router.get('/import/history', protect, authorizeRoles('admin'), getImportHistory);
router.post('/import/rollback/:versionId', protect, authorizeRoles('admin'), validate(versionIdParamSchema, 'params'), rollbackImportVersion);

module.exports = router;
