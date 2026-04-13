const adminService = require("./admin.service");

exports.getDashboard = async(req, res, next) => {
    try {
        const data = await adminService.getDashboard();
        res.json(data);
    } catch (err) {
        next(err);
    }
};

exports.getUsers = async(req, res, next) => {
    try {
        const users = await adminService.getUsers(req.query);
        res.json(users);
    } catch (err) {
        next(err);
    }
};

exports.banUser = async(req, res, next) => {
    try {
        const result = await adminService.banUser(req.params.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.featureBook = async(req, res, next) => {
    try {
        const result = await adminService.featureBook(req.params.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.getAllOrders = async(req, res, next) => {
    try {
        const orders = await adminService.getAllOrders(req.query);
        res.json(orders);
    } catch (err) {
        next(err);
    }
};

exports.updateOrderStatus = async(req, res, next) => {
    try {
        const result = await adminService.updateOrderStatus(
            req.params.id,
            req.body.status,
        );
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.deleteReview = async(req, res, next) => {
    try {
        await adminService.deleteReview(req.params.id);
        res.json({ message: "Review deleted" });
    } catch (err) {
        next(err);
    }
};