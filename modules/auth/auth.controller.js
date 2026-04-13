const authService = require("./auth.service");

exports.register = async(req, res, next) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

exports.login = async(req, res, next) => {
    try {
        const result = await authService.login(req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.refreshToken = async(req, res, next) => {
    try {
        const result = await authService.refreshToken(req.body.refreshToken);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.logout = async(req, res, next) => {
    try {
        await authService.logout(req.user.id);
        res.json({ message: "Logged out successfully" });
    } catch (err) {
        next(err);
    }
};