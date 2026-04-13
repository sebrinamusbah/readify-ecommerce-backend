const { Cart, CartItem, Book } = require("../../models");

exports.getOrCreateCart = async(userId) => {
    let cart = await Cart.findOne({
        where: { userId },
        include: [{ model: CartItem, include: [Book] }],
    });

    if (!cart) {
        cart = await Cart.create({ userId });
    }

    return cart;
};

exports.addOrUpdateItem = async(userId, bookId, quantity, price) => {
    const cart = await this.getOrCreateCart(userId);

    const existing = await CartItem.findOne({
        where: { cartId: cart.id, bookId },
    });

    if (existing) {
        return existing.update({
            quantity: existing.quantity + quantity,
        });
    }

    return CartItem.create({
        cartId: cart.id,
        bookId,
        quantity,
        price,
    });
};

exports.findItem = (itemId) => {
    return CartItem.findByPk(itemId);
};

exports.updateItem = (itemId, quantity) => {
    return CartItem.update({ quantity }, { where: { id: itemId } });
};

exports.removeItem = (itemId) => {
    return CartItem.destroy({ where: { id: itemId } });
};

exports.clearCart = async(userId) => {
    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) return;

    return CartItem.destroy({ where: { cartId: cart.id } });
};