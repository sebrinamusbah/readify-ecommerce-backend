exports.calculateTotals = (cart) => {
    let total = 0;

    cart.CartItems.forEach((item) => {
        total += item.price * item.quantity;
    });

    cart.total = total;

    return cart;
};