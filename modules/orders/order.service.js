const { sequelize } = require("../../models");
const orderRepo = require("./order.repository");
const cartRepo = require("../cart/cart.repository");
const bookRepo = require("../books/book.repository");

const { NotFoundError, BadRequestError } = require("../../shared/errors");

const { orderDTO } = require("./order.dto");

exports.createOrder = async(userId) => {
    return sequelize.transaction(async(t) => {
        // 1. get cart
        const cart = await cartRepo.getOrCreateCart(userId);

        if (!cart.CartItems || cart.CartItems.length === 0) {
            throw new BadRequestError("Cart is empty");
        }

        let total = 0;
        const orderItemsData = [];

        // 2. validate stock + prepare snapshot
        for (const item of cart.CartItems) {
            const book = await bookRepo.findById(item.bookId);

            if (!book) throw new NotFoundError("Book not found");

            if (book.stock < item.quantity) {
                throw new BadRequestError(`Not enough stock for ${book.title}`);
            }

            // reduce stock
            await book.update({ stock: book.stock - item.quantity }, { transaction: t }, );

            const price = book.price;

            total += price * item.quantity;

            orderItemsData.push({
                bookId: book.id,
                title: book.title, // snapshot 🔥
                price,
                quantity: item.quantity,
            });
        }

        // 3. create order
        const order = await orderRepo.create({
                userId,
                total,
                status: "pending",
            },
            t,
        );

        // 4. create order items
        await orderRepo.bulkCreateItems(order.id, orderItemsData, t);

        // 5. clear cart
        await cartRepo.clearCart(userId);

        return orderDTO(await orderRepo.findById(order.id));
    });
};

exports.getUserOrders = async(userId) => {
    const orders = await orderRepo.findByUser(userId);
    return orders.map(orderDTO);
};

exports.getById = async(userId, orderId) => {
    const order = await orderRepo.findById(orderId);

    if (!order || order.userId !== userId) {
        throw new NotFoundError("Order not found");
    }

    return orderDTO(order);
};