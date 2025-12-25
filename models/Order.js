const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Order = sequelize.define(
    "Order", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
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
                "cancelled"
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
        timestamps: true,
    }
);

module.exports = Order;