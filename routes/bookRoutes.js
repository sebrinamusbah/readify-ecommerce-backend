const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");

// 🔐 Middleware (you must create these)
const { protect, isAdmin } = require("../middleware/authMiddleware");

// 📦 File upload (multer)
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* =========================
   PUBLIC ROUTES
========================= */

// Get all books
router.get("/", bookController.getAllBooks);

// Search books
router.get("/search", bookController.searchBooks);

// Featured books
router.get("/featured", bookController.getFeaturedBooks);

// Filter books
router.get("/filter", bookController.filterBooks);

// Books by category
router.get("/category/:categoryId", bookController.getBooksByCategory);

// Get single book
router.get("/:id", bookController.getBookById);

/* =========================
   ADMIN ROUTES
========================= */

// Create book (with image upload)
router.post(
  "/",
  protect,
  isAdmin,
  upload.single("image"),
  bookController.createBook,
);

// Update book
router.put(
  "/:id",
  protect,
  isAdmin,
  upload.single("image"),
  bookController.updateBook,
);

// Delete book
router.delete("/:id", protect, isAdmin, bookController.deleteBook);

module.exports = router;
