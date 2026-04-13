const Joi = require("joi");

exports.searchSchema = Joi.object({
    q: Joi.string().allow("").optional(),
    category: Joi.string().optional(),
    minPrice: Joi.number().optional(),
    maxPrice: Joi.number().optional(),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(50).default(10),
});