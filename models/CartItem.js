const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class CartItem extends Model {
        static associate(models) {
            // CartItem belongs to a User
            CartItem.belongsTo(models.User, {
                foreignKey: "userId",
                as: "user",
            });

            // CartItem belongs to a Book
            CartItem.belongsTo(models.Book, {
                foreignKey: "bookId",
                as: "book",
            });
        }
    }

    CartItem.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "Users",
                key: "id",
            },
        },
        bookId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "Books",
                key: "id",
            },
        },
        quantity: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            validate: {
                min: 1,
            },
        },
    }, {
        sequelize,
        modelName: "CartItem",
        tableName: "cart_items",
        timestamps: true,
        indexes: [{
            unique: true,
            fields: ["userId", "bookId"],
        }, ],
    }, );

    return CartItem;
};