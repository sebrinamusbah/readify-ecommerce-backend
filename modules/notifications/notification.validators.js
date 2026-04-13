const Joi = require("joi");

exports.createNotificationSchema = Joi.object({
    userId: Joi.number().required(),
    type: Joi.string().required(),
    message: Joi.string().required(),
});