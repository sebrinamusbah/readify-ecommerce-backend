const userRepo = require("../users/user.repository");
const bookRepo = require("../books/book.repository");
const orderRepo = require("../orders/order.repository");
const reviewRepo = require("../reviews/review.repository");

const { NotFoundError, BadRequestError } = require("../../shared/errors");

exports.getDashboard = async() => {
    const usersCount = await userRepo.count();
    const booksCount = await bookRepo.count();
    const ordersCount = await orderRepo.count();

    const revenue = await orderRepo.getTotalRevenue();

    return {
        usersCount,
        booksCount,
        ordersCount,
        revenue,
    };
};

exports.getUsers = async(query) => {
    return userRepo.findAll(query);
};

exports.banUser = async(userId) => {
    const user = await userRepo.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    return userRepo.update(userId, { banned: true });
};

exports.featureBook = async(bookId) => {
    const book = await bookRepo.findById(bookId);
    if (!book) throw new NotFoundError("Book not found");

    return bookRepo.update(bookId, { featured: true });
};

exports.getAllOrders = async(query) => {
    return orderRepo.findAll(query);
};

exports.updateOrderStatus = async(orderId, status) => {
    const order = await orderRepo.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");

    const allowed = ["pending", "paid", "shipped", "cancelled"];

    if (!allowed.includes(status)) {
        throw new BadRequestError("Invalid status");
    }

    return order.update({ status });
};

exports.deleteReview = async(reviewId) => {
    const review = await reviewRepo.findById(reviewId);
    if (!review) throw new NotFoundError("Review not found");

    return reviewRepo.delete(reviewId);
};