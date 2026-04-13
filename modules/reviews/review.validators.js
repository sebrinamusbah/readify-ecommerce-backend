const Joi = require("joi");

exports.createReviewSchema = Joi.object({
    bookId: Joi.number().required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().optional(),
});

exports.updateReviewSchema = Joi.object({
    rating: Joi.number().min(1).max(5).optional(),
    comment: Joi.string().optional(),
});