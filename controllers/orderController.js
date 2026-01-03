// controllers/orderController.js
const {
  Order,
  OrderItem,
  Book,
  User,
  Payment,
  CartItem,
} = require("../models");
const { Op } = require("sequelize");
const nodemailer = require("nodemailer");

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD-${timestamp}-${random}`;
};

// Send order confirmation email
const sendOrderEmail = async (userEmail, order, orderItems) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: `
        <h1>Thank you for your order!</h1>
        <p>Order Number: <strong>${order.orderNumber}</strong></p>
        <p>Order Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
        <p>Total Amount: $${order.totalAmount.toFixed(2)}</p>
        
        <h2>Order Details:</h2>
        <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
          <thead>
            <tr>
              <th>Book</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderItems
              .map(
                (item) => `
              <tr>
                <td>${item.book.title}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        
        <p>Shipping Address: ${order.shippingAddress}</p>
        <p>Order Status: ${order.status}</p>
        
        <p>You can track your order in your account dashboard.</p>
        <p>Thank you for shopping with us!</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${userEmail}`);
  } catch (error) {
    console.error("Failed to send order email:", error);
  }
};

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

    // Get user's cart items
    const cartItems = await CartItem.findAll({
      where: { userId },
      include: [
        {
          model: Book,
          as: "book",
          attributes: ["id", "title", "price", "stock"],
        },
      ],
    });

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Cart is empty",
      });
    }

    // Validate stock and calculate total
    let totalAmount = 0;
    const orderItemsData = [];

    for (const cartItem of cartItems) {
      // Check stock availability
      if (cartItem.book.stock < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          error: `"${cartItem.book.title}" only has ${cartItem.book.stock} items in stock`,
        });
      }

      const itemTotal = cartItem.book.price * cartItem.quantity;
      totalAmount += itemTotal;

      orderItemsData.push({
        bookId: cartItem.bookId,
        quantity: cartItem.quantity,
        price: cartItem.book.price,
        itemTotal: itemTotal,
      });
    }

    // Create order
    const order = await Order.create({
      userId,
      orderNumber: generateOrderNumber(),
      totalAmount,
      shippingAddress: shippingAddress.trim(),
      notes: notes ? notes.trim() : null,
      status: "pending",
    });

    // Create order items
    const orderItems = await Promise.all(
      orderItemsData.map((itemData) =>
        OrderItem.create({
          orderId: order.id,
          ...itemData,
        })
      )
    );

    // Update book stock
    for (const cartItem of cartItems) {
      await Book.decrement("stock", {
        by: cartItem.quantity,
        where: { id: cartItem.bookId },
      });
    }

    // Clear user's cart
    await CartItem.destroy({
      where: { userId },
    });

    // Get order with items for email
    const orderWithItems = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Book,
              as: "book",
              attributes: ["title", "price"],
            },
          ],
        },
      ],
    });

    // Send confirmation email
    const user = await User.findByPk(userId);
    if (user.email) {
      await sendOrderEmail(user.email, order, orderWithItems.items);
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: orderWithItems,
    });
  } catch (error) {
    console.error("[ERROR] Create order failed:", error);
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
    const offset = (page - 1) * limit;

    const { count, rows: orders } = await Order.findAndCountAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Book,
              as: "book",
              attributes: ["id", "title", "coverImage"],
            },
          ],
          limit: 3,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      count,
      pagination: {
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: orders,
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

    const order = await Order.findOne({
      where: { id, userId },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Book,
              as: "book",
              attributes: ["id", "title", "author", "price", "coverImage"],
            },
          ],
        },
        {
          model: Payment,
          as: "payment",
          attributes: [
            "id",
            "amount",
            "method",
            "status",
            "transactionId",
            "createdAt",
          ],
        },
      ],
    });

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

    const order = await Order.findOne({
      where: {
        id,
        userId,
        status: { [Op.in]: ["pending", "processing"] },
      },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Book,
              as: "book",
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found or cannot be cancelled",
      });
    }

    // Restore book stock
    for (const item of order.items) {
      await Book.increment("stock", {
        by: item.quantity,
        where: { id: item.bookId },
      });
    }

    // Update order status
    await order.update({
      status: "cancelled",
      cancelledAt: new Date(),
    });

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

    const order = await Order.findOne({
      where: { orderNumber, userId },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Book,
              as: "book",
              attributes: ["id", "title", "author", "price", "coverImage"],
            },
          ],
        },
      ],
    });

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

    const order = await Order.findOne({
      where: {
        id,
        userId,
        status: { [Op.in]: ["pending", "processing"] },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found or cannot be updated",
      });
    }

    await order.update({
      shippingAddress: shippingAddress.trim(),
    });

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

    const order = await Order.findOne({
      where: { id, userId },
      attributes: [
        "id",
        "orderNumber",
        "status",
        "createdAt",
        "shippedAt",
        "deliveredAt",
        "cancelledAt",
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    // Get tracking timeline
    const timeline = [];
    timeline.push({
      status: "Order Placed",
      date: order.createdAt,
      active: true,
    });

    if (
      order.status === "processing" ||
      order.status === "shipped" ||
      order.status === "delivered"
    ) {
      timeline.push({
        status: "Processing",
        date: order.createdAt,
        active: order.status !== "pending",
      });
    }

    if (order.status === "shipped" || order.status === "delivered") {
      timeline.push({
        status: "Shipped",
        date: order.shippedAt || order.createdAt,
        active: order.status === "shipped" || order.status === "delivered",
      });
    }

    if (order.status === "delivered") {
      timeline.push({
        status: "Delivered",
        date: order.deliveredAt,
        active: true,
      });
    }

    if (order.status === "cancelled") {
      timeline.push({
        status: "Cancelled",
        date: order.cancelledAt,
        active: true,
      });
    }

    res.json({
      success: true,
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
        },
        timeline,
      },
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
    const offset = (page - 1) * limit;

    const { status, startDate, endDate } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
        {
          model: OrderItem,
          as: "items",
          attributes: ["id", "quantity", "price"],
          limit: 2,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      count,
      pagination: {
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      filters: { status, startDate, endDate },
      data: orders,
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

    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email", "name"],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    const updateData = { status };

    // Set timestamps for status changes
    if (status === "shipped" && order.status !== "shipped") {
      updateData.shippedAt = new Date();
    } else if (status === "delivered" && order.status !== "delivered") {
      updateData.deliveredAt = new Date();
    } else if (status === "cancelled" && order.status !== "cancelled") {
      updateData.cancelledAt = new Date();

      // Restore stock if cancelling
      if (order.status !== "cancelled") {
        const items = await OrderItem.findAll({
          where: { orderId: order.id },
          include: [
            {
              model: Book,
              as: "book",
            },
          ],
        });

        for (const item of items) {
          await Book.increment("stock", {
            by: item.quantity,
            where: { id: item.bookId },
          });
        }
      }
    }

    await order.update(updateData);

    // Send status update email
    if (order.user.email) {
      await sendStatusUpdateEmail(order.user.email, order, status);
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

// Send status update email
const sendStatusUpdateEmail = async (userEmail, order, newStatus) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Order Update - ${order.orderNumber}`,
      html: `
        <h1>Order Status Update</h1>
        <p>Your order <strong>${
          order.orderNumber
        }</strong> status has been updated.</p>
        <p><strong>New Status:</strong> ${newStatus.toUpperCase()}</p>
        <p><strong>Previous Status:</strong> ${order.status.toUpperCase()}</p>
        <p>Date: ${new Date().toLocaleDateString()}</p>
        <p>You can track your order in your account dashboard.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send status update email:", error);
  }
};

// @desc    Get order statistics (Admin)
// @route   GET /api/orders/admin/statistics
// @access  Private/Admin
exports.getOrderStatistics = async (req, res) => {
  try {
    // Get counts by status
    const statusCounts = await Order.findAll({
      attributes: [
        "status",
        [Order.sequelize.fn("COUNT", Order.sequelize.col("id")), "count"],
      ],
      group: ["status"],
    });

    // Get total revenue
    const revenueResult = await Order.findAll({
      where: { status: "delivered" },
      attributes: [
        [
          Order.sequelize.fn("SUM", Order.sequelize.col("totalAmount")),
          "totalRevenue",
        ],
      ],
    });

    // Get today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = await Order.count({
      where: {
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
    });

    // Get monthly revenue
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const monthlyRevenue = await Order.findAll({
      where: {
        status: "delivered",
        createdAt: {
          [Op.gte]: new Date(currentYear, currentMonth - 1, 1),
          [Op.lt]: new Date(currentYear, currentMonth, 1),
        },
      },
      attributes: [
        [
          Order.sequelize.fn("SUM", Order.sequelize.col("totalAmount")),
          "monthlyRevenue",
        ],
      ],
    });

    const statistics = {
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item.status] = parseInt(item.dataValues.count);
        return acc;
      }, {}),
      totalRevenue: parseFloat(
        revenueResult[0]?.dataValues?.totalRevenue || 0
      ).toFixed(2),
      todayOrders,
      monthlyRevenue: parseFloat(
        monthlyRevenue[0]?.dataValues?.monthlyRevenue || 0
      ).toFixed(2),
      totalOrders: statusCounts.reduce(
        (sum, item) => sum + parseInt(item.dataValues.count),
        0
      ),
    };

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
