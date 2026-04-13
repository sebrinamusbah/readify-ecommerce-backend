const cartService = require("./cart.service");

exports.getCart = async(req, res, next) => {
    try {
        const cart = await cartService.getCart(req.user.id);
        res.json(cart);
    } catch (err) {
        next(err);
    }
};

exports.addToCart = async(req, res, next) => {
    try {
        const cart = await cartService.addToCart(req.user.id, req.body);
        res.json(cart);
    } catch (err) {
        next(err);
    }
};

exports.updateItem = async(req, res, next) => {
    try {
        const cart = await cartService.updateItem(
            req.user.id,
            req.params.itemId,
            req.body,
        );
        res.json(cart);
    } catch (err) {
        next(err);
    }
};

exports.removeItem = async(req, res, next) => {
    try {
        const cart = await cartService.removeItem(req.user.id, req.params.itemId);
        res.json(cart);
    } catch (err) {
        next(err);
    }
};

exports.clearCart = async(req, res, next) => {
    try {
        await cartService.clearCart(req.user.id);
        res.json({ message: "Cart cleared" });
    } catch (err) {
        next(err);
    }
};