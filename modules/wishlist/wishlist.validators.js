const Joi = require("joi");

exports.addWishlistSchema = Joi.object({
    bookId: Joi.number().required(),
});