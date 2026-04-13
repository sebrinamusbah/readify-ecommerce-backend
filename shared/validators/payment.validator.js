const Joi = require("joi");

exports.createPaymentIntentSchema = Joi.object({
    orderId: Joi.number().required(),
});