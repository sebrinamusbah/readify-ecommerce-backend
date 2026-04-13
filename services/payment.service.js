const stripe = require("../config/stripe.config");

exports.createPaymentIntent = async({ amount, currency = "usd" }) => {
    return await stripe.paymentIntents.create({
        amount: amount * 100, // cents
        currency,
    });
};

exports.verifyPayment = async(paymentIntentId) => {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
};