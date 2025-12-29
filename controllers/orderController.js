const { Order, OrderItem, Book, User } = require("../models");
const { CartItem } = require("../models");
const formatResponse = require("../utils/formatResponse");

// @desc    Create new order from cart
// @route   POST /api/orders
// @access  Private
const createOrder = async(req, res) => {
    try {
        const { shippingAddress, paymentMethod, notes } = req.body;

        // Get user's cart items
        const cartItems = await CartItem.findAll({
            where: { userId: req.user.id },
            include: [Book],
        });

        if (cartItems.length === 0) {
            return res.status(400).json(formatResponse(false, null, "Cart is empty"));
        }

        // Calculate total and check stock
        let totalAmount = 0;
        const orderItems = [];

        for (const cartItem of cartItems) {
            if (cartItem.Book.stock < cartItem.quantity) {
                return res
                    .status(400)
                    .json(
                        formatResponse(
                            false,
                            null,
                            `Insufficient stock for: ${cartItem.Book.title}`
                        )
                    );
            }

            const itemTotal = cartItem.Book.price * cartItem.quantity;
            totalAmount += itemTotal;

            orderItems.push({
                bookId: cartItem.bookId,
                quantity: cartItem.quantity,
                price: cartItem.Book.price,
            });
        }

        // Create order
        const order = await Order.create({
            userId: req.user.id,
            totalAmount,
            shippingAddress,
            paymentMethod,
            notes,
            status: "pending",
            paymentStatus: "pending",
        });

        // Create order items
        for (const item of orderItems) {
            await OrderItem.create({
                orderId: order.id,
                bookId: item.bookId,
                quantity: item.quantity,
                price: item.price,
            });

            // Update book stock
            const book = await Book.findByPk(item.bookId);
            book.stock -= item.quantity;
            await book.save();
        }

        // Clear cart
        await CartItem.destroy({
            where: { userId: req.user.id },
        });

        res
            .status(201)
            .json(formatResponse(true, order, "Order created successfully"));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(false, null, "Server error"));
    }
};

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
const getMyOrders = async(req, res) => {
    try {
        const orders = await Order.findAll({
            where: { userId: req.user.id },
            include: [{
                model: OrderItem,
                include: [Book],
            }, ],
            order: [
                ["createdAt", "DESC"]
            ],
        });

        res.json(formatResponse(true, orders, "Orders retrieved successfully"));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(false, null, "Server error"));
    }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async(req, res) => {
    try {
        const order = await Order.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id,
            },
            include: [{
                model: OrderItem,
                include: [Book],
            }, ],
        });

        if (!order) {
            return res
                .status(404)
                .json(formatResponse(false, null, "Order not found"));
        }

        res.json(formatResponse(true, order, "Order retrieved successfully"));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(false, null, "Server error"));
    }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async(req, res) => {
    try {
        const { status } = req.body;

        const order = await Order.findByPk(req.params.id);

        if (!order) {
            return res
                .status(404)
                .json(formatResponse(false, null, "Order not found"));
        }

        order.status = status;
        await order.save();

        res.json(formatResponse(true, order, "Order status updated successfully"));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(false, null, "Server error"));
    }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders/all
// @access  Private/Admin
const getAllOrders = async(req, res) => {
    try {
        const orders = await Order.findAll({
            include: [{
                    model: User,
                    attributes: ["id", "name", "email"],
                },
                {
                    model: OrderItem,
                    include: [Book],
                },
            ],
            order: [
                ["createdAt", "DESC"]
            ],
        });

        res.json(formatResponse(true, orders, "All orders retrieved successfully"));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(false, null, "Server error"));
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    getAllOrders,
};