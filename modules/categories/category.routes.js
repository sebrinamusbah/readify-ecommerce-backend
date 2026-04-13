const express = require("express");
const controller = require("./category.controller");
const validate = require("../../middlewares/validate.middleware");
const auth = require("../../middlewares/auth.middleware");
const role = require("../../middlewares/role.middleware");

const {
    createCategorySchema,
    updateCategorySchema,
} = require("./category.validators");

const router = express.Router();

// public
router.get("/", controller.getAll);
router.get("/:id", controller.getById);

// admin
router.post(
    "/",
    auth,
    role("admin"),
    validate(createCategorySchema),
    controller.create,
);
router.put(
    "/:id",
    auth,
    role("admin"),
    validate(updateCategorySchema),
    controller.update,
);
router.delete("/:id", auth, role("admin"), controller.delete);

module.exports = router;