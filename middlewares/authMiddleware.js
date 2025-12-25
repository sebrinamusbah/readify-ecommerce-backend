const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/auth");
const { User } = require("../models");

const protect = async(req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, no token provided",
            });
        }

        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ["password"] },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: "User account is deactivated",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Not authorized, token failed",
        });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admin privileges required.",
        });
    }
};

module.exports = { protect, admin };