const express = require("express");
const controller = require("./cart.controller");
const auth = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");

const { addToCartSchema, updateCartItemSchema } = require("./cart.validators");

const router = express.Router();

router.use(auth);

router.get("/", controller.getCart);
router.post("/", validate(addToCartSchema), controller.addToCart);
router.put("/:itemId", validate(updateCartItemSchema), controller.updateItem);
router.delete("/:itemId", controller.removeItem);
router.delete("/", controller.clearCart);

module.exports = router;