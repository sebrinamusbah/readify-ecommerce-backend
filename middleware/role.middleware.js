const { ForbiddenError } = require("../shared/errors");

module.exports = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ForbiddenError("Access denied"));
        }

        next();
    };
};