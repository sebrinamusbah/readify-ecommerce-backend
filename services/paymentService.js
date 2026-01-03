const { Payment, Order, User } = require('../models');
const { Op } = require('sequelize');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
    // Generate payment reference
    generatePaymentRef() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `PAY-${timestamp}-${random}`;
    }

    // Create payment intent (Stripe)
    async createPaymentIntent(orderId, userId) {
        // Get order
        const order = await Order.findOne({
            where: {
                id: orderId,
                userId,
                status: {
                    [Op.not]: 'cancelled' }
            }
        });

        if (!order) {
            throw new Error('Order not found or cancelled');
        }

        // Check if order already has a completed payment
        const existingPayment = await Payment.findOne({
            where: {
                orderId,
                status: 'completed'
            }
        });

        if (existingPayment) {
            throw new Error('Order already has a completed payment');
        }

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(order.totalAmount * 100), // Convert to cents
            currency: 'usd',
            metadata: {
                orderId: order.id,
                userId: userId.toString(),
                orderNumber: order.orderNumber
            },
            description: `Payment for order ${order.orderNumber}`,
            automatic_payment_methods: {
                enabled: true
            }
        });

        // Create payment record
        const payment = await Payment.create({
            orderId,
            userId,
            paymentMethod: 'credit_card', // Stripe maps to credit_card
            amount: order.totalAmount,
            transactionId: paymentIntent.id,
            status: 'pending',
            paymentDate: null // Will be set when completed
        });

        return {
            clientSecret: paymentIntent.client_secret,
            paymentId: payment.id,
            amount: order.totalAmount,
            currency: 'usd',
            order: {
                id: order.id,
                orderNumber: order.orderNumber,
                totalAmount: order.totalAmount
            }
        };
    }

    // Handle Stripe webhook
    async handleStripeWebhook(req) {
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            throw new Error(`Webhook Error: ${err.message}`);
        }

        try {
            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.handlePaymentIntentSucceeded(event.data.object);
                    break;

                case 'payment_intent.payment_failed':
                    await this.handlePaymentIntentFailed(event.data.object);
                    break;

                case 'charge.succeeded':
                    await this.handleChargeSucceeded(event.data.object);
                    break;

                case 'charge.refunded':
                    await this.handleChargeRefunded(event.data.object);
                    break;

                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }
        } catch (error) {
            console.error('Webhook processing error:', error);
            throw error;
        }
    }

    // Webhook handlers
    async handlePaymentIntentSucceeded(paymentIntent) {
        try {
            const { orderId } = paymentIntent.metadata;
            const charge = paymentIntent.charges ?.data[0];

            // Find payment by Stripe transaction ID
            const payment = await Payment.findOne({
                where: { transactionId: paymentIntent.id }
            });

            if (payment) {
                // Get last 4 digits of card if available
                let cardLastFour = null;
                let receiptUrl = null;

                if (charge && charge.payment_method_details ?.card) {
                    cardLastFour = charge.payment_method_details.card.last4;
                }

                if (charge && charge.receipt_url) {
                    receiptUrl = charge.receipt_url;
                }

                await payment.update({
                    status: 'completed',
                    paymentDate: new Date(),
                    cardLastFour: cardLastFour,
                    receiptUrl: receiptUrl
                });

                // Update order status
                await Order.update({ status: 'processing' }, { where: { id: orderId } });

                console.log(`Payment ${payment.id} completed for order ${orderId}`);
            }
        } catch (error) {
            console.error('Error handling payment intent succeeded:', error);
            throw error;
        }
    }

    async handlePaymentIntentFailed(paymentIntent) {
        try {
            const payment = await Payment.findOne({
                where: { transactionId: paymentIntent.id }
            });

            if (payment) {
                await payment.update({
                    status: 'failed'
                });
            }
        } catch (error) {
            console.error('Error handling payment intent failed:', error);
            throw error;
        }
    }

    async handleChargeRefunded(charge) {
        try {
            const payment = await Payment.findOne({
                where: {
                    transactionId: charge.payment_intent,
                    status: 'completed'
                }
            });

            if (payment) {
                await payment.update({
                    status: 'refunded'
                });

                // Update order status if fully refunded
                if (charge.refunded) {
                    await Order.update({ status: 'refunded' }, { where: { id: payment.orderId } });
                }
            }
        } catch (error) {
            console.error('Error handling charge refunded:', error);
            throw error;
        }
    }

    // Create cash on delivery payment
    async createCashOnDelivery(orderId, userId) {
        // Get order
        const order = await Order.findOne({
            where: {
                id: orderId,
                userId,
                status: {
                    [Op.not]: 'cancelled' }
            }
        });

        if (!order) {
            throw new Error('Order not found or cancelled');
        }

        // Check if order already has a payment
        const existingPayment = await Payment.findOne({
            where: {
                orderId,
                status: {
                    [Op.in]: ['pending', 'completed'] }
            }
        });

        if (existingPayment) {
            throw new Error('Order already has a payment');
        }

        // Create cash on delivery payment
        const payment = await Payment.create({
            orderId,
            userId,
            paymentMethod: 'cash_on_delivery',
            amount: order.totalAmount,
            status: 'pending',
            paymentDate: null
        });

        // Update order status
        await order.update({ status: 'processing' });

        return payment;
    }

    // Create PayPal payment
    async createPayPalPayment(orderId, userId, transactionId) {
        // Get order
        const order = await Order.findOne({
            where: {
                id: orderId,
                userId,
                status: {
                    [Op.not]: 'cancelled' }
            }
        });

        if (!order) {
            throw new Error('Order not found or cancelled');
        }

        // Check if order already has a completed payment
        const existingPayment = await Payment.findOne({
            where: {
                orderId,
                status: 'completed'
            }
        });

        if (existingPayment) {
            throw new Error('Order already has a completed payment');
        }

        // Create PayPal payment record
        const payment = await Payment.create({
            orderId,
            userId,
            paymentMethod: 'paypal',
            amount: order.totalAmount,
            transactionId: transactionId,
            status: 'completed',
            paymentDate: new Date()
        });

        // Update order status
        await order.update({ status: 'processing' });

        return payment;
    }

    // Get payment by ID
    async getPaymentById(paymentId, userId) {
        const payment = await Payment.findOne({
            where: { id: paymentId, userId },
            include: [{
                model: Order,
                as: 'order',
                attributes: ['id', 'orderNumber', 'totalAmount', 'status']
            }]
        });

        return payment;
    }

    // Get payments for an order
    async getPaymentsByOrder(orderId, userId) {
        const payments = await Payment.findAll({
            where: { orderId, userId },
            order: [
                ['createdAt', 'DESC']
            ]
        });

        return payments;
    }

    // Get user's payment history
    async getPaymentHistory(userId, { page = 1, limit = 10 }) {
        const offset = (page - 1) * limit;

        const { count, rows: payments } = await Payment.findAndCountAll({
            where: { userId },
            include: [{
                model: Order,
                as: 'order',
                attributes: ['id', 'orderNumber', 'status']
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
            payments,
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }

    // Refund payment
    async refundPayment(paymentId, reason) {
        const payment = await Payment.findByPk(paymentId, {
            include: [{
                model: Order,
                as: 'order'
            }]
        });

        if (!payment) {
            return null;
        }

        if (payment.status !== 'completed') {
            throw new Error('Only completed payments can be refunded');
        }

        if (payment.paymentMethod === 'credit_card') {
            // Process Stripe refund
            const refund = await stripe.refunds.create({
                payment_intent: payment.transactionId,
                reason: reason || 'requested_by_customer'
            });

            await payment.update({
                status: 'refunded'
            });

            // Update order status
            await payment.order.update({ status: 'refunded' });
        } else {
            // Manual refund for non-credit_card payments
            await payment.update({
                status: 'refunded'
            });

            await payment.order.update({ status: 'refunded' });
        }

        return payment;
    }

    // ==================== ADMIN FUNCTIONS ====================

    // Update payment status (Admin)
    async updatePaymentStatus(paymentId, newStatus) {
        const payment = await Payment.findByPk(paymentId, {
            include: [{
                model: Order,
                as: 'order'
            }]
        });

        if (!payment) {
            return null;
        }

        // Special handling for completing payments
        if (newStatus === 'completed' && payment.status !== 'completed') {
            await payment.update({
                status: 'completed',
                paymentDate: new Date()
            });

            // Update order status
            await payment.order.update({ status: 'processing' });
        } else if (newStatus === 'refunded') {
            await payment.update({
                status: 'refunded'
            });

            // Update order status
            await payment.order.update({ status: 'refunded' });
        } else {
            await payment.update({ status: newStatus });
        }

        return payment;
    }

    // Get all payments (Admin)
    async getAllPayments({
        page = 1,
        limit = 20,
        status,
        paymentMethod,
        startDate,
        endDate
    }) {
        const offset = (page - 1) * limit;

        const where = {};

        if (status) where.status = status;
        if (paymentMethod) where.paymentMethod = paymentMethod;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }

        const { count, rows: payments } = await Payment.findAndCountAll({
            where,
            include: [{
                    model: Order,
                    as: 'order',
                    attributes: ['id', 'orderNumber', 'totalAmount']
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
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

        // Calculate totals
        const completedPayments = payments.filter(p => p.status === 'completed');
        const totalRevenue = completedPayments.reduce(
            (sum, payment) => sum + parseFloat(payment.amount),
            0
        );

        // Calculate by payment method
        const revenueByMethod = {};
        completedPayments.forEach(payment => {
            const method = payment.paymentMethod;
            revenueByMethod[method] =
                (revenueByMethod[method] || 0) + parseFloat(payment.amount);
        });

        return {
            count,
            payments,
            totals: {
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                completedCount: completedPayments.length,
                revenueByMethod
            },
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            filters: { status, paymentMethod, startDate, endDate }
        };
    }

    // Get payment statistics (Admin)
    async getPaymentStatistics() {
        // Get counts by status
        const statusCounts = await Payment.findAll({
            attributes: [
                'status', [Payment.sequelize.fn('COUNT', Payment.sequelize.col('id')), 'count']
            ],
            group: ['status']
        });

        // Get counts by payment method
        const methodCounts = await Payment.findAll({
            attributes: [
                'paymentMethod', [Payment.sequelize.fn('COUNT', Payment.sequelize.col('id')), 'count']
            ],
            group: ['paymentMethod']
        });

        // Get today's revenue
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayRevenue = await Payment.findAll({
            where: {
                status: 'completed',
                createdAt: {
                    [Op.gte]: today,
                    [Op.lt]: tomorrow
                }
            },
            attributes: [
                [Payment.sequelize.fn('SUM', Payment.sequelize.col('amount')), 'total']
            ]
        });

        // Get monthly revenue
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const monthlyRevenue = await Payment.findAll({
            where: {
                status: 'completed',
                createdAt: {
                    [Op.gte]: new Date(currentYear, currentMonth - 1, 1),
                    [Op.lt]: new Date(currentYear, currentMonth, 1)
                }
            },
            attributes: [
                [Payment.sequelize.fn('SUM', Payment.sequelize.col('amount')), 'total']
            ]
        });

        const statistics = {
            statusCounts: statusCounts.reduce((acc, item) => {
                acc[item.status] = parseInt(item.dataValues.count);
                return acc;
            }, {}),
            methodCounts: methodCounts.reduce((acc, item) => {
                acc[item.paymentMethod] = parseInt(item.dataValues.count);
                return acc;
            }, {}),
            todayRevenue: parseFloat(todayRevenue[0] ?.dataValues ?.total || 0).toFixed(
                2
            ),
            monthlyRevenue: parseFloat(
                monthlyRevenue[0] ?.dataValues ?.total || 0
            ).toFixed(2),
            totalPayments: statusCounts.reduce(
                (sum, item) => sum + parseInt(item.dataValues.count),
                0
            )
        };

        return statistics;
    }

    // Helper: Validate payment belongs to user
    async validatePaymentOwnership(paymentId, userId) {
        const payment = await Payment.findOne({
            where: { id: paymentId, userId }
        });
        return !!payment;
    }
}

module.exports = new PaymentService();