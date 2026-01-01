const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");
const { authenticate, isAdmin } = require("../middlewares/auth");
const { validateBook } = require("../middlewares/validation");

// Public routes
router.get("/", bookController.getAllBooks);
router.get("/:id", bookController.getBookById);

// Protected routes (admin only)
router.post(
  "/",
  authenticate,
  isAdmin,
  validateBook,
  bookController.createBook
);
router.put(
  "/:id",
  authenticate,
  isAdmin,
  validateBook,
  bookController.updateBook
);
router.delete("/:id", authenticate, isAdmin, bookController.deleteBook);

module.exports = router;
