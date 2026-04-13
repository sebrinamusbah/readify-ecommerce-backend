const { Coupon } = require("../../models");

exports.create = (data) => {
    return Coupon.create(data);
};

exports.findAll = () => {
    return Coupon.findAll({
        order: [
            ["createdAt", "DESC"]
        ],
    });
};

exports.findByCode = (code) => {
    return Coupon.findOne({
        where: { code },
    });
};

exports.incrementUsage = async(id) => {
    const coupon = await Coupon.findByPk(id);
    if (!coupon) return;

    return coupon.update({
        usedCount: coupon.usedCount + 1,
    });
};