const repo = require("./cart.repository");
const { Book, sequelize } = require("../../models");

class CartService {
  async getCart(userId) {
    const items = await repo.getUserCart(userId);

    let subtotal = 0;
    let totalItems = 0;

    const formatted = items.map((i) => {
      const itemTotal = i.book.price * i.quantity;
      subtotal += itemTotal;
      totalItems += i.quantity;

      return {
        id: i.id,
        bookId: i.bookId,
        quantity: i.quantity,
        book: i.book,
        itemTotal,
      };
    });

    return {
      items: formatted,
      summary: {
        subtotal,
        tax: subtotal * 0.1,
        total: subtotal * 1.1,
        totalItems,
      },
    };
  }

  async addToCart(userId, bookId, quantity) {
    const book = await Book.findByPk(bookId);
    if (!book) throw new Error("Book not found");

    if (book.stock < quantity) throw new Error("Not enough stock");

    const existing = await repo.findItem(userId, bookId);

    if (existing) {
      const newQty = existing.quantity + quantity;

      if (book.stock < newQty) throw new Error("Not enough stock");

      return repo.update(existing, newQty);
    }

    return repo.create({ userId, bookId, quantity });
  }

  async updateItem(id, userId, quantity) {
    const item = await repo.findItem(userId, id);
    if (!item) throw new Error("Not found");

    if (quantity === 0) return repo.deleteItem(id, userId);

    if (item.book.stock < quantity) throw new Error("Not enough stock");

    return repo.update(item, quantity);
  }

  async remove(id, userId) {
    return repo.deleteItem(id, userId);
  }

  async clear(userId) {
    return repo.clear(userId);
  }
}

module.exports = new CartService();
