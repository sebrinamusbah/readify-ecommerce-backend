const { Payment, Order, User } = require("../models");
const { Op } = require("sequelize");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY ");
        const nodemailer = require("nodemailer");

        // ===================== EMAIL SETUP =====================
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        // ===================== HELPERS =====================
        const generatePaymentRef = () => {
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 10000);
            return `PAY-${timestamp}-${random}`;
        };

        // ===================== STRIPE PAYMENT INTENT =====================
        exports.createPaymentIntent = async(req, res) => {
            try {
                const userId = req.user.id;
                const { orderId } = req.body;

                if (!orderId) {
                    return res.status(400).json({ success: false, error: "Order ID is required" });
                }

                const order = await Order.findOne({
                    where: {
                        id: orderId,
                        userId,
                        status: {
                            [Op.ne]: "cancelled"
                        },
                    },
                });

                if (!order) {
                    return res.status(404).json({ success: false, error: "Order not found or cancelled" });
                }

                const existingPayment = await Payment.findOne({
                    where: { orderId, status: "completed" },
                });

                if (existingPayment) {
                    return res.status(400).json({
                        success: false,
                        error: "Order already paid",
                    });
                }

                const paymentIntent = await stripe.paymentIntents.create({
                    amount: Math.round(order.totalAmount * 100),
                    currency: "usd",
                    metadata: {
                        orderId: order.id,
                        userId: String(userId),
                        orderNumber: order.orderNumber,
                    },
                    description: `Payment for order ${order.orderNumber}`,
                    automatic_payment_methods: { enabled: true },
                });

                const payment = await Payment.create({
                    orderId,
                    userId,
                    paymentMethod: "credit_card",
                    amount: order.totalAmount,
                    transactionId: paymentIntent.id,
                    status: "pending",
                    paymentDate: null,
                });

                res.json({
                    success: true,
                    data: {
                        clientSecret: paymentIntent.client_secret,
                        paymentId: payment.id,
                        amount: order.totalAmount,
                        currency: "usd",
                    },
                });
            } catch (error) {
                console.error("[PAYMENT INTENT ERROR]", error);
                res.status(500).json({ success: false, error: "Payment intent failed" });
            }
        };

        // ===================== STRIPE WEBHOOK =====================
        exports.handleStripeWebhook = async(req, res) => {
            const sig = req.headers["stripe-signature"];
            let event;

            try {
                event = stripe.webhooks.constructEvent(
                    req.body,
                    sig,
                    process.env.STRIPE_WEBHOOK_SECRET
                );
            } catch (err) {
                return res.status(400).send(`Webhook Error: ${err.message}`);
            }

            try {
                if (event.type === "payment_intent.succeeded") {
                    await handleSuccess(event.data.object);
                }

                if (event.type === "payment_intent.payment_failed") {
                    await handleFailed(event.data.object);
                }

                res.json({ received: true });
            } catch (error) {
                console.error("[WEBHOOK ERROR]", error);
                res.status(500).json({ error: "Webhook failed" });
            }
        };

        // ===================== WEBHOOK HELPERS =====================
        const handleSuccess = async(paymentIntent) => {
            const payment = await Payment.findOne({
                where: { transactionId: paymentIntent.id },
            });

            if (!payment) return;

            await payment.update({
                status: "completed",
                paymentDate: new Date(),
            });

            await Order.update({ status: "processing" }, { where: { id: payment.orderId } });
        };

        const handleFailed = async(paymentIntent) => {
            await Payment.update({ status: "failed" }, { where: { transactionId: paymentIntent.id } });
        };

        // ===================== CASH ON DELIVERY =====================
        exports.createCashOnDelivery = async(req, res) => {
            try {
                const userId = req.user.id;
                const { orderId } = req.body;

                const order = await Order.findOne({
                    where: {
                        id: orderId,
                        userId,
                        status: {
                            [Op.ne]: "cancelled"
                        },
                    },
                });

                if (!order) {
                    return res.status(404).json({ success: false, error: "Order not found" });
                }

                const existing = await Payment.findOne({
                    where: { orderId },
                });

                if (existing) {
                    return res.status(400).json({ success: false, error: "Payment exists" });
                }

                const payment = await Payment.create({
                    orderId,
                    userId,
                    paymentMethod: "cash_on_delivery",
                    amount: order.totalAmount,
                    status: "pending",
                });

                await order.update({ status: "processing" });

                res.status(201).json({
                    success: true,
                    message: "COD created",
                    data: payment,
                });
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, error: "COD failed" });
            }
        };

        // ===================== PAYPAL =====================
        exports.createPayPalPayment = async(req, res) => {
            try {
                const userId = req.user.id;
                const { orderId, transactionId } = req.body;

                const order = await Order.findOne({
                    where: { id: orderId, userId },
                });

                if (!order) {
                    return res.status(404).json({ success: false, error: "Order not found" });
                }

                const payment = await Payment.create({
                    orderId,
                    userId,
                    paymentMethod: "paypal",
                    amount: order.totalAmount,
                    transactionId,
                    status: "completed",
                    paymentDate: new Date(),
                });

                await order.update({ status: "processing" });

                res.status(201).json({
                    success: true,
                    message: "PayPal payment recorded",
                    data: payment,
                });
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, error: "PayPal failed" });
            }
        };

        // ===================== PAYMENT HISTORY =====================
        exports.getPaymentHistory = async(req, res) => {
            try {
                const userId = req.user.id;

                const payments = await Payment.findAll({
                    where: { userId },
                    order: [
                        ["createdAt", "DESC"]
                    ],
                    include: [{ model: Order, as: "order" }],
                });

                res.json({
                    success: true,
                    data: payments,
                });
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, error: "History failed" });
            }
        };

        // ===================== REFUND =====================
        exports.refundPayment = async(req, res) => {
            try {
                const { id } = req.params;

                const payment = await Payment.findByPk(id, {
                    include: [{ model: Order, as: "order" }],
                });

                if (!payment) {
                    return res.status(404).json({ success: false, error: "Payment not found" });
                }

                if (payment.status !== "completed") {
                    return res.status(400).json({ success: false, error: "Not refundable" });
                }

                if (payment.paymentMethod === "credit_card") {
                    await stripe.refunds.create({
                        payment_intent: payment.transactionId,
                    });
                }

                await payment.update({ status: "refunded" });
                await payment.order.update({ status: "refunded" });

                res.json({
                    success: true,
                    message: "Refund successful",
                });
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, error: "Refund failed" });
            }
        };

        // ===================== ADMIN STATISTICS =====================
        exports.getPaymentStatistics = async(req, res) => {
            try {
                const statusCounts = await Payment.findAll({
                    attributes: [
                        "status", [Payment.sequelize.fn("COUNT", Payment.sequelize.col("id")), "count"],
                    ],
                    group: ["status"],
                });

                const methodCounts = await Payment.findAll({
                    attributes: [
                        "paymentMethod", [Payment.sequelize.fn("COUNT", Payment.sequelize.col("id")), "count"],
                    ],
                    group: ["paymentMethod"],
                });

                const completed = await Payment.findAll({
                    where: { status: "completed" },
                    attributes: [
                        [Payment.sequelize.fn("SUM", Payment.sequelize.col("amount")), "total"],
                    ],
                });

                res.json({
                    success: true,
                    data: {
                        statusCounts,
                        methodCounts,
                        totalRevenue: completed[0] ? .dataValues ? .total || 0,
                    },
                });
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, error: "Stats failed" });
            }
        };