const express = require('express');
const router = express.Router();
const {
	registerUser,
	loginUser,
	getMe,
	googleLogin,
	googleRegister,
	forgotPassword,
	resetPassword,
	verifyEmail,
	requestEmailVerification,
	verifyEmailOtp,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { createAuthRateLimiter } = require('../middleware/authRateLimiter');

const loginLimiter = createAuthRateLimiter({
	name: 'auth-login',
	windowMs: 15 * 60 * 1000,
	maxAttempts: 10,
});

const registerLimiter = createAuthRateLimiter({
	name: 'auth-register',
	windowMs: 60 * 60 * 1000,
	maxAttempts: 20,
});

const forgotPasswordLimiter = createAuthRateLimiter({
	name: 'auth-forgot-password',
	windowMs: 15 * 60 * 1000,
	maxAttempts: 5,
});

const resetPasswordLimiter = createAuthRateLimiter({
	name: 'auth-reset-password',
	windowMs: 15 * 60 * 1000,
	maxAttempts: 10,
});

const verifyRequestLimiter = createAuthRateLimiter({
	name: 'auth-verify-request',
	windowMs: 15 * 60 * 1000,
	maxAttempts: 5,
});

const verifyOtpLimiter = createAuthRateLimiter({
	name: 'auth-verify-otp',
	windowMs: 15 * 60 * 1000,
	maxAttempts: 10,
});

router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/google', googleLogin);
router.post('/google-register', googleRegister);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/verify-email/request', verifyRequestLimiter, requestEmailVerification);
router.post('/verify-email/otp', verifyOtpLimiter, verifyEmailOtp);
router.get('/me', protect, getMe);

module.exports = router;
