const User = require("./User");
const Book = require("./Book");
const Category = require("./Category");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const CartItem = require("./CartItem");

// Book & Category (Many-to-Many)
Book.belongsToMany(Category, { through: "BookCategories" });
Category.belongsToMany(Book, { through: "BookCategories" });

// User & Order (One-to-Many)
User.hasMany(Order, { foreignKey: "userId", onDelete: "CASCADE" });
Order.belongsTo(User, { foreignKey: "userId" });

// Order & OrderItem (One-to-Many)
Order.hasMany(OrderItem, { foreignKey: "orderId", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

// Book & OrderItem (Many-to-One)
Book.hasMany(OrderItem, { foreignKey: "bookId" });
OrderItem.belongsTo(Book, { foreignKey: "bookId" });

// User & CartItem (One-to-Many)
User.hasMany(CartItem, { foreignKey: "userId", onDelete: "CASCADE" });
CartItem.belongsTo(User, { foreignKey: "userId" });

// Book & CartItem (Many-to-One)
Book.hasMany(CartItem, { foreignKey: "bookId", onDelete: "CASCADE" });
CartItem.belongsTo(Book, { foreignKey: "bookId" });

module.exports = {
    User,
    Book,
    Category,
    Order,
    OrderItem,
    CartItem,
};