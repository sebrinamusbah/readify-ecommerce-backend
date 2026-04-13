exports.cartDTO = (cart) => ({
    id: cart.id,
    items: cart.CartItems ? .map((item) => ({
        id: item.id,
        bookId: item.bookId,
        title: item.Book.title,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
    })) || [],
    total: cart.total || 0,
});