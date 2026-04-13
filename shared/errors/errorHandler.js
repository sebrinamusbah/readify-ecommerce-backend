const AppError = require("./AppError");

const errorHandler = (err, req, res, next) => {
    console.error("ERROR 💥:", err);

    // operational error (known)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }

    // unknown error (crash protection)
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
};

module.exports = errorHandler;