const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit per IP
    message: {
        success: false,
        message: "Too many requests, please try again later",
    },
});