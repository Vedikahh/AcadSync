const Joi = require('joi');
const { ValidationError } = require('../utils/errorHandler');

/**
 * Validation middleware factory
 * Validates request body, params, query against a Joi schema
 * Returns 400 with error details if validation fails
 */
const validate = (schema, source = 'body') => {
	return (req, res, next) => {
		const dataToValidate = source === 'body' ? req.body : source === 'params' ? req.params : req.query;

		const { error, value } = schema.validate(dataToValidate, {
			abortEarly: false, // Get all errors, not just first
			stripUnknown: true, // Remove unknown fields
		});

		if (error) {
			return next(new ValidationError('Validation failed', {
				errors: error.details.map((detail) => ({
					field: detail.path.join('.'),
					message: detail.message.replace(/['"]/g, ''),
				})),
			}));
		}

		// Replace req data with validated value (removes unknown fields)
		if (source === 'body') req.body = value;
		else if (source === 'params') req.params = value;
		else req.query = value;

		next();
	};
};

module.exports = { validate };
