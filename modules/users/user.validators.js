const Joi = require("joi");

exports.updateUserSchema = Joi.object({
    name: Joi.string().min(2).optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(6).optional(),
});