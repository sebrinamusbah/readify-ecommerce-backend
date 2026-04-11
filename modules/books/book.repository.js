const { Book } = require("../../models");

class BookRepository {
  async create(data) {
    return Book.create(data);
  }

  async findById(id) {
    return Book.findByPk(id);
  }

  async findByISBN(isbn) {
    return Book.findOne({ where: { isbn } });
  }

  async update(book, data) {
    return book.update(data);
  }

  async delete(book) {
    return book.destroy();
  }

  async count() {
    return Book.count();
  }

  async countByCategory(categoryId) {
    return Book.count({ where: { categoryId } });
  }
}

module.exports = new BookRepository();
