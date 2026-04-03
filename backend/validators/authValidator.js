const Joi = require('joi');

/**
 * Auth Validation Schemas
 */

// Register validation schema
const registerSchema = Joi.object({
	name: Joi.string().min(2).max(100).required().messages({
		'string.empty': 'Name is required',
		'string.min': 'Name must be at least 2 characters',
		'string.max': 'Name must not exceed 100 characters',
	}),
	email: Joi.string().email().required().messages({
		'string.email': 'Please provide a valid email',
		'string.empty': 'Email is required',
	}),
	password: Joi.string().min(8).required().messages({
		'string.min': 'Password must be at least 8 characters',
		'string.empty': 'Password is required',
	}),
	year: Joi.string().max(30).required().messages({
		'string.empty': 'Academic year is required',
	}),
	role: Joi.string()
		.valid('student', 'organizer', 'admin')
		.default('student')
		.messages({
			'any.only': 'Role must be one of: student, organizer, admin',
		}),
	department: Joi.string().max(100).required().messages({
		'string.empty': 'Department is required',
	}),
	phone: Joi.string().max(20).optional().allow(''),
	alternateContact: Joi.string().max(120).optional().allow(''),
	bio: Joi.string().max(500).optional().allow(''),
	interests: Joi.alternatives()
		.try(Joi.array().items(Joi.string().max(40)).max(10), Joi.string())
		.optional(),
	avatar: Joi.string().uri().optional().allow('').messages({
		'string.uri': 'Avatar must be a valid URL',
	}),
});

// Login validation schema
const loginSchema = Joi.object({
	email: Joi.string().email().required().messages({
		'string.email': 'Please provide a valid email',
		'string.empty': 'Email is required',
	}),
	password: Joi.string().required().messages({
		'string.empty': 'Password is required',
	}),
});

// Forgot password schema
const forgotPasswordSchema = Joi.object({
	email: Joi.string().email().required().messages({
		'string.email': 'Please provide a valid email',
		'string.empty': 'Email is required',
	}),
});

// Reset password schema
const resetPasswordSchema = Joi.object({
	token: Joi.string().required().messages({
		'string.empty': 'Reset token is required',
	}),
	password: Joi.string().min(8).required().messages({
		'string.min': 'Password must be at least 8 characters',
		'string.empty': 'Password is required',
	}),
	confirmPassword: Joi.string().valid(Joi.ref('password')).optional().messages({
		'any.only': 'Passwords must match',
	}),
});

// Google login schema
const googleLoginSchema = Joi.object({
	token: Joi.string().required().messages({
		'string.empty': 'Google token is required',
	}),
});

// Google register schema
const googleRegisterSchema = Joi.object({
	token: Joi.string().required().messages({
		'string.empty': 'Google token is required',
	}),
	role: Joi.string().valid('student', 'organizer', 'admin').optional(),
	department: Joi.string().max(100).optional().allow(''),
	year: Joi.string().max(30).optional().allow(''),
	phone: Joi.string().max(20).optional().allow(''),
	alternateContact: Joi.string().max(120).optional().allow(''),
	bio: Joi.string().max(500).optional().allow(''),
	interests: Joi.alternatives()
		.try(Joi.array().items(Joi.string().max(40)).max(10), Joi.string())
		.optional(),
});

// Email verification request schema
const verifyEmailRequestSchema = Joi.object({
	email: Joi.string().email().required().messages({
		'string.email': 'Please provide a valid email',
		'string.empty': 'Email is required',
	}),
});

// Email verification OTP schema
const verifyEmailOtpSchema = Joi.object({
	email: Joi.string().email().required().messages({
		'string.email': 'Please provide a valid email',
		'string.empty': 'Email is required',
	}),
	otp: Joi.string().pattern(/^\d{6}$/).required().messages({
		'string.pattern.base': 'OTP must be exactly 6 digits',
		'string.empty': 'OTP is required',
	}),
});

// Verify email token param schema
const verifyEmailTokenParamSchema = Joi.object({
	token: Joi.string().required().messages({
		'string.empty': 'Verification token is required',
	}),
});

module.exports = {
	registerSchema,
	loginSchema,
	googleLoginSchema,
	googleRegisterSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	verifyEmailRequestSchema,
	verifyEmailOtpSchema,
	verifyEmailTokenParamSchema,
};
