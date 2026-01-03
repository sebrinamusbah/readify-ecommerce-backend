const {
    Order,
    OrderItem,
    Book,
    User,
    Payment,
    CartItem
} = require('../models');
const { Op } = require('sequelize');
const emailService = require('./emailService');

class OrderService {
    // Generate order number
    generateOrderNumber() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `ORD-${timestamp}-${random}`;
    }

    // Create new order from cart
    async createOrder(userId, { shippingAddress, notes }) {
        // Get user's cart items
        const cartItems = await CartItem.findAll({
            where: { userId },
            include: [{
                model: Book,
                as: 'book',
                attributes: ['id', 'title', 'price', 'stock']
            }]
        });

        if (cartItems.length === 0) {
            throw new Error('Cart is empty');
        }

        // Validate stock and calculate total
        let totalAmount = 0;
        const orderItemsData = [];

        for (const cartItem of cartItems) {
            // Check stock availability
            if (cartItem.book.stock < cartItem.quantity) {
                throw new Error(
                    `"${cartItem.book.title}" only has ${cartItem.book.stock} items in stock`
                );
            }

            const itemTotal = cartItem.book.price * cartItem.quantity;
            totalAmount += itemTotal;

            orderItemsData.push({
                bookId: cartItem.bookId,
                quantity: cartItem.quantity,
                price: cartItem.book.price,
                itemTotal: itemTotal
            });
        }

        // Create order
        const order = await Order.create({
            userId,
            orderNumber: this.generateOrderNumber(),
            totalAmount,
            shippingAddress,
            notes: notes,
            status: 'pending'
        });

        // Create order items
        const orderItems = await Promise.all(
            orderItemsData.map((itemData) =>
                OrderItem.create({
                    orderId: order.id,
                    ...itemData
                })
            )
        );

        // Update book stock
        for (const cartItem of cartItems) {
            await Book.decrement('stock', {
                by: cartItem.quantity,
                where: { id: cartItem.bookId }
            });
        }

        // Clear user's cart
        await CartItem.destroy({
            where: { userId }
        });

        // Get order with items for email
        const orderWithItems = await Order.findByPk(order.id, {
            include: [{
                model: OrderItem,
                as: 'items',
                include: [{
                    model: Book,
                    as: 'book',
                    attributes: ['title', 'price']
                }]
            }]
        });

        // Send confirmation email
        const user = await User.findByPk(userId);
        if (user.email) {
            await emailService.sendOrderConfirmation(
                user.email,
                orderWithItems,
                orderWithItems.items
            );
        }

        return orderWithItems;
    }

    // Get user's orders
    async getUserOrders(userId, { page = 1, limit = 10 }) {
        const offset = (page - 1) * limit;

        const { count, rows: orders } = await Order.findAndCountAll({
            where: { userId },
            include: [{
                model: OrderItem,
                as: 'items',
                include: [{
                    model: Book,
                    as: 'book',
                    attributes: ['id', 'title', 'coverImage']
                }],
                limit: 3
            }],
            order: [
                ['createdAt', 'DESC']
            ],
            limit,
            offset,
            distinct: true
        });

        const totalPages = Math.ceil(count / limit);

        return {
            count,
            orders,
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }

    // Get single order by ID
    async getOrderById(orderId, userId) {
        const order = await Order.findOne({
            where: { id: orderId, userId },
            include: [{
                    model: OrderItem,
                    as: 'items',
                    include: [{
                        model: Book,
                        as: 'book',
                        attributes: ['id', 'title', 'author', 'price', 'coverImage']
                    }]
                },
                {
                    model: Payment,
                    as: 'payment',
                    attributes: [
                        'id',
                        'amount',
                        'method',
                        'status',
                        'transactionId',
                        'createdAt'
                    ]
                }
            ]
        });

        return order;
    }

    // Cancel order
    async cancelOrder(orderId, userId) {
        const order = await Order.findOne({
            where: {
                id: orderId,
                userId,
                status: {
                    [Op.in]: ['pending', 'processing'] }
            },
            include: [{
                model: OrderItem,
                as: 'items',
                include: [{
                    model: Book,
                    as: 'book'
                }]
            }]
        });

        if (!order) {
            return null;
        }

        // Restore book stock
        for (const item of order.items) {
            await Book.increment('stock', {
                by: item.quantity,
                where: { id: item.bookId }
            });
        }

        // Update order status
        await order.update({
            status: 'cancelled',
            cancelledAt: new Date()
        });

        return order;
    }

    // Get order by order number
    async getOrderByNumber(orderNumber, userId) {
        const order = await Order.findOne({
            where: { orderNumber, userId },
            include: [{
                model: OrderItem,
                as: 'items',
                include: [{
                    model: Book,
                    as: 'book',
                    attributes: ['id', 'title', 'author', 'price', 'coverImage']
                }]
            }]
        });

        return order;
    }

    // Update shipping address
    async updateShippingAddress(orderId, userId, shippingAddress) {
        const order = await Order.findOne({
            where: {
                id: orderId,
                userId,
                status: {
                    [Op.in]: ['pending', 'processing'] }
            }
        });

        if (!order) {
            return null;
        }

        await order.update({
            shippingAddress: shippingAddress
        });

        return order;
    }

    // Track order status
    async trackOrder(orderId, userId) {
        const order = await Order.findOne({
            where: { id: orderId, userId },
            attributes: [
                'id',
                'orderNumber',
                'status',
                'createdAt',
                'shippedAt',
                'deliveredAt',
                'cancelledAt'
            ]
        });

        if (!order) {
            return null;
        }

        // Get tracking timeline
        const timeline = [];
        timeline.push({
            status: 'Order Placed',
            date: order.createdAt,
            active: true
        });

        if (
            order.status === 'processing' ||
            order.status === 'shipped' ||
            order.status === 'delivered'
        ) {
            timeline.push({
                status: 'Processing',
                date: order.createdAt,
                active: order.status !== 'pending'
            });
        }

        if (order.status === 'shipped' || order.status === 'delivered') {
            timeline.push({
                status: 'Shipped',
                date: order.shippedAt || order.createdAt,
                active: order.status === 'shipped' || order.status === 'delivered'
            });
        }

        if (order.status === 'delivered') {
            timeline.push({
                status: 'Delivered',
                date: order.deliveredAt,
                active: true
            });
        }

        if (order.status === 'cancelled') {
            timeline.push({
                status: 'Cancelled',
                date: order.cancelledAt,
                active: true
            });
        }

        return {
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                status: order.status
            },
            timeline
        };
    }

    // ==================== ADMIN FUNCTIONS ====================

    // Get all orders (Admin)
    async getAllOrders({ page = 1, limit = 20, status, startDate, endDate }) {
        const offset = (page - 1) * limit;

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
            include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    attributes: ['id', 'quantity', 'price'],
                    limit: 2
                }
            ],
            order: [
                ['createdAt', 'DESC']
            ],
            limit,
            offset,
            distinct: true
        });

        const totalPages = Math.ceil(count / limit);

        return {
            count,
            orders,
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            filters: { status, startDate, endDate }
        };
    }

    // Update order status (Admin)
    async updateOrderStatus(orderId, newStatus) {
        const order = await Order.findByPk(orderId, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['email', 'name']
            }]
        });

        if (!order) {
            return null;
        }

        const updateData = { status: newStatus };

        // Set timestamps for status changes
        if (newStatus === 'shipped' && order.status !== 'shipped') {
            updateData.shippedAt = new Date();
        } else if (newStatus === 'delivered' && order.status !== 'delivered') {
            updateData.deliveredAt = new Date();
        } else if (newStatus === 'cancelled' && order.status !== 'cancelled') {
            updateData.cancelledAt = new Date();

            // Restore stock if cancelling
            if (order.status !== 'cancelled') {
                const items = await OrderItem.findAll({
                    where: { orderId: order.id },
                    include: [{
                        model: Book,
                        as: 'book'
                    }]
                });

                for (const item of items) {
                    await Book.increment('stock', {
                        by: item.quantity,
                        where: { id: item.bookId }
                    });
                }
            }
        }

        await order.update(updateData);

        // Send status update email
        if (order.user.email) {
            await emailService.sendOrderStatusUpdate(
                order.user.email,
                order,
                newStatus
            );
        }

        return order;
    }

    // Get order statistics (Admin)
    async getOrderStatistics() {
        // Get counts by status
        const statusCounts = await Order.findAll({
            attributes: [
                'status', [Order.sequelize.fn('COUNT', Order.sequelize.col('id')), 'count']
            ],
            group: ['status']
        });

        // Get total revenue
        const revenueResult = await Order.findAll({
            where: { status: 'delivered' },
            attributes: [
                [
                    Order.sequelize.fn('SUM', Order.sequelize.col('totalAmount')),
                    'totalRevenue'
                ]
            ]
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
                    [Op.lt]: tomorrow
                }
            }
        });

        // Get monthly revenue
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const monthlyRevenue = await Order.findAll({
            where: {
                status: 'delivered',
                createdAt: {
                    [Op.gte]: new Date(currentYear, currentMonth - 1, 1),
                    [Op.lt]: new Date(currentYear, currentMonth, 1)
                }
            },
            attributes: [
                [
                    Order.sequelize.fn('SUM', Order.sequelize.col('totalAmount')),
                    'monthlyRevenue'
                ]
            ]
        });

        const statistics = {
            statusCounts: statusCounts.reduce((acc, item) => {
                acc[item.status] = parseInt(item.dataValues.count);
                return acc;
            }, {}),
            totalRevenue: parseFloat(
                revenueResult[0] ?.dataValues ?.totalRevenue || 0
            ).toFixed(2),
            todayOrders,
            monthlyRevenue: parseFloat(
                monthlyRevenue[0] ?.dataValues ?.monthlyRevenue || 0
            ).toFixed(2),
            totalOrders: statusCounts.reduce(
                (sum, item) => sum + parseInt(item.dataValues.count),
                0
            )
        };

        return statistics;
    }

    // Helper: Validate order belongs to user
    async validateOrderOwnership(orderId, userId) {
        const order = await Order.findOne({
            where: { id: orderId, userId }
        });
        return !!order;
    }
}

module.exports = new OrderService();