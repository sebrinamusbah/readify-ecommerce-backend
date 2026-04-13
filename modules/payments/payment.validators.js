const Joi = require("joi");

exports.createIntentSchema = Joi.object({
    orderId: Joi.number().required(),
});