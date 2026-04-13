exports.calculateRevenue = (orders) => {
    return orders.reduce((sum, o) => sum + o.total, 0);
};