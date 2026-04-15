exports.searchDTO = (book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    price: book.price,
    category: book.Category ?.name,
});