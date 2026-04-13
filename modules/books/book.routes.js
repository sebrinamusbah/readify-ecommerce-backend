const express = require("express");
const controller = require("./book.controller");
const validate = require("../../middlewares/validate.middleware");
const auth = require("../../middlewares/auth.middleware");
const role = require("../../middlewares/role.middleware");

const { createBookSchema, updateBookSchema } = require("./book.validators");

const router = express.Router();

// public
router.get("/", controller.getAllBooks);
router.get("/:id", controller.getBookById);

// admin
router.post(
    "/",
    auth,
    role("admin"),
    validate(createBookSchema),
    controller.createBook,
);
router.put(
    "/:id",
    auth,
    role("admin"),
    validate(updateBookSchema),
    controller.updateBook,
);
router.delete("/:id", auth, role("admin"), controller.deleteBook);

module.exports = router;