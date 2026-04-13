const Joi = require("joi");

exports.createCategorySchema = Joi.object({
    name: Joi.string().required(),
    parentId: Joi.number().allow(null),
});

exports.updateCategorySchema = Joi.object({
    name: Joi.string().optional(),
    parentId: Joi.number().allow(null),
});