const userService = require("./user.service");

exports.getMe = async(req, res, next) => {
    try {
        const user = await userService.getById(req.user.id);
        res.json(user);
    } catch (err) {
        next(err);
    }
};

exports.updateMe = async(req, res, next) => {
    try {
        const user = await userService.update(req.user.id, req.body);
        res.json(user);
    } catch (err) {
        next(err);
    }
};

exports.getAllUsers = async(req, res, next) => {
    try {
        const users = await userService.getAll(req.query);
        res.json(users);
    } catch (err) {
        next(err);
    }
};

exports.getUserById = async(req, res, next) => {
    try {
        const user = await userService.getById(req.params.id);
        res.json(user);
    } catch (err) {
        next(err);
    }
};

exports.deleteUser = async(req, res, next) => {
    try {
        await userService.delete(req.params.id);
        res.json({ message: "User deleted" });
    } catch (err) {
        next(err);
    }
};