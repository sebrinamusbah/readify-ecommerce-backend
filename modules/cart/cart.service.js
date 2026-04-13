const cartRepo = require("./cart.repository");
const bookRepo = require("../books/book.repository");
const { NotFoundError, BadRequestError } = require("../../shared/errors");
const { cartDTO } = require("./cart.dto");
const { calculateTotals } = require("./cart.utils");

exports.getCart = async(userId) => {
    const cart = await cartRepo.getOrCreateCart(userId);
    return cartDTO(cart);
};

exports.addToCart = async(userId, { bookId, quantity }) => {
    const book = await bookRepo.findById(bookId);
    if (!book) throw new NotFoundError("Book not found");

    if (book.stock < quantity) {
        throw new BadRequestError("Not enough stock");
    }

    await cartRepo.addOrUpdateItem(userId, bookId, quantity, book.price);

    const cart = await cartRepo.getOrCreateCart(userId);
    return cartDTO(calculateTotals(cart));
};

exports.updateItem = async(userId, itemId, { quantity }) => {
    const item = await cartRepo.findItem(itemId);
    if (!item) throw new NotFoundError("Cart item not found");

    const book = await bookRepo.findById(item.bookId);

    if (book.stock < quantity) {
        throw new BadRequestError("Not enough stock");
    }

    await cartRepo.updateItem(itemId, quantity);

    const cart = await cartRepo.getOrCreateCart(userId);
    return cartDTO(calculateTotals(cart));
};

exports.removeItem = async(userId, itemId) => {
    await cartRepo.removeItem(itemId);

    const cart = await cartRepo.getOrCreateCart(userId);
    return cartDTO(calculateTotals(cart));
};

exports.clearCart = async(userId) => {
    await cartRepo.clearCart(userId);
};