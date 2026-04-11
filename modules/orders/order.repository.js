const {
  Order,
  OrderItem,
  Book,
  CartItem,
  User,
  Payment,
} = require("../../models");
const { Op } = require("sequelize");

class OrderRepository {
  async getCartItems(userId, transaction = null) {
    return CartItem.findAll({
      where: { userId },
      include: [{ model: Book, as: "book" }],
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined,
    });
  }

  async createOrder(data, transaction) {
    return Order.create(data, { transaction });
  }

  async createOrderItem(data, transaction) {
    return OrderItem.create(data, { transaction });
  }

  async deleteCart(userId, transaction) {
    return CartItem.destroy({ where: { userId }, transaction });
  }

  async getOrderById(id, userId) {
    return Order.findOne({
      where: { id, userId },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Book, as: "book" }],
        },
        { model: Payment, as: "payment" },
      ],
    });
  }

  async getUserOrders(userId) {
    return Order.findAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Book, as: "book" }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
  }

  async updateOrderStatus(id, status, transaction = null) {
    return Order.update({ status }, { where: { id }, transaction });
  }
}

module.exports = new OrderRepository();
