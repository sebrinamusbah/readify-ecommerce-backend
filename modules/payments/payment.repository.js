const { Payment, Order } = require("../../models");

class PaymentRepository {
  create(data) {
    return Payment.create(data);
  }

  findByTransactionId(id) {
    return Payment.findOne({ where: { transactionId: id } });
  }

  findByOrder(orderId) {
    return Payment.findOne({ where: { orderId } });
  }

  update(payment, data) {
    return payment.update(data);
  }

  getStats() {
    return Payment.findAll({
      attributes: ["status", "paymentMethod"],
    });
  }
}

module.exports = new PaymentRepository();
