const bookService = require("../services/bookService");

// @desc    Get all books with pagination and filters
// @route   GET /api/books
// @access  Public
exports.getAllBooks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      categoryId,
      search,
      featured,
      minPrice,
      maxPrice,
    } = req.query;

    const result = await bookService.getAllBooks({
      page: parseInt(page),
      limit: parseInt(limit),
      categoryId,
      search,
      featured,
      minPrice,
      maxPrice,
    });

    res.json({
      success: true,
      count: result.count,
      pagination: result.pagination,
      filters: result.filters,
      data: result.books,
    });
  } catch (error) {
    console.error("[ERROR] Get all books failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch books",
    });
  }
};

// @desc    Get single book by ID
// @route   GET /api/books/:id
// @access  Public
exports.getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await bookService.getBookById(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        error: "Book not found",
      });
    }

    res.json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error("[ERROR] Get book by ID failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch book",
    });
  }
};

// @desc    Get featured books
// @route   GET /api/books/featured
// @access  Public
exports.getFeaturedBooks = async (req, res) => {
  try {
    const books = await bookService.getFeaturedBooks();

    res.json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error("[ERROR] Get featured books failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch featured books",
    });
  }
};

// @desc    Search books
// @route   GET /api/books/search
// @access  Public
exports.searchBooks = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Search query must be at least 2 characters",
      });
    }

    const result = await bookService.searchBooks(q);

    res.json({
      success: true,
      query: q,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("[ERROR] Search books failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search books",
    });
  }
};

// @desc    Get books with filters
// @route   GET /api/books/filter
// @access  Public
exports.filterBooks = async (req, res) => {
  try {
    const { categoryId, minPrice, maxPrice, minRating, inStock } = req.query;

    const result = await bookService.filterBooks({
      categoryId,
      minPrice,
      maxPrice,
      minRating,
      inStock,
    });

    res.json({
      success: true,
      filters: result.filters,
      count: result.books.length,
      data: result.books,
    });
  } catch (error) {
    console.error("[ERROR] Filter books failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to filter books",
    });
  }
};
