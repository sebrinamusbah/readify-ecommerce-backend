const bookService = require("./book.service");

class BookController {
  async createBook(req, res) {
    try {
      const book = await bookService.createBook(req.body, req.file);

      res.status(201).json({
        success: true,
        data: book,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async updateBook(req, res) {
    try {
      const book = await bookService.updateBook(
        req.params.id,
        req.body,
        req.file,
      );

      res.json({
        success: true,
        data: book,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async deleteBook(req, res) {
    try {
      await bookService.deleteBook(req.params.id);

      res.json({
        success: true,
        message: "Book deleted",
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async updateStock(req, res) {
    try {
      const { quantity, action } = req.body;

      const stock = await bookService.updateStock(
        req.params.id,
        quantity,
        action,
      );

      res.json({
        success: true,
        stock,
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  }

  async getStats(req, res) {
    try {
      const stats = await bookService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
}

module.exports = new BookController();
