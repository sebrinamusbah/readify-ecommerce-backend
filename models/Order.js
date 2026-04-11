const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class Order extends Model {
        static associate(models) {
            // Order belongs to a User
            Order.belongsTo(models.User, {
                foreignKey: "userId",
                as: "user",
            });

            // Order has many OrderItems
            Order.hasMany(models.OrderItem, {
                foreignKey: "orderId",
                as: "orderItems",
            });
            Order.hasOne(models.Payment, {
                foreignKey: "orderId",
                as: "payment",
            });

            // Uncomment when you add Payment.js
            // Order.hasOne(models.Payment, {
            //   foreignKey: 'orderId',
            //   as: 'payment'
            // });
        }
    }

    Order.init({
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
        totalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM(
                "pending",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
            ),
            defaultValue: "pending",
        },
        shippingAddress: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        paymentMethod: {
            type: DataTypes.ENUM("credit_card", "paypal", "cash_on_delivery"),
            allowNull: false,
        },
        paymentStatus: {
            type: DataTypes.ENUM("pending", "paid", "failed"),
            defaultValue: "pending",
        },
        notes: {
            type: DataTypes.TEXT,
        },
    }, {
        sequelize,
        modelName: "Order",
        tableName: "Orders",
        timestamps: true,
    }, );

    return Order;
};