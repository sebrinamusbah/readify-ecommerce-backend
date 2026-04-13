const Stripe = require("stripe");
const env = require("./env.config");

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

module.exports = stripe;