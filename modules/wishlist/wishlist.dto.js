exports.wishlistDTO = (item) => ({
    id: item.id,
    book: item.Book ?
        {
            id: item.Book.id,
            title: item.Book.title,
            price: item.Book.price,
        } :
        null,
    createdAt: item.createdAt,
});