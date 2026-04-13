exports.orderDTO = (order) => ({
    id: order.id,
    total: order.total,
    status: order.status,
    items: order.OrderItems.map((item) => ({
        bookId: item.bookId,
        title: item.title, // snapshot
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
    })),
    createdAt: order.createdAt,
});