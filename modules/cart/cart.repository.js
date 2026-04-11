const { CartItem, Book } = require("../../models");

class CartRepository {
  getUserCart(userId) {
    return CartItem.findAll({
      where: { userId },
      include: [{ model: Book, as: "book" }],
    });
  }

  findItem(userId, bookId) {
    return CartItem.findOne({ where: { userId, bookId } });
  }

  create(data) {
    return CartItem.create(data);
  }

  update(item, quantity) {
    return item.update({ quantity });
  }

  deleteItem(id, userId) {
    return CartItem.destroy({ where: { id, userId } });
  }

  clear(userId) {
    return CartItem.destroy({ where: { userId } });
  }
}

module.exports = new CartRepository();
