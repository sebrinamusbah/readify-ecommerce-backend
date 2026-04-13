const express = require("express");
const controller = require("./notification.controller");
const auth = require("../../middlewares/auth.middleware");

const router = express.Router();

router.use(auth);

// user notifications
router.get("/", controller.getMyNotifications);
router.patch("/:id/read", controller.markAsRead);
router.delete("/:id", controller.deleteNotification);

module.exports = router;