const orderService = require("./order.service");

exports.createOrder = async(req, res, next) => {
    try {
        const order = await orderService.createOrder(req.user.id);
        res.status(201).json(order);
    } catch (err) {
        next(err);
    }
};

exports.getMyOrders = async(req, res, next) => {
    try {
        const orders = await orderService.getUserOrders(req.user.id);
        res.json(orders);
    } catch (err) {
        next(err);
    }
};

exports.getOrderById = async(req, res, next) => {
    try {
        const order = await orderService.getById(req.user.id, req.params.id);
        res.json(order);
    } catch (err) {
        next(err);
    }
};