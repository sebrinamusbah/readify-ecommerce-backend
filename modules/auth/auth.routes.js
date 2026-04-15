const express = require("express");
const controller = require("./auth.controller");
const validate = require("../../middlewares/validate.middleware");

const { registerSchema, loginSchema } = require("./auth.validators");

const router = express.Router();

router.post("/register", validate(registerSchema), controller.register);
router.post("/login", validate(loginSchema), controller.login);
router.post("/refresh-token", controller.refreshToken);
router.post("/logout", controller.logout);

module.exports = router;
