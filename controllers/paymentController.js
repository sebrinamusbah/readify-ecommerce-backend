 // controllers/paymentController.js - UPDATED FOR YOUR MODEL
 const { Payment, Order, User } = require('../models');
 const { Op } = require('sequelize');
 const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

 // Generate payment reference
 const generatePaymentRef = () => {
     const timestamp = Date.now();
     const random = Math.floor(Math.random() * 10000);
     return `PAY-${timestamp}-${random}`;
 };

 // @desc    Create payment intent (Stripe)
 // @route   POST /api/payments/create-intent
 // @access  Private
 exports.createPaymentIntent = async(req, res) => {
     try {
         const userId = req.user.id;
         const { orderId } = req.body;

         if (!orderId) {
             return res.status(400).json({
                 success: false,
                 error: 'Order ID is required'
             });
         }

         // Get order
         const order = await Order.findOne({
             where: {
                 id: orderId,
                 userId,
                 status: {
                     [Op.not]: 'cancelled'
                 }
             }
         });

         if (!order) {
             return res.status(404).json({
                 success: false,
                 error: 'Order not found or cancelled'
             });
         }

         // Check if order already has a completed payment
         const existingPayment = await Payment.findOne({
             where: {
                 orderId,
                 status: 'completed'
             }
         });

         if (existingPayment) {
             return res.status(400).json({
                 success: false,
                 error: 'Order already has a completed payment'
             });
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
                 enabled: true,
             },
         });

         // Create payment record according to YOUR model
         const payment = await Payment.create({
             orderId,
             userId,
             paymentMethod: 'credit_card', // Stripe maps to credit_card
             amount: order.totalAmount,
             transactionId: paymentIntent.id,
             status: 'pending',
             paymentDate: null // Will be set when completed
         });

         res.json({
             success: true,
             data: {
                 clientSecret: paymentIntent.client_secret,
                 paymentId: payment.id,
                 amount: order.totalAmount,
                 currency: 'usd',
                 order: {
                     id: order.id,
                     orderNumber: order.orderNumber,
                     totalAmount: order.totalAmount
                 }
             }
         });

     } catch (error) {
         console.error('[ERROR] Create payment intent failed:', error);
         res.status(500).json({
             success: false,
             error: 'Failed to create payment intent'
         });
     }
 };

 // @desc    Handle Stripe webhook
 // @route   POST /api/payments/webhook
 // @access  Public (Stripe calls this)
 exports.handleStripeWebhook = async(req, res) => {
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
         return res.status(400).send(`Webhook Error: ${err.message}`);
     }

     try {
         switch (event.type) {
             case 'payment_intent.succeeded':
                 await handlePaymentIntentSucceeded(event.data.object);
                 break;

             case 'payment_intent.payment_failed':
                 await handlePaymentIntentFailed(event.data.object);
                 break;

             case 'charge.succeeded':
                 await handleChargeSucceeded(event.data.object);
                 break;

             case 'charge.refunded':
                 await handleChargeRefunded(event.data.object);
                 break;

             default:
                 console.log(`Unhandled event type: ${event.type}`);
         }

         res.json({ received: true });
     } catch (error) {
         console.error('Webhook processing error:', error);
         res.status(500).json({ error: 'Webhook handler failed' });
     }
 };

 // Webhook handlers - UPDATED FOR YOUR MODEL
 const handlePaymentIntentSucceeded = async(paymentIntent) => {
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
     }
 };

 const handlePaymentIntentFailed = async(paymentIntent) => {
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
     }
 };

 const handleChargeRefunded = async(charge) => {
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
     }
 };

 // @desc    Create cash on delivery payment
 // @route   POST /api/payments/cod
 // @access  Private
 exports.createCashOnDelivery = async(req, res) => {
     try {
         const userId = req.user.id;
         const { orderId } = req.body;

         if (!orderId) {
             return res.status(400).json({
                 success: false,
                 error: 'Order ID is required'
             });
         }

         // Get order
         const order = await Order.findOne({
             where: {
                 id: orderId,
                 userId,
                 status: {
                     [Op.not]: 'cancelled'
                 }
             }
         });

         if (!order) {
             return res.status(404).json({
                 success: false,
                 error: 'Order not found or cancelled'
             });
         }

         // Check if order already has a payment
         const existingPayment = await Payment.findOne({
             where: {
                 orderId,
                 status: {
                     [Op.in]: ['pending', 'completed']
                 }
             }
         });

         if (existingPayment) {
             return res.status(400).json({
                 success: false,
                 error: 'Order already has a payment'
             });
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

         res.status(201).json({
             success: true,
             message: 'Cash on delivery payment recorded',
             data: payment
         });

     } catch (error) {
         console.error('[ERROR] Create COD payment failed:', error);
         res.status(500).json({
             success: false,
             error: 'Failed to create COD payment'
         });
     }
 };

 // @desc    Create PayPal payment
 // @route   POST /api/payments/paypal
 // @access  Private
 exports.createPayPalPayment = async(req, res) => {
     try {
         const userId = req.user.id;
         const { orderId, transactionId } = req.body;

         if (!orderId || !transactionId) {
             return res.status(400).json({
                 success: false,
                 error: 'Order ID and PayPal transaction ID are required'
             });
         }

         // Get order
         const order = await Order.findOne({
             where: {
                 id: orderId,
                 userId,
                 status: {
                     [Op.not]: 'cancelled'
                 }
             }
         });

         if (!order) {
             return res.status(404).json({
                 success: false,
                 error: 'Order not found or cancelled'
             });
         }

         // Check if order already has a completed payment
         const existingPayment = await Payment.findOne({
             where: {
                 orderId,
                 status: 'completed'
             }
         });

         if (existingPayment) {
             return res.status(400).json({
                 success: false,
                 error: 'Order already has a completed payment'
             });
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

         res.status(201).json({
             success: true,
             message: 'PayPal payment recorded',
             data: payment
         });

     } catch (error) {
         console.error('[ERROR] Create PayPal payment failed:', error);
         res.status(500).json({
             success: false,
             error: 'Failed to create PayPal payment'
         });
     }
 };

 // @desc    Get payment by ID
 // @route   GET /api/payments/:id
 // @access  Private
 exports.getPaymentById = async(req, res) => {
     try {
         const userId = req.user.id;
         const { id } = req.params;

         const payment = await Payment.findOne({
             where: { id, userId },
             include: [{
                 model: Order,
                 as: 'order',
                 attributes: ['id', 'orderNumber', 'totalAmount', 'status']
             }]
         });

         if (!payment) {
             return res.status(404).json({
                 success: false,
                 error: 'Payment not found'
             });
         }

         res.json({
             success: true,
             data: payment
         });

     } catch (error) {
         console.error('[ERROR] Get payment by ID failed:', error);
         res.status(500).json({
             success: false,
             error: 'Failed to fetch payment'
         });
     }
 };

 // @desc    Get payments for an order
 // @route   GET /api/payments/order/:orderId
 // @access  Private
 exports.getPaymentsByOrder = async(req, res) => {
     try {
         const userId = req.user.id;
         const { orderId } = req.params;

         const payments = await Payment.findAll({
             where: { orderId, userId },
             order: [
                 ['createdAt', 'DESC']
             ]
         });

         res.json({
             success: true,
             count: payments.length,
             data: payments
         });

     } catch (error) {
         console.error('[ERROR] Get payments by order failed:', error);
         res.status(500).json({
             success: false,
             error: 'Failed to fetch payments'
         });
     }
 };

 // @desc    Get user's payment history
 // @route   GET /api/payments/history
 // @access  Private
 exports.getPaymentHistory = async(req, res) => {
     try {
         const userId = req.user.id;
         const page = parseInt(req.query.page) || 1;
         const limit = parseInt(req.query.limit) || 10;
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

         res.json({
             success: true,
             count,
             pagination: {
                 page,
                 limit,
                 totalPages,
                 hasNextPage: page < totalPages,
                 hasPrevPage: page > 1
             },
             data: payments
         });

     } catch (error) {
         console.error('[ERROR] Get payment history failed:', error);
         res.status(500).json({
             success: false,
             error: 'Failed to fetch payment history'
         });
     }
 };

 // @desc    Refund payment
 // @route   POST /api/payments/:id/refund
 // @access  Private/Admin
 exports.refundPayment = async(req, res) => {
     try {
         const { id } = req.params;
         const { reason } = req.body;

         const payment = await Payment.findByPk(id, {
             include: [{
                 model: Order,
                 as: 'order'
             }]
         });

         if (!payment) {
             return res.status(404).json({
                 success: false,
                 error: 'Payment not found'
             });
         }

         if (payment.status !== 'completed') {
             return res.status(400).json({
                 success: false,
                 error: 'Only completed payments can be refunded'
             });
         }

         if (payment.paymentMethod === 'credit_card') {
             // Process Stripe refund
             const refund = await stripe.refunds.create({
                 payment_intent: payment.transactionId,
                 reason: 'requested_by_customer'
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

         res.json({
             success: true,
             message: 'Payment refunded successfully',
             data: payment
         });

     } catch (error) {
         console.error('[ERROR] Refund payment failed:', error);
         res.status(500).json({
             success: false,
             error: 'Failed to process refund'
         });
     }
 };

 // ==================== ADMIN FUNCTIONS ====================

 // @desc    Update payment status (Admin)
 // @route   PUT /api/payments/admin/:id/status
 // @access  Private/Admin
 exports.updatePaymentStatus = async(req, res) => {
     try {
         const { id } = req.params;
         const { status } = req.body;

         const validStatuses = ['pending', 'completed', 'failed', 'refunded'];

         if (!status || !validStatuses.includes(status)) {
             return res.status(400).json({
                 success: false,
                 error: `Valid status required: ${validStatuses.join(', ')}`
             });
         }

         const payment = await Payment.findByPk(id, {
             include: [{
                 model: Order,
                 as: 'order'
             }]
         });

         if (!payment) {
             return res.status(404).json({
                 success: false,
                 error: 'Payment not found'
             });
         }

         // Special handling for completing payments
         if (status === 'completed' && payment.status !== 'completed') {
             await payment.update({
                 status: 'completed',
                 paymentDate: new Date()
             });

             // Update order status
             await payment.order.update({ status: 'processing' });

         } else if (status === 'refunded') {
             await payment.update({
                 status: 'refunded'
             });

             // Update order status
             await payment.order.update({ status: 'refunded' });

         } else {
             await payment.update({ status });
         }

         res.json({
             success: true,
             message: `Payment status updated to ${status}`,
             data: payment
         });

     } catch (error) {
         console.error('[ERROR] Update payment status failed:', error);
         res.status(500).json({
             success: false,
             error: 'Failed to update payment status'
         });
     }
 };

 // @desc    Get all payments (Admin)
 // @route   GET /api/payments/admin/all
 // @access  Private/Admin
 exports.getAllPayments = async(req, res) => {
     try {
         const page = parseInt(req.query.page) || 1;
         const limit = parseInt(req.query.limit) || 20;
         const offset = (page - 1) * limit;

         const { status, paymentMethod, startDate, endDate } = req.query;

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
         const totalRevenue = completedPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

         // Calculate by payment method
         const revenueByMethod = {};
         completedPayments.forEach(payment => {
             const method = payment.paymentMethod;
             revenueByMethod[method] = (revenueByMethod[method] || 0) + parseFloat(payment.amount);
         });

         res.json({
             success: true,
             count,
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
             filters: { status, paymentMethod, startDate, endDate },
             data: payments
         });

     } catch (error) {
         console.error('[ERROR] Get all payments failed:', error);
         res.status(500).json({
             success: false,
             error: 'Failed to fetch payments'
         });
     }
 };

 // @desc    Get payment statistics (Admin)
 // @route   GET /api/payments/admin/statistics
 // @access  Private/Admin
 exports.getPaymentStatistics = async(req, res) => {
     try {
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
             todayRevenue: parseFloat(todayRevenue[0] ?.dataValues ?.total || 0).toFixed(2),
             monthlyRevenue: parseFloat(monthlyRevenue[0] ?.dataValues ?.total || 0).toFixed(2),
             totalPayments: statusCounts.reduce((sum, item) => sum + parseInt(item.dataValues.count), 0)
         };

         res.json({
             success: true,
             data: statistics
         });

     } catch (error) {
         console.error('[ERROR] Get payment statistics failed:', error);
         res.status(500).json({
             success: false,
             error: 'Failed to fetch payment statistics'
         });
     }
 };