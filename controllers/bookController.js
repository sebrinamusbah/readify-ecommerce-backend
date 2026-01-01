const db = require("../models");
const Book = db.Book;
const Category = db.Category;

// Get all books with pagination and filtering
exports.getAllBooks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 1000,
      search,
      category,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      order = "DESC",
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (search) {
      where[db.Sequelize.Op.or] = [
        {
          title: {
            [db.Sequelize.Op.iLike]: `%${search}%`,
          },
        },
        {
          author: {
            [db.Sequelize.Op.iLike]: `%${search}%`,
          },
        },
        {
          description: {
            [db.Sequelize.Op.iLike]: `%${search}%`,
          },
        },
      ];
    }

    if (category) {
      where.categoryId = category;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[db.Sequelize.Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[db.Sequelize.Op.lte] = parseFloat(maxPrice);
    }

    // Get books with total count
    const { count, rows: books } = await Book.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, order.toUpperCase()]],
      include: [
        {
          model: Category,
          attributes: ["id", "name", "slug"],
        },
      ],
    });

    res.json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      books,
    });
  } catch (error) {
    console.error("Get books error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get single book by ID
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          attributes: ["id", "name", "slug"],
        },
      ],
    });

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new book (admin only)
exports.createBook = async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json({
      message: "Book created successfully",
      book,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update book (admin only)
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    await book.update(req.body);

    res.json({
      message: "Book updated successfully",
      book,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete book (admin only)
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    await book.destroy();

    res.json({
      message: "Book deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
