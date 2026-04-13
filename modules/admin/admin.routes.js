const express = require("express");
const controller = require("./admin.controller");
const auth = require("../../middlewares/auth.middleware");
const role = require("../../middlewares/role.middleware");

const router = express.Router();

router.use(auth);
router.use(role("admin"));

// dashboard
router.get("/dashboard", controller.getDashboard);

// users management
router.get("/users", controller.getUsers);
router.patch("/users/:id/ban", controller.banUser);

// books management
router.post("/books/:id/feature", controller.featureBook);

// orders management
router.get("/orders", controller.getAllOrders);
router.patch("/orders/:id/status", controller.updateOrderStatus);

// reviews moderation
router.delete("/reviews/:id", controller.deleteReview);

module.exports = router;