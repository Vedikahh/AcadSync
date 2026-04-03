const express = require('express');
const router = express.Router();
const { getDashboardStats, getAuditLogs, getPendingRequests } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/stats', protect, getDashboardStats);
router.get('/pending-requests', protect, authorizeRoles('admin'), getPendingRequests);
router.get('/audit-logs', protect, authorizeRoles('admin'), getAuditLogs);

module.exports = router;
