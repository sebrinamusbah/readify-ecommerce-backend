const { Order, OrderItem } = require("../../models");

exports.create = (data, transaction) => {
    return Order.create(data, { transaction });
};

exports.bulkCreateItems = (orderId, items, transaction) => {
    const data = items.map((item) => ({
        ...item,
        orderId,
    }));

    return OrderItem.bulkCreate(data, { transaction });
};

exports.findByUser = (userId) => {
    return Order.findAll({
        where: { userId },
        include: [OrderItem],
        order: [
            ["createdAt", "DESC"]
        ],
    });
};

exports.findById = (id) => {
    return Order.findByPk(id, {
        include: [OrderItem],
    });
};