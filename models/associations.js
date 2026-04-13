module.exports = (db) => {
    const {
        User,
        Book,
        Category,
        Cart,
        CartItem,
        Order,
        OrderItem,
        Payment,
        Review,
        Wishlist,
        Coupon,
        Notification,
    } = db;

    // USER
    User.hasOne(Cart);
    User.hasMany(Order);
    User.hasMany(Review);
    User.hasMany(Wishlist);
    User.hasMany(Notification);

    // CATEGORY
    Category.hasMany(Book);
    Book.belongsTo(Category);

    // CART
    Cart.belongsTo(User);
    Cart.hasMany(CartItem);

    CartItem.belongsTo(Cart);
    CartItem.belongsTo(Book);

    // ORDER
    Order.belongsTo(User);
    Order.hasMany(OrderItem);

    OrderItem.belongsTo(Order);
    OrderItem.belongsTo(Book);

    // PAYMENT
    Payment.belongsTo(Order);

    // REVIEW
    Review.belongsTo(User);
    Review.belongsTo(Book);

    // WISHLIST
    Wishlist.belongsTo(User);
    Wishlist.belongsTo(Book);

    // COUPON
    Order.belongsTo(Coupon);

    // NOTIFICATION
    Notification.belongsTo(User);
};