const paymentService = require("../services/paymentService");

// @desc    Create payment intent (Stripe)
// @route   POST /api/payments/create-intent
// @access  Private
exports.createPaymentIntent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "Order ID is required",
      });
    }

    const result = await paymentService.createPaymentIntent(orderId, userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[ERROR] Create payment intent failed:", error);

    if (
      error.message === "Order not found or cancelled" ||
      error.message === "Order already has a completed payment"
    ) {
      const statusCode = error.message.includes("not found") ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create payment intent",
    });
  }
};

// @desc    Handle Stripe webhook
// @route   POST /api/payments/webhook
// @access  Public (Stripe calls this)
exports.handleStripeWebhook = async (req, res) => {
  try {
    await paymentService.handleStripeWebhook(req);
    res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);

    if (error.message.includes("Webhook Error")) {
      return res.status(400).send(error.message);
    }

    res.status(500).json({ error: "Webhook handler failed" });
  }
};

// @desc    Create cash on delivery payment
// @route   POST /api/payments/cod
// @access  Private
exports.createCashOnDelivery = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "Order ID is required",
      });
    }

    const payment = await paymentService.createCashOnDelivery(orderId, userId);

    res.status(201).json({
      success: true,
      message: "Cash on delivery payment recorded",
      data: payment,
    });
  } catch (error) {
    console.error("[ERROR] Create COD payment failed:", error);

    if (
      error.message === "Order not found or cancelled" ||
      error.message === "Order already has a payment"
    ) {
      const statusCode = error.message.includes("not found") ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create COD payment",
    });
  }
};

// @desc    Create PayPal payment
// @route   POST /api/payments/paypal
// @access  Private
exports.createPayPalPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, transactionId } = req.body;

    if (!orderId || !transactionId) {
      return res.status(400).json({
        success: false,
        error: "Order ID and PayPal transaction ID are required",
      });
    }

    const payment = await paymentService.createPayPalPayment(
      orderId,
      userId,
      transactionId
    );

    res.status(201).json({
      success: true,
      message: "PayPal payment recorded",
      data: payment,
    });
  } catch (error) {
    console.error("[ERROR] Create PayPal payment failed:", error);

    if (
      error.message === "Order not found or cancelled" ||
      error.message === "Order already has a completed payment"
    ) {
      const statusCode = error.message.includes("not found") ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create PayPal payment",
    });
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
exports.getPaymentById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const payment = await paymentService.getPaymentById(id, userId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found",
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("[ERROR] Get payment by ID failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment",
    });
  }
};

// @desc    Get payments for an order
// @route   GET /api/payments/order/:orderId
// @access  Private
exports.getPaymentsByOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const payments = await paymentService.getPaymentsByOrder(orderId, userId);

    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("[ERROR] Get payments by order failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payments",
    });
  }
};

// @desc    Get user's payment history
// @route   GET /api/payments/history
// @access  Private
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await paymentService.getPaymentHistory(userId, {
      page,
      limit,
    });

    res.json({
      success: true,
      count: result.count,
      pagination: result.pagination,
      data: result.payments,
    });
  } catch (error) {
    console.error("[ERROR] Get payment history failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment history",
    });
  }
};

// @desc    Refund payment
// @route   POST /api/payments/:id/refund
// @access  Private/Admin
exports.refundPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await paymentService.refundPayment(id, reason);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found",
      });
    }

    res.json({
      success: true,
      message: "Payment refunded successfully",
      data: payment,
    });
  } catch (error) {
    console.error("[ERROR] Refund payment failed:", error);

    if (error.message === "Only completed payments can be refunded") {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to process refund",
    });
  }
};

// ==================== ADMIN FUNCTIONS ====================

// @desc    Update payment status (Admin)
// @route   PUT /api/payments/admin/:id/status
// @access  Private/Admin
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "completed", "failed", "refunded"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Valid status required: ${validStatuses.join(", ")}`,
      });
    }

    const payment = await paymentService.updatePaymentStatus(id, status);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found",
      });
    }

    res.json({
      success: true,
      message: `Payment status updated to ${status}`,
      data: payment,
    });
  } catch (error) {
    console.error("[ERROR] Update payment status failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update payment status",
    });
  }
};

// @desc    Get all payments (Admin)
// @route   GET /api/payments/admin/all
// @access  Private/Admin
exports.getAllPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { status, paymentMethod, startDate, endDate } = req.query;

    const result = await paymentService.getAllPayments({
      page,
      limit,
      status,
      paymentMethod,
      startDate,
      endDate,
    });

    res.json({
      success: true,
      count: result.count,
      totals: result.totals,
      pagination: result.pagination,
      filters: result.filters,
      data: result.payments,
    });
  } catch (error) {
    console.error("[ERROR] Get all payments failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payments",
    });
  }
};

// @desc    Get payment statistics (Admin)
// @route   GET /api/payments/admin/statistics
// @access  Private/Admin
exports.getPaymentStatistics = async (req, res) => {
  try {
    const statistics = await paymentService.getPaymentStatistics();

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error("[ERROR] Get payment statistics failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch payment statistics",
    });
  }
};
