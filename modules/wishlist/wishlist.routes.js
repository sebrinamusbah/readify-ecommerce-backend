const express = require("express");
const controller = require("./wishlist.controller");
const auth = require("../../middlewares/auth.middleware");

const router = express.Router();

router.use(auth);

router.get("/", controller.getWishlist);
router.post("/", controller.addToWishlist);
router.delete("/:bookId", controller.removeFromWishlist);

module.exports = router;