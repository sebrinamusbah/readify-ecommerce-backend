exports.CACHE_KEYS = {
    BOOKS: "books",
    BOOK: (id) => `book:${id}`,
    USER: (id) => `user:${id}`,
    WISHLIST: (userId) => `wishlist:${userId}`,
    SEARCH: (query) => `search:${query}`,
};