const bookRepo = require("./book.repository");
const validator = require("./book.validators");
const { uploadToCloudinary } = require("../../shared/utils/uploadImage");
const { parseBoolean, parseNumber } = require("./book.utils");
const { Category } = require("../../models");

class BookService {
  async createBook(data, file) {
    const errors = validator.validateCreate(data);
    if (errors.length) throw new Error(errors.join(", "));

    const category = await Category.findByPk(data.categoryId);
    if (!category) throw new Error("Category not found");

    if (data.isbn) {
      const exists = await bookRepo.findByISBN(data.isbn);
      if (exists) throw new Error("ISBN already exists");
    }

    let coverImage =
      "https://via.placeholder.com/300x400/4A90E2/FFFFFF?text=Book";

    if (file) {
      const result = await uploadToCloudinary(file.buffer);
      coverImage = result.secure_url;
    }

    return bookRepo.create({
      title: data.title.trim(),
      author: data.author.trim(),
      description: data.description || null,
      price: parseNumber(data.price),
      stock: parseNumber(data.stock, 0),
      categoryId: data.categoryId,
      isbn: data.isbn || null,
      pages: parseNumber(data.pages),
      language: data.language || "English",
      publishedDate: data.publishedDate || null,
      isFeatured: parseBoolean(data.isFeatured),
      coverImage,
    });
  }

  async updateBook(id, data, file) {
    const book = await bookRepo.findById(id);
    if (!book) throw new Error("Book not found");

    let coverImage = book.coverImage;

    if (file) {
      const result = await uploadToCloudinary(file.buffer);
      coverImage = result.secure_url;
    }

    return bookRepo.update(book, {
      ...data,
      price: parseNumber(data.price, book.price),
      stock: parseNumber(data.stock, book.stock),
      pages: parseNumber(data.pages, book.pages),
      isFeatured:
        data.isFeatured !== undefined
          ? parseBoolean(data.isFeatured)
          : book.isFeatured,
      coverImage,
    });
  }

  async deleteBook(id) {
    const book = await bookRepo.findById(id);
    if (!book) throw new Error("Book not found");

    await bookRepo.delete(book);
    return true;
  }

  async updateStock(id, quantity, action) {
    const book = await bookRepo.findById(id);
    if (!book) throw new Error("Book not found");

    const qty = Number(quantity);
    if (isNaN(qty)) throw new Error("Invalid quantity");

    let newStock = book.stock;

    if (action === "add") newStock += qty;
    else if (action === "subtract") newStock -= qty;
    else newStock = qty;

    if (newStock < 0) throw new Error("Stock cannot be negative");

    await book.update({ stock: newStock });

    return newStock;
  }

  async getStats() {
    const totalBooks = await bookRepo.count();
    return { totalBooks };
  }
}

module.exports = new BookService();
