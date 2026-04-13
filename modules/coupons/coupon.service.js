const couponRepo = require("./coupon.repository");
const orderRepo = require("../orders/order.repository");

const { NotFoundError, BadRequestError } = require("../../shared/errors");

const { couponDTO } = require("./coupon.dto");

exports.create = async(data) => {
    const coupon = await couponRepo.create(data);
    return couponDTO(coupon);
};

exports.getAll = async() => {
    const coupons = await couponRepo.findAll();
    return coupons.map(couponDTO);
};

exports.apply = async(userId, { code, orderId }) => {
    const coupon = await couponRepo.findByCode(code);

    if (!coupon) throw new NotFoundError("Coupon not found");

    const order = await orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");

    // 1. check validity
    if (!coupon.isActive) {
        throw new BadRequestError("Coupon is inactive");
    }

    if (new Date() > coupon.expiryDate) {
        throw new BadRequestError("Coupon expired");
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        throw new BadRequestError("Coupon usage limit reached");
    }

    if (order.total < coupon.minOrderAmount) {
        throw new BadRequestError(
            `Minimum order amount is ${coupon.minOrderAmount}`,
        );
    }

    // 2. calculate discount
    let discount = 0;

    if (coupon.type === "PERCENTAGE") {
        discount = (order.total * coupon.value) / 100;
    } else {
        discount = coupon.value;
    }

    const finalTotal = Math.max(order.total - discount, 0);

    // 3. update coupon usage
    await couponRepo.incrementUsage(coupon.id);

    return {
        originalTotal: order.total,
        discount,
        finalTotal,
    };
};