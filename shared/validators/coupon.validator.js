const Joi = require("joi");

exports.applyCouponSchema = Joi.object({
    code: Joi.string().required(),
    orderId: Joi.number().required(),
});