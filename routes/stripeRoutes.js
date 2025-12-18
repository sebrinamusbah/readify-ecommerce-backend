const express = require("express");
const router = express.Router();
const { createCheckoutSession } = require("../controllers/stripeController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.post("/checkout", verifyToken, createCheckoutSession);

module.exports = router;