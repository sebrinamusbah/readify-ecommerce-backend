const { OrderItem } = require("../../models");

class OrderItemRepository {
  create(data, transaction) {
    return OrderItem.create(data, { transaction });
  }

  findByOrder(orderId) {
    return OrderItem.findAll({ where: { orderId } });
  }
}

module.exports = new OrderItemRepository();
