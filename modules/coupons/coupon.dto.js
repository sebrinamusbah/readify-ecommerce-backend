exports.couponDTO = (c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    expiryDate: c.expiryDate,
    isActive: c.isActive,
});