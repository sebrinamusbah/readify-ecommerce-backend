const Joi = require("joi");

exports.addToCartSchema = Joi.object({
    bookId: Joi.number().required(),
    quantity: Joi.number().min(1).required(),
});

exports.updateCartItemSchema = Joi.object({
    quantity: Joi.number().min(1).required(),
});