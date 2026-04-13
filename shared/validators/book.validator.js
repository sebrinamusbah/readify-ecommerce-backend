const Joi = require("joi");

exports.createBookSchema = Joi.object({
    title: Joi.string().required(),
    author: Joi.string().required(),
    price: Joi.number().positive().required(),
    categoryId: Joi.number().required(),
    description: Joi.string().optional(),
});

exports.updateBookSchema = Joi.object({
    title: Joi.string().optional(),
    author: Joi.string().optional(),
    price: Joi.number().positive().optional(),
});