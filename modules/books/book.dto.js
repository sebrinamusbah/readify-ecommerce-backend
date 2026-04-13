exports.bookDTO = (book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    price: book.price,
    stock: book.stock,
    category: book.Category ?
        {
            id: book.Category.id,
            name: book.Category.name,
        } :
        null,
    createdAt: book.createdAt,
});