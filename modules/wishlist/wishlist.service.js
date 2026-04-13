const wishlistRepo = require("./wishlist.repository");
const bookRepo = require("../books/book.repository");

const { NotFoundError, BadRequestError } = require("../../shared/errors");
const { wishlistDTO } = require("./wishlist.dto");

exports.getUserWishlist = async(userId) => {
    const items = await wishlistRepo.findByUser(userId);
    return items.map(wishlistDTO);
};

exports.add = async(userId, bookId) => {
    const book = await bookRepo.findById(bookId);
    if (!book) throw new NotFoundError("Book not found");

    const exists = await wishlistRepo.findOne(userId, bookId);
    if (exists) {
        throw new BadRequestError("Book already in wishlist");
    }

    const item = await wishlistRepo.create({
        userId,
        bookId,
    });

    return wishlistDTO(item);
};

exports.remove = async(userId, bookId) => {
    const item = await wishlistRepo.findOne(userId, bookId);

    if (!item) throw new NotFoundError("Wishlist item not found");

    await wishlistRepo.delete(userId, bookId);
};