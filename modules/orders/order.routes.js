const express = require("express");
const controller = require("./order.controller");
const auth = require("../../middlewares/auth.middleware");

const router = express.Router();

router.use(auth);

router.post("/", controller.createOrder);
router.get("/", controller.getMyOrders);
router.get("/:id", controller.getOrderById);

module.exports = router;