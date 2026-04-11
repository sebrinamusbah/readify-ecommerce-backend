const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class Payment extends Model {
        static associate(models) {
            // Payment belongs to an Order
            Payment.belongsTo(models.Order, {
                foreignKey: "orderId",
                as: "order",
            });

            // Payment belongs to a User
            Payment.belongsTo(models.User, {
                foreignKey: "userId",
                as: "user",
            });
        }
    }

    Payment.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        orderId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "Orders",
                key: "id",
            },
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "Users",
                key: "id",
            },
        },
        paymentMethod: {
            type: DataTypes.ENUM("credit_card", "paypal", "cash_on_delivery"),
            allowNull: false,
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        transactionId: {
            type: DataTypes.STRING,
            unique: true,
        },
        status: {
            type: DataTypes.ENUM("pending", "completed", "failed", "refunded"),
            defaultValue: "pending",
        },
        paymentDate: {
            type: DataTypes.DATE,
        },
        cardLastFour: {
            type: DataTypes.STRING(4),
            allowNull: true,
        },
        receiptUrl: {
            type: DataTypes.STRING,
        },
    }, {
        sequelize,
        modelName: "Payment",
        tableName: "Payments",
        timestamps: true,
    }, );

    return Payment;
};