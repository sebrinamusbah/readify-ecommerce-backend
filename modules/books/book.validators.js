const Joi = require("joi");

exports.createBookSchema = Joi.object({
    title: Joi.string().required(),
    author: Joi.string().required(),
    price: Joi.number().required(),
    description: Joi.string().optional(),
    categoryId: Joi.number().required(),
    stock: Joi.number().default(0),
});

exports.updateBookSchema = Joi.object({
    title: Joi.string().optional(),
    author: Joi.string().optional(),
    price: Joi.number().optional(),
    description: Joi.string().optional(),
    categoryId: Joi.number().optional(),
    stock: Joi.number().optional(),
});