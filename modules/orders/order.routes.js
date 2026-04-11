const router = require("express").Router();
const controller = require("./order.controller");
const auth = require("../../middlewares/auth");

router.use(auth);

router.post("/", controller.createOrder);
router.get("/", controller.getUserOrders);
router.get("/:id", controller.getOrderById);
router.patch("/:id/cancel", controller.cancelOrder);

module.exports = router;
