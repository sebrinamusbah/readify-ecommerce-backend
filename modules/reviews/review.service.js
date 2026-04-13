const reviewRepo = require("./review.repository");
const bookRepo = require("../books/book.repository");

const { NotFoundError, BadRequestError } = require("../../shared/errors");

const { reviewDTO } = require("./review.dto");

exports.getByBook = async(bookId, query) => {
    const { page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    const { rows, count } = await reviewRepo.findByBook(bookId, {
        limit,
        offset,
    });

    return {
        data: rows.map(reviewDTO),
        meta: {
            total: count,
            page: Number(page),
            pages: Math.ceil(count / limit),
        },
    };
};

exports.create = async(userId, { bookId, rating, comment }) => {
    const book = await bookRepo.findById(bookId);
    if (!book) throw new NotFoundError("Book not found");

    // one review per user per book
    const existing = await reviewRepo.findByUserAndBook(userId, bookId);
    if (existing) {
        throw new BadRequestError("You already reviewed this book");
    }

    const review = await reviewRepo.create({
        userId,
        bookId,
        rating,
        comment,
    });

    // update average rating
    await updateBookRating(bookId);

    return reviewDTO(review);
};

exports.update = async(userId, reviewId, data) => {
    const review = await reviewRepo.findById(reviewId);
    if (!review) throw new NotFoundError("Review not found");

    if (review.userId !== userId) {
        throw new BadRequestError("Unauthorized");
    }

    const updated = await reviewRepo.update(reviewId, data);

    await updateBookRating(review.bookId);

    return reviewDTO(updated);
};

exports.delete = async(userId, reviewId) => {
    const review = await reviewRepo.findById(reviewId);
    if (!review) throw new NotFoundError("Review not found");

    if (review.userId !== userId) {
        throw new BadRequestError("Unauthorized");
    }

    await reviewRepo.delete(reviewId);

    await updateBookRating(review.bookId);
};

// helper
const updateBookRating = async(bookId) => {
    const stats = await reviewRepo.getBookRatingStats(bookId);

    await bookRepo.update(bookId, {
        rating: stats.avg || 0,
        reviewCount: stats.count || 0,
    });
};