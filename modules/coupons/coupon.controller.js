const couponService = require("./coupon.service");

exports.create = async(req, res, next) => {
    try {
        const coupon = await couponService.create(req.body);
        res.status(201).json(coupon);
    } catch (err) {
        next(err);
    }
};

exports.getAll = async(req, res, next) => {
    try {
        const coupons = await couponService.getAll();
        res.json(coupons);
    } catch (err) {
        next(err);
    }
};

exports.apply = async(req, res, next) => {
    try {
        const result = await couponService.apply(req.user.id, req.body);
        res.json(result);
    } catch (err) {
        next(err);
    }
};