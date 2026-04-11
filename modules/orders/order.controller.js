const orderService = require("./order.service");

class OrderController {
  async createOrder(req, res) {
    try {
      const { shippingAddress, notes } = req.body;

      const order = await orderService.createOrder(
        req.user.id,
        shippingAddress,
        notes,
      );

      res.status(201).json({
        success: true,
        message: "Order created",
        data: order,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async getUserOrders(req, res) {
    try {
      const orders = await orderService.getUserOrders(req.user.id);

      res.json({ success: true, data: orders });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getOrderById(req, res) {
    try {
      const order = await orderService.getOrderById(req.params.id, req.user.id);

      if (!order) {
        return res.status(404).json({ error: "Not found" });
      }

      res.json({ success: true, data: order });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async cancelOrder(req, res) {
    try {
      await orderService.cancelOrder(req.params.id, req.user.id);

      res.json({ success: true, message: "Order cancelled" });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}

module.exports = new OrderController();
