const Joi = require('joi');

/**
 * User Validation Schemas
 */

// Update user profile schema
const updateUserProfileSchema = Joi.object({
	name: Joi.string().min(2).max(100).optional().messages({
		'string.min': 'Name must be at least 2 characters',
		'string.max': 'Name must not exceed 100 characters',
	}),
	email: Joi.string().email().optional().messages({
		'string.email': 'Please provide a valid email',
	}),
	department: Joi.string().max(100).optional().allow('').messages({
		'string.max': 'Department must not exceed 100 characters',
	}),
	year: Joi.string().max(30).optional().allow(''),
	bio: Joi.string().max(500).optional().allow('').messages({
		'string.max': 'Bio must not exceed 500 characters',
	}),
	avatar: Joi.string().optional().allow('').messages({
		'string.base': 'Avatar must be a string',
	}),
	phone: Joi.string().pattern(/^[+]?[\d\s\-()]{7,}$/).optional().allow('').messages({
		'string.pattern.base': 'Please provide a valid phone number',
	}),
	alternateContact: Joi.string().max(120).optional().allow('').messages({
		'string.max': 'Alternate contact must not exceed 120 characters',
	}),
	interests: Joi.alternatives()
		.try(Joi.array().items(Joi.string().max(40)).max(10), Joi.string())
		.optional(),
	notificationChannels: Joi.object().optional(),
	notificationPreferences: Joi.object().optional(),
	emailPreferences: Joi.object().optional(),
}).min(1); // At least one field must be provided

// Change password schema
const changePasswordSchema = Joi.object({
	currentPassword: Joi.string().required().messages({
		'string.empty': 'Current password is required',
	}),
	newPassword: Joi.string().min(8).required().messages({
		'string.min': 'New password must be at least 8 characters',
		'string.empty': 'New password is required',
	}),
	confirmNewPassword: Joi.string()
		.valid(Joi.ref('newPassword'))
		.optional()
		.messages({
			'any.only': 'Passwords must match',
		}),
});

// Delete account schema
const deleteAccountSchema = Joi.object({
	currentPassword: Joi.string().optional().messages({
		'string.empty': 'Current password is required to delete account',
	}),
	confirmText: Joi.string()
		.valid('DELETE')
		.required()
		.messages({
			'any.only': 'Please type DELETE to confirm account deletion',
		}),
});

const userIdParamSchema = Joi.object({
	userId: Joi.string()
		.pattern(/^[0-9a-fA-F]{24}$/)
		.required()
		.messages({
			'string.pattern.base': 'Invalid user ID format',
			'string.empty': 'User ID is required',
		}),
});

const notificationIdParamSchema = Joi.object({
	id: Joi.string()
		.pattern(/^[0-9a-fA-F]{24}$/)
		.required()
		.messages({
			'string.pattern.base': 'Invalid notification ID format',
			'string.empty': 'Notification ID is required',
		}),
});

module.exports = {
	updateUserProfileSchema,
	changePasswordSchema,
	deleteAccountSchema,
	userIdParamSchema,
	notificationIdParamSchema,
};
