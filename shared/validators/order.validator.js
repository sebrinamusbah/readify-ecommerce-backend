const Joi = require("joi");

exports.createOrderSchema = Joi.object({
    items: Joi.array()
        .items(
            Joi.object({
                bookId: Joi.number().required(),
                quantity: Joi.number().min(1).required(),
            }),
        )
        .required(),
});