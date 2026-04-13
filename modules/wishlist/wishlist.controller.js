const wishlistService = require("./wishlist.service");

exports.getWishlist = async(req, res, next) => {
    try {
        const data = await wishlistService.getUserWishlist(req.user.id);
        res.json(data);
    } catch (err) {
        next(err);
    }
};

exports.addToWishlist = async(req, res, next) => {
    try {
        const result = await wishlistService.add(req.user.id, req.body.bookId);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

exports.removeFromWishlist = async(req, res, next) => {
    try {
        await wishlistService.remove(req.user.id, req.params.bookId);
        res.json({ message: "Removed" });
    } catch (err) {
        next(err);
    }
};