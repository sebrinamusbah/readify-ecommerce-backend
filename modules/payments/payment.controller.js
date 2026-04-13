const paymentService = require("./payment.service");

exports.createPaymentIntent = async(req, res, next) => {
    try {
        const { orderId } = req.body;

        const intent = await paymentService.createPaymentIntent(
            req.user.id,
            orderId,
        );

        res.json(intent);
    } catch (err) {
        next(err);
    }
};

exports.handleWebhook = async(req, res, next) => {
    try {
        await paymentService.handleWebhook(req);
        res.json({ received: true });
    } catch (err) {
        next(err);
    }
};