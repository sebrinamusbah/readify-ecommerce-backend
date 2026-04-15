const AppError = require("../shared/errors/AppError");
const logger = require("../shared/logger/logger");

module.exports = (err, req, res, next) => {
    logger.error(err.message);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }

    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
};