const orderRepo = require("./order.repository");
const { sequelize } = require("../../models");
const { Op } = require("sequelize");

class OrderService {
    generateOrderNumber() {
        return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    async createOrder(userId, shippingAddress, notes) {
        const transaction = await sequelize.transaction();

        try {
            const cartItems = await orderRepo.getCartItems(userId, transaction);

            if (!cartItems.length) {
                throw new Error("Cart is empty");
            }

            let totalAmount = 0;

            for (const item of cartItems) {
                if (item.book.stock < item.quantity) {
                    throw new Error(`Insufficient stock for ${item.book.title}`);
                }

                totalAmount += item.book.price * item.quantity;
            }

            const order = await orderRepo.createOrder({
                    userId,
                    orderNumber: this.generateOrderNumber(),
                    totalAmount,
                    shippingAddress: shippingAddress.trim(),
                    notes: notes ? .trim() || null,
                    status: "pending",
                },
                transaction
            );

            for (const item of cartItems) {
                await item.book.decrement("stock", {
                    by: item.quantity,
                    transaction,
                });

                await orderRepo.createOrderItem({
                        orderId: order.id,
                        bookId: item.bookId,
                        quantity: item.quantity,
                        price: item.book.price,
                        itemTotal: item.book.price * item.quantity,
                    },
                    transaction
                );
            }

            await orderRepo.deleteCart(userId, transaction);

            await transaction.commit();

            return order;
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    async getUserOrders(userId) {
        return orderRepo.getUserOrders(userId);
    }

    async getOrderById(id, userId) {
        return orderRepo.getOrderById(id, userId);
    }

    async cancelOrder(orderId, userId) {
        const transaction = await sequelize.transaction();

        try {
            const order = await orderRepo.getOrderById(orderId, userId);

            if (!order) throw new Error("Order not found");

            if (!["pending", "processing"].includes(order.status)) {
                throw new Error("Cannot cancel order");
            }

            for (const item of order.items) {
                await item.book.increment("stock", {
                    by: item.quantity,
                    transaction,
                });
            }

            await orderRepo.updateOrderStatus(orderId, "cancelled", transaction);

            await transaction.commit();
            return true;
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
}

module.exports = new OrderService();