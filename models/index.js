const { Sequelize } = require("sequelize");
const dbConfig = require("../config/db.config");

const sequelize = new Sequelize(dbConfig);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// import models
db.User = require("./user.model")(sequelize, Sequelize);
db.Book = require("./book.model")(sequelize, Sequelize);
db.Category = require("./category.model")(sequelize, Sequelize);
db.Cart = require("./cart.model")(sequelize, Sequelize);
db.CartItem = require("./cartItem.model")(sequelize, Sequelize);
db.Order = require("./order.model")(sequelize, Sequelize);
db.OrderItem = require("./orderItem.model")(sequelize, Sequelize);
db.Payment = require("./payment.model")(sequelize, Sequelize);
db.Review = require("./review.model")(sequelize, Sequelize);
db.Wishlist = require("./wishlist.model")(sequelize, Sequelize);
db.Coupon = require("./coupon.model")(sequelize, Sequelize);
db.Notification = require("./notification.model")(sequelize, Sequelize);

// associations
require("./associations")(db);

module.exports = db;