const orderService = require("../services/orderService");

// @desc    Create new order from cart
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, notes } = req.body;

    // Validate shipping address
    if (!shippingAddress || shippingAddress.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: "Valid shipping address is required (minimum 10 characters)",
      });
    }

    const order = await orderService.createOrder(userId, {
      shippingAddress: shippingAddress.trim(),
      notes: notes ? notes.trim() : null,
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    console.error("[ERROR] Create order failed:", error);

    if (error.message === "Cart is empty") {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    if (
      error.message.includes("only has") ||
      error.message.includes("in stock")
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create order",
    });
  }
};

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await orderService.getUserOrders(userId, {
      page,
      limit,
    });

    res.json({
      success: true,
      count: result.count,
      pagination: result.pagination,
      data: result.orders,
    });
  } catch (error) {
    console.error("[ERROR] Get user orders failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders",
    });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await orderService.getOrderById(id, userId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("[ERROR] Get order by ID failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch order",
    });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await orderService.cancelOrder(id, userId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found or cannot be cancelled",
      });
    }

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    console.error("[ERROR] Cancel order failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel order",
    });
  }
};

// @desc    Get order by order number
// @route   GET /api/orders/number/:orderNumber
// @access  Private
exports.getOrderByNumber = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderNumber } = req.params;

    const order = await orderService.getOrderByNumber(orderNumber, userId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("[ERROR] Get order by number failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch order",
    });
  }
};

// @desc    Update shipping address
// @route   PUT /api/orders/:id/shipping
// @access  Private
exports.updateShippingAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { shippingAddress } = req.body;

    if (!shippingAddress || shippingAddress.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: "Valid shipping address is required",
      });
    }

    const order = await orderService.updateShippingAddress(
      id,
      userId,
      shippingAddress.trim()
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found or cannot be updated",
      });
    }

    res.json({
      success: true,
      message: "Shipping address updated",
      data: order,
    });
  } catch (error) {
    console.error("[ERROR] Update shipping address failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update shipping address",
    });
  }
};

// @desc    Track order status
// @route   GET /api/orders/:id/track
// @access  Private
exports.trackOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await orderService.trackOrder(id, userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[ERROR] Track order failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to track order",
    });
  }
};

// ==================== ADMIN FUNCTIONS ====================

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { status, startDate, endDate } = req.query;

    const result = await orderService.getAllOrders({
      page,
      limit,
      status,
      startDate,
      endDate,
    });

    res.json({
      success: true,
      count: result.count,
      pagination: result.pagination,
      filters: result.filters,
      data: result.orders,
    });
  } catch (error) {
    console.error("[ERROR] Get all orders failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders",
    });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/admin/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Valid status required: ${validStatuses.join(", ")}`,
      });
    }

    const order = await orderService.updateOrderStatus(id, status);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
    });
  } catch (error) {
    console.error("[ERROR] Update order status failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update order status",
    });
  }
};

// @desc    Get order statistics (Admin)
// @route   GET /api/orders/admin/statistics
// @access  Private/Admin
exports.getOrderStatistics = async (req, res) => {
  try {
    const statistics = await orderService.getOrderStatistics();

    res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error("[ERROR] Get order statistics failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch order statistics",
    });
  }
};
