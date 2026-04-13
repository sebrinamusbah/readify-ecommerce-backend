exports.calculateDiscount = (type, value, total) => {
    if (type === "PERCENTAGE") {
        return (total * value) / 100;
    }
    return value;
};