const Joi = require('joi');

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const ensureScheduleConstraints = (value, helpers) => {
	if (!value.day && !value.date) {
		return helpers.message('Either day or date is required');
	}

	if (value.startTime && value.endTime && value.startTime >= value.endTime) {
		return helpers.message('End time must be after start time');
	}

	return value;
};

const createScheduleSchema = Joi.object({
	subject: Joi.string().max(200).optional().allow('').messages({
		'string.max': 'Subject must not exceed 200 characters',
	}),
	title: Joi.string().max(200).optional().allow('').messages({
		'string.max': 'Title must not exceed 200 characters',
	}),
	faculty: Joi.string().max(120).required().messages({
		'string.empty': 'Faculty is required',
	}),
	department: Joi.string().max(120).required().messages({
		'string.empty': 'Department is required',
	}),
	day: Joi.string()
		.valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
		.optional()
		.messages({
			'any.only': 'Day must be one of Monday-Sunday',
		}),
	date: Joi.date().iso().optional().messages({
		'date.base': 'Date must be a valid date',
		'date.iso': 'Date must be in ISO format',
	}),
	startTime: Joi.string().pattern(timePattern).required().messages({
		'string.pattern.base': 'Start time must be in HH:MM 24-hour format',
		'string.empty': 'Start time is required',
	}),
	endTime: Joi.string().pattern(timePattern).required().messages({
		'string.pattern.base': 'End time must be in HH:MM 24-hour format',
		'string.empty': 'End time is required',
	}),
	room: Joi.string().max(120).required().messages({
		'string.empty': 'Room is required',
	}),
	type: Joi.string().valid('lecture', 'lab', 'exam').default('lecture').messages({
		'any.only': 'Type must be one of: lecture, lab, exam',
	}),
})
	.or('subject', 'title')
	.messages({
		'object.missing': 'Either subject or title is required',
	})
	.custom(ensureScheduleConstraints, 'schedule constraint validation');

const updateScheduleSchema = Joi.object({
	subject: Joi.string().max(200).optional().allow('').messages({
		'string.max': 'Subject must not exceed 200 characters',
	}),
	title: Joi.string().max(200).optional().allow('').messages({
		'string.max': 'Title must not exceed 200 characters',
	}),
	faculty: Joi.string().max(120).optional(),
	department: Joi.string().max(120).optional(),
	day: Joi.string()
		.valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
		.optional()
		.messages({
			'any.only': 'Day must be one of Monday-Sunday',
		}),
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
	room: Joi.string().max(120).optional(),
	type: Joi.string().valid('lecture', 'lab', 'exam').optional().messages({
		'any.only': 'Type must be one of: lecture, lab, exam',
	}),
})
	.min(1)
	.custom((value, helpers) => {
		if (value.startTime && value.endTime && value.startTime >= value.endTime) {
			return helpers.message('End time must be after start time');
		}
		return value;
	}, 'update schedule constraint validation');

const scheduleRowSchema = Joi.object({
	subject: Joi.string().allow('').optional(),
	title: Joi.string().allow('').optional(),
	faculty: Joi.string().required().messages({
		'string.empty': 'Faculty is required',
	}),
	department: Joi.string().required().messages({
		'string.empty': 'Department is required',
	}),
	day: Joi.string().allow('').optional(),
	date: Joi.alternatives().try(Joi.date().iso(), Joi.string().allow('')).optional(),
	startTime: Joi.string().pattern(timePattern).required().messages({
		'string.pattern.base': 'startTime must be in HH:MM 24-hour format',
	}),
	endTime: Joi.string().pattern(timePattern).required().messages({
		'string.pattern.base': 'endTime must be in HH:MM 24-hour format',
	}),
	room: Joi.string().required().messages({
		'string.empty': 'Room is required',
	}),
	type: Joi.string().valid('lecture', 'lab', 'exam').optional(),
}).or('subject', 'title');

const importScheduleSchema = Joi.object({
	rows: Joi.array().items(scheduleRowSchema).min(1).required().messages({
		'array.base': 'rows must be an array',
		'array.min': 'At least one row is required for import',
		'any.required': 'rows are required',
	}),
	mode: Joi.string().valid('replace', 'append').default('replace').messages({
		'any.only': 'Mode must be one of: replace, append',
	}),
	dryRun: Joi.boolean().default(false),
});

const idParamSchema = Joi.object({
	id: Joi.string()
		.pattern(/^[0-9a-fA-F]{24}$/)
		.required()
		.messages({
			'string.pattern.base': 'Invalid schedule ID format',
			'string.empty': 'Schedule ID is required',
		}),
});

const versionIdParamSchema = Joi.object({
	versionId: Joi.string()
		.pattern(/^[0-9a-fA-F]{24}$/)
		.required()
		.messages({
			'string.pattern.base': 'Invalid version ID format',
			'string.empty': 'Version ID is required',
		}),
});

module.exports = {
	createScheduleSchema,
	updateScheduleSchema,
	importScheduleSchema,
	idParamSchema,
	versionIdParamSchema,
};
