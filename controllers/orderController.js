const {
  Order,
  OrderItem,
  Book,
  User,
  Payment,
  CartItem,
  sequelize,
} = require("../models");

const { Op } = require("sequelize");
const nodemailer = require("nodemailer");

// =========================
// EMAIL SETUP
// =========================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// =========================
// HELPERS
// =========================
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// =========================
// EMAIL: ORDER CONFIRMATION
// =========================
const sendOrderEmail = async (userEmail, order, orderItems) => {
  try {
    if (!userEmail) return;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Order Confirmation - ${order.orderNumber}`,
      html: `
        <h2>Thank you for your order!</h2>
        <p><strong>Order:</strong> ${order.orderNumber}</p>
        <p><strong>Total:</strong> $${Number(order.totalAmount).toFixed(2)}</p>

        <h3>Items:</h3>
        <ul>
          ${orderItems
            .map(
              (i) => `
            <li>${i.book.title} - ${i.quantity} x $${i.price}</li>
          `,
            )
            .join("")}
        </ul>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Email error:", err.message);
  }
};

// =========================
// CREATE ORDER (SAFE VERSION)
// =========================
exports.createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { shippingAddress, notes } = req.body;

    if (!shippingAddress || shippingAddress.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: "Valid shipping address required",
      });
    }

    const cartItems = await CartItem.findAll({
      where: { userId },
      include: [{ model: Book, as: "book" }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!cartItems.length) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: "Cart is empty",
      });
    }

    let totalAmount = 0;

    for (const item of cartItems) {
      if (!item.book || item.book.stock < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${item.book?.title}`,
        });
      }

      totalAmount += item.book.price * item.quantity;
    }

    const order = await Order.create(
      {
        userId,
        orderNumber: generateOrderNumber(),
        totalAmount,
        shippingAddress: shippingAddress.trim(),
        notes: notes?.trim() || null,
        status: "pending",
      },
      { transaction },
    );

    const orderItems = [];

    for (const item of cartItems) {
      await Book.decrement(
        { stock: item.quantity },
        { where: { id: item.bookId }, transaction },
      );

      const orderItem = await OrderItem.create(
        {
          orderId: order.id,
          bookId: item.bookId,
          quantity: item.quantity,
          price: item.book.price,
          itemTotal: item.book.price * item.quantity,
        },
        { transaction },
      );

      orderItems.push(orderItem);
    }

    await CartItem.destroy({ where: { userId }, transaction });

    await transaction.commit();

    const fullOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Book, as: "book" }],
        },
      ],
    });

    const user = await User.findByPk(userId);

    await sendOrderEmail(user?.email, fullOrder, fullOrder.items);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: fullOrder,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("[CREATE ORDER ERROR]", error);

    res.status(500).json({
      success: false,
      error: "Failed to create order",
    });
  }
};

// =========================
// GET USER ORDERS
// =========================
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.findAll({
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

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to fetch orders" });
  }
};

// =========================
// GET ORDER BY ID
// =========================
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [{ model: Book, as: "book" }],
        },
        { model: Payment, as: "payment" },
      ],
    });

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to fetch order" });
  }
};

// =========================
// CANCEL ORDER
// =========================
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id,
        status: { [Op.in]: ["pending", "processing"] },
      },
      include: [{ model: OrderItem, as: "items" }],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found or cannot cancel",
      });
    }

    for (const item of order.items) {
      await Book.increment("stock", {
        by: item.quantity,
        where: { id: item.bookId },
      });
    }

    await order.update({ status: "cancelled" });

    res.json({ success: true, message: "Order cancelled" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Cancel failed" });
  }
};
