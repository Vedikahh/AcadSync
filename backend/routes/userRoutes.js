const express = require('express');
const router = express.Router();
const { getUserProfile, getPublicUserProfile, updateUserProfile, changePassword, deleteAccount } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, getUserProfile);
router.get('/public/:userId', protect, getPublicUserProfile);
router.put('/update', protect, updateUserProfile);
router.post('/change-password', protect, changePassword);
router.delete('/delete-account', protect, deleteAccount);

module.exports = router;
