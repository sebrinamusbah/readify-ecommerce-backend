const stripe = require("../../config/stripe.config");
const orderRepo = require("../orders/order.repository");

const { NotFoundError, BadRequestError } = require("../../shared/errors");

exports.createPaymentIntent = async(userId, orderId) => {
    const order = await orderRepo.findById(orderId);

    if (!order || order.userId !== userId) {
        throw new NotFoundError("Order not found");
    }

    if (order.status !== "pending") {
        throw new BadRequestError("Order already paid or invalid");
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.total * 100), // cents
        currency: "usd",
        metadata: {
            orderId: order.id,
            userId,
        },
    });

    return {
        clientSecret: paymentIntent.client_secret,
    };
};

exports.handleWebhook = async(req) => {
    const sig = req.headers["stripe-signature"];

    const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
    );

    if (event.type === "payment_intent.succeeded") {
        const intent = event.data.object;

        const orderId = intent.metadata.orderId;

        const order = await orderRepo.findById(orderId);
        if (!order) throw new NotFoundError("Order not found");

        // idempotency safety
        if (order.status === "paid") return;

        await order.update({ status: "paid" });
    }

    if (event.type === "payment_intent.payment_failed") {
        const intent = event.data.object;
        const orderId = intent.metadata.orderId;

        const order = await orderRepo.findById(orderId);
        if (!order) return;

        await order.update({ status: "failed" });
    }
};