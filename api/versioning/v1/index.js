const express = require("express");

const authRoutes = require("../../../modules/auth/auth.routes");
const userRoutes = require("../../../modules/users/user.routes");
const bookRoutes = require("../../../modules/books/book.routes");
const categoryRoutes = require("../../../modules/categories/category.routes");
const cartRoutes = require("../../../modules/cart/cart.routes");
const orderRoutes = require("../../../modules/orders/order.routes");
const paymentRoutes = require("../../../modules/payments/payment.routes");
const reviewRoutes = require("../../../modules/reviews/review.routes");
const adminRoutes = require("../../../modules/admin/admin.routes");
const wishlistRoutes = require("../../../modules/wishlist/wishlist.routes");
const couponRoutes = require("../../../modules/coupons/coupon.routes");
const searchRoutes = require("../../../modules/search/search.routes");
const notificationRoutes = require("../../../modules/notifications/notification.routes");
const mediaRoutes = require("../../../modules/media/media.routes");

const router = express.Router();

// =====================
// MODULE ROUTES
// =====================
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/books", bookRoutes);
router.use("/categories", categoryRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/reviews", reviewRoutes);
router.use("/admin", adminRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/coupons", couponRoutes);
router.use("/search", searchRoutes);
router.use("/notifications", notificationRoutes);
router.use("/media", mediaRoutes);

module.exports = router;