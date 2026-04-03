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
const { validate } = require('../middleware/validationMiddleware');
const {
	registerSchema,
	loginSchema,
	googleLoginSchema,
	googleRegisterSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	verifyEmailRequestSchema,
	verifyEmailOtpSchema,
	verifyEmailTokenParamSchema,
} = require('../validators/authValidator');

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

router.post('/register', registerLimiter, validate(registerSchema), registerUser);
router.post('/login', loginLimiter, validate(loginSchema), loginUser);
router.post('/google', validate(googleLoginSchema), googleLogin);
router.post('/google-register', validate(googleRegisterSchema), googleRegister);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', resetPasswordLimiter, validate(resetPasswordSchema), resetPassword);
router.get('/verify-email/:token', validate(verifyEmailTokenParamSchema, 'params'), verifyEmail);
router.post('/verify-email/request', verifyRequestLimiter, validate(verifyEmailRequestSchema), requestEmailVerification);
router.post('/verify-email/otp', verifyOtpLimiter, validate(verifyEmailOtpSchema), verifyEmailOtp);
router.get('/me', protect, getMe);

module.exports = router;
