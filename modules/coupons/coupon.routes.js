const express = require("express");
const controller = require("./coupon.controller");
const auth = require("../../middlewares/auth.middleware");
const role = require("../../middlewares/role.middleware");
const validate = require("../../middlewares/validate.middleware");

const {
    createCouponSchema,
    applyCouponSchema,
} = require("./coupon.validators");

const router = express.Router();

// admin only
router.post(
    "/",
    auth,
    role("admin"),
    validate(createCouponSchema),
    controller.create,
);
router.get("/", auth, role("admin"), controller.getAll);

// user
router.post("/apply", auth, validate(applyCouponSchema), controller.apply);

module.exports = router;