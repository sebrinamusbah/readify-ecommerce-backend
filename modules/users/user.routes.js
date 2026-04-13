const express = require("express");
const controller = require("./user.controller");
const validate = require("../../middlewares/validate.middleware");
const auth = require("../../middlewares/auth.middleware");
const role = require("../../middlewares/role.middleware");

const { updateUserSchema } = require("./user.validators");

const router = express.Router();

// current user
router.get("/me", auth, controller.getMe);
router.put("/me", auth, validate(updateUserSchema), controller.updateMe);

// admin
router.get("/", auth, role("admin"), controller.getAllUsers);
router.get("/:id", auth, role("admin"), controller.getUserById);
router.delete("/:id", auth, role("admin"), controller.deleteUser);

module.exports = router;