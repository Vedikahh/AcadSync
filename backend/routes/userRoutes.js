const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, changePassword, deleteAccount } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, getUserProfile);
router.put('/update', protect, updateUserProfile);
router.post('/change-password', protect, changePassword);
router.delete('/delete-account', protect, deleteAccount);

module.exports = router;
