const Joi = require("joi");

exports.createCouponSchema = Joi.object({
    code: Joi.string().required(),
    type: Joi.string().valid("PERCENTAGE", "FIXED").required(),
    value: Joi.number().required(),
    expiryDate: Joi.date().required(),
    minOrderAmount: Joi.number().default(0),
    usageLimit: Joi.number().optional(),
});

exports.applyCouponSchema = Joi.object({
    code: Joi.string().required(),
    orderId: Joi.number().required(),
});