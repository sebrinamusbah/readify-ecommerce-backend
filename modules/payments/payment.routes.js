const express = require("express");
const controller = require("./payment.controller");
const auth = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/create-intent", auth, controller.createPaymentIntent);

// webhook (NO auth, raw body needed)
router.post("/webhook", controller.handleWebhook);

module.exports = router;