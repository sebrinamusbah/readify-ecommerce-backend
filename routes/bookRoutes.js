const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");
const { authenticate, isAdmin } = require("../middlewares/auth");
const { validateBook } = require("../middlewares/validation");

// ========================
// PUBLIC ROUTES - SPECIFIC ROUTES FIRST!
// ========================

// 1. Specific routes MUST come before parameter routes
router.get("/all", bookController.getAllBooksWithoutLimit);
router.get("/count", bookController.getBooksCount);

// 2. Base route
router.get("/", bookController.getAllBooks);

// 3. Parameter routes LAST
router.get("/:id", bookController.getBookById); // This comes LAST!

// ========================
// PROTECTED ROUTES (Admin only)
// ========================

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
