const Joi = require('joi');

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const ensureEndAfterStart = (value, helpers) => {
	const start = value.startTime;
	const end = value.endTime;

	if (!start || !end) {
		return value;
	}

	if (start >= end) {
		return helpers.message('End time must be after start time');
	}

	return value;
};

/**
 * Event Validation Schemas
 */

// Create event schema
const createEventSchema = Joi.object({
	title: Joi.string().min(3).max(200).required().messages({
		'string.empty': 'Event title is required',
		'string.min': 'Title must be at least 3 characters',
		'string.max': 'Title must not exceed 200 characters',
	}),
	description: Joi.string().max(2000).required().messages({
		'string.empty': 'Description is required',
		'string.max': 'Description must not exceed 2000 characters',
	}),
	department: Joi.string().max(100).required().messages({
		'string.empty': 'Department is required',
	}),
	type: Joi.string().valid('event', 'lecture', 'exam').default('event').messages({
		'any.only': 'Type must be one of: event, lecture, exam',
	}),
	venue: Joi.string().max(300).required().messages({
		'string.empty': 'Venue is required',
	}),
	date: Joi.date().iso().required().messages({
		'date.base': 'Date must be a valid date',
		'date.iso': 'Date must be in ISO format',
		'any.required': 'Date is required',
	}),
	startTime: Joi.string().pattern(timePattern).required().messages({
		'string.pattern.base': 'Start time must be in HH:MM 24-hour format',
		'string.empty': 'Start time is required',
	}),
	endTime: Joi.string().pattern(timePattern).required().messages({
		'string.pattern.base': 'End time must be in HH:MM 24-hour format',
		'string.empty': 'End time is required',
	}),
	participants: Joi.number().integer().min(1).optional().messages({
		'number.base': 'Participants must be a number',
		'number.min': 'Participants must be at least 1',
	}),
	organizer: Joi.string().max(120).optional().allow(''),
	category: Joi.string().max(120).optional().allow(''),
}).custom(ensureEndAfterStart, 'time ordering validation');

// Update event schema
const updateEventSchema = Joi.object({
	title: Joi.string().min(3).max(200).optional().messages({
		'string.min': 'Title must be at least 3 characters',
		'string.max': 'Title must not exceed 200 characters',
	}),
	description: Joi.string().max(2000).optional().messages({
		'string.max': 'Description must not exceed 2000 characters',
	}),
	department: Joi.string().max(100).optional(),
	type: Joi.string().valid('event', 'lecture', 'exam').optional().messages({
		'any.only': 'Type must be one of: event, lecture, exam',
	}),
	venue: Joi.string().max(300).optional(),
	date: Joi.date().iso().optional().messages({
		'date.base': 'Date must be a valid date',
		'date.iso': 'Date must be in ISO format',
	}),
	startTime: Joi.string().pattern(timePattern).optional().messages({
		'string.pattern.base': 'Start time must be in HH:MM 24-hour format',
	}),
	endTime: Joi.string().pattern(timePattern).optional().messages({
		'string.pattern.base': 'End time must be in HH:MM 24-hour format',
	}),
	participants: Joi.number().integer().min(1).optional().messages({
		'number.base': 'Participants must be a number',
		'number.min': 'Participants must be at least 1',
	}),
	organizer: Joi.string().max(120).optional().allow(''),
	category: Joi.string()
		.optional()
		.messages({
			'string.max': 'Category must not exceed 120 characters',
		}),
	status: Joi.string()
		.valid('pending', 'approved', 'rejected')
		.optional()
		.messages({
			'any.only': 'Status must be one of: pending, approved, rejected',
		}),
}).min(1).custom(ensureEndAfterStart, 'time ordering validation'); // At least one field must be provided

// Check conflicts schema
const checkConflictsSchema = Joi.object({
	date: Joi.date().iso().required().messages({
		'date.base': 'Date must be a valid date',
		'date.iso': 'Date must be in ISO format',
		'any.required': 'Date is required',
	}),
	startTime: Joi.string().pattern(timePattern).required().messages({
		'string.pattern.base': 'Start time must be in HH:MM 24-hour format',
		'string.empty': 'Start time is required',
	}),
	endTime: Joi.string().pattern(timePattern).required().messages({
		'string.pattern.base': 'End time must be in HH:MM 24-hour format',
		'string.empty': 'End time is required',
	}),
	type: Joi.string().valid('event', 'lecture', 'exam').optional(),
	excludeEventId: Joi.string().optional().messages({
		'string.base': 'Exclude event ID must be a string',
	}),
}).custom(ensureEndAfterStart, 'time ordering validation');

const eventIdParamSchema = Joi.object({
	id: Joi.string()
		.pattern(/^[0-9a-fA-F]{24}$/)
		.required()
		.messages({
			'string.pattern.base': 'Invalid event ID format',
			'string.empty': 'Event ID is required',
		}),
});

const conflictItemSchema = Joi.object({
	source: Joi.string().valid('event', 'schedule').optional(),
	type: Joi.string().valid('event', 'lecture', 'exam', 'lab').optional(),
	title: Joi.string().max(200).optional().allow(''),
	date: Joi.string().max(64).optional().allow(''),
	startTime: Joi.string().pattern(timePattern).optional(),
	endTime: Joi.string().pattern(timePattern).optional(),
	priority: Joi.number().integer().min(1).max(3).optional(),
	message: Joi.string().max(500).optional().allow(''),
	isBlocking: Joi.boolean().optional(),
});

const suggestionItemSchema = Joi.object({
	date: Joi.string().max(64).required().messages({
		'any.required': 'Suggestion date is required',
	}),
	startTime: Joi.string().pattern(timePattern).required().messages({
		'string.pattern.base': 'Suggestion startTime must be in HH:MM format',
		'any.required': 'Suggestion startTime is required',
	}),
	endTime: Joi.string().pattern(timePattern).required().messages({
		'string.pattern.base': 'Suggestion endTime must be in HH:MM format',
		'any.required': 'Suggestion endTime is required',
	}),
	label: Joi.string().max(120).optional().allow(''),
	score: Joi.number().min(0).max(1).optional(),
});

const eventCoreSchema = Joi.object({
	title: Joi.string().max(200).optional().allow(''),
	description: Joi.string().max(2000).optional().allow(''),
	department: Joi.string().max(100).optional().allow(''),
	type: Joi.string().valid('event', 'lecture', 'exam').default('event'),
	venue: Joi.string().max(300).optional().allow(''),
	date: Joi.date().iso().required().messages({
		'date.base': 'Date must be a valid date',
		'date.iso': 'Date must be in ISO format',
		'any.required': 'Date is required',
	}),
	startTime: Joi.string().pattern(timePattern).required().messages({
		'string.pattern.base': 'Start time must be in HH:MM 24-hour format',
		'any.required': 'Start time is required',
	}),
	endTime: Joi.string().pattern(timePattern).required().messages({
		'string.pattern.base': 'End time must be in HH:MM 24-hour format',
		'any.required': 'End time is required',
	}),
}).custom(ensureEndAfterStart, 'time ordering validation');

const aiConflictAssistanceSchema = Joi.object({
	event: eventCoreSchema.required(),
	conflicts: Joi.array().items(conflictItemSchema).optional().default([]),
	blockingConflicts: Joi.array().items(conflictItemSchema).optional().default([]),
	suggestions: Joi.array().items(suggestionItemSchema).optional().default([]),
	hasConflict: Joi.boolean().optional(),
	blocked: Joi.boolean().optional(),
	ai: Joi.object({
		enabled: Joi.boolean().optional(),
		available: Joi.boolean().optional(),
		provider: Joi.string().max(50).optional(),
		reason: Joi.string().max(120).optional().allow(null, ''),
	}).optional(),
});

const aiAdminAssistanceSchema = Joi.object({
	event: eventCoreSchema.required(),
	conflictDetail: Joi.object({
		conflicts: Joi.array().items(conflictItemSchema).optional().default([]),
		blockingConflicts: Joi.array().items(conflictItemSchema).optional().default([]),
		suggestions: Joi.array().items(suggestionItemSchema).optional().default([]),
		blocked: Joi.boolean().optional(),
		hasConflict: Joi.boolean().optional(),
	}).optional().default({}),
	policyFlags: Joi.object({
		allowBlockedOverride: Joi.boolean().optional().default(false),
		requireOverrideForBlocking: Joi.boolean().optional().default(true),
	}).optional().default({}),
});

module.exports = {
	createEventSchema,
	updateEventSchema,
	checkConflictsSchema,
	eventIdParamSchema,
	aiConflictAssistanceSchema,
	aiAdminAssistanceSchema,
};
