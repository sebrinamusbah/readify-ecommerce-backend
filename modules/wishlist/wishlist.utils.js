exports.isInWishlist = (wishlist, bookId) => {
    return wishlist.some((item) => item.bookId === bookId);
};