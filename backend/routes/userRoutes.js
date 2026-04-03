const express = require('express');
const router = express.Router();
const { getUserProfile, getPublicUserProfile, updateUserProfile, changePassword, deleteAccount } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const {
  updateUserProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
  userIdParamSchema,
} = require('../validators/userValidator');

router.get('/profile', protect, getUserProfile);
router.get('/public/:userId', protect, validate(userIdParamSchema, 'params'), getPublicUserProfile);
router.put('/update', protect, validate(updateUserProfileSchema), updateUserProfile);
router.post('/change-password', protect, validate(changePasswordSchema), changePassword);
router.delete('/delete-account', protect, validate(deleteAccountSchema), deleteAccount);

module.exports = router;
