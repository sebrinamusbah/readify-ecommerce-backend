const { Review, Book, User, Order, OrderItem } = require('../models');
const { Op } = require('sequelize');

class ReviewService {
    // Get reviews for a book
    async getBookReviews(bookId, { page = 1, limit = 10, rating, sort }) {
        const offset = (page - 1) * limit;

        // Check if book exists
        const book = await Book.findByPk(bookId);
        if (!book) {
            return { book: null };
        }

        // Build where conditions
        const where = { bookId };

        if (rating) {
            where.rating = parseInt(rating);
        }

        // Build order
        let order = [
            ['createdAt', 'DESC']
        ];
        if (sort === 'helpful') {
            order = [
                ['helpfulCount', 'DESC']
            ];
        } else if (sort === 'recent') {
            order = [
                ['createdAt', 'DESC']
            ];
        } else if (sort === 'highest_rating') {
            order = [
                ['rating', 'DESC']
            ];
        } else if (sort === 'lowest_rating') {
            order = [
                ['rating', 'ASC']
            ];
        }

        // Get reviews with pagination
        const { count, rows: reviews } = await Review.findAndCountAll({
            where,
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email']
            }],
            order,
            limit,
            offset,
            distinct: true
        });

        // Calculate average rating and rating distribution
        const ratingStats = await Review.findAll({
            where: { bookId },
            attributes: [
                'rating', [Review.sequelize.fn('COUNT', Review.sequelize.col('id')), 'count']
            ],
            group: ['rating'],
            order: [
                ['rating', 'DESC']
            ]
        });

        // Calculate average rating
        const totalReviews = await Review.count({ where: { bookId } });
        const avgRatingResult = await Review.findOne({
            where: { bookId },
            attributes: [
                [
                    Review.sequelize.fn('AVG', Review.sequelize.col('rating')),
                    'avgRating'
                ]
            ]
        });

        const ratingDistribution = {};
        let totalRatingCount = 0;

        ratingStats.forEach(stat => {
            ratingDistribution[stat.rating] = parseInt(stat.dataValues.count);
            totalRatingCount += parseInt(stat.dataValues.count);
        });

        // Calculate percentages
        const ratingPercentages = {};
        for (let i = 5; i >= 1; i--) {
            ratingPercentages[i] =
                totalRatingCount > 0 ?
                Math.round(((ratingDistribution[i] || 0) / totalRatingCount) * 100) :
                0;
        }

        const totalPages = Math.ceil(count / limit);
        const avgRating = parseFloat(
            avgRatingResult ?.dataValues ?.avgRating || 0
        ).toFixed(1);

        return {
            book: {
                id: book.id,
                title: book.title,
                avgRating,
                totalReviews
            },
            ratingStats: {
                avgRating,
                totalReviews,
                distribution: ratingDistribution,
                percentages: ratingPercentages
            },
            count,
            reviews,
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            filters: { rating, sort }
        };
    }

    // Get single review
    async getReviewById(reviewId) {
        const review = await Review.findByPk(reviewId, {
            include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name']
                },
                {
                    model: Book,
                    as: 'book',
                    attributes: ['id', 'title', 'author', 'coverImage']
                }
            ]
        });

        return review;
    }

    // Create a review
    async createReview({ userId, bookId, rating, comment, title, userRole }) {
        // Check if book exists
        const book = await Book.findByPk(bookId);
        if (!book) {
            throw new Error('Book not found');
        }

        // Check if user has purchased the book
        const hasPurchased = await Order.findOne({
            include: [{
                model: OrderItem,
                as: 'orderItems',
                where: { bookId },
                required: true
            }],
            where: {
                userId,
                status: 'delivered'
            }
        });

        if (!hasPurchased && userRole !== 'admin') {
            throw new Error('You must purchase the book before reviewing it');
        }

        // Check if user already reviewed this book
        const existingReview = await Review.findOne({
            where: { userId, bookId }
        });

        if (existingReview) {
            throw new Error('You have already reviewed this book');
        }

        // Create review
        const review = await Review.create({
            userId,
            bookId,
            rating,
            comment,
            title,
            isVerified: hasPurchased ? true : false
        });

        // Get review with user and book details
        const newReview = await Review.findByPk(review.id, {
            include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name']
                },
                {
                    model: Book,
                    as: 'book',
                    attributes: ['id', 'title', 'author']
                }
            ]
        });

        return newReview;
    }

    // Update a review
    async updateReview(reviewId, userId, { rating, comment, title, userRole }) {
        // Find review
        const review = await Review.findOne({
            where: { id: reviewId, userId }
        });

        if (!review) {
            return null;
        }

        // Check if review is older than 30 days
        const reviewDate = new Date(review.createdAt);
        const currentDate = new Date();
        const daysDiff = Math.floor(
            (currentDate - reviewDate) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff > 30 && userRole !== 'admin') {
            return 'time_expired';
        }

        const updateData = {};

        if (rating !== undefined) {
            updateData.rating = rating;
        }

        if (comment !== undefined) {
            updateData.comment = comment;
        }

        if (title !== undefined) {
            updateData.title = title;
        }

        updateData.updatedAt = new Date();

        // Update review
        await review.update(updateData);

        // Get updated review with relations
        const updatedReview = await Review.findByPk(reviewId, {
            include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name']
                },
                {
                    model: Book,
                    as: 'book',
                    attributes: ['id', 'title', 'author']
                }
            ]
        });

        return updatedReview;
    }

    // Delete a review
    async deleteReview(reviewId, userId) {
        const review = await Review.findOne({
            where: { id: reviewId, userId }
        });

        if (!review) {
            return null;
        }

        await review.destroy();
        return true;
    }

    // Mark review as helpful
    async markAsHelpful(reviewId, userId) {
        const review = await Review.findByPk(reviewId);

        if (!review) {
            return null;
        }

        // Check if user already marked this as helpful
        // (In a real app, you'd have a separate table for this)
        // For now, we'll just increment

        await review.increment('helpfulCount');

        return {
            helpfulCount: review.helpfulCount + 1
        };
    }

    // Report a review
    async reportReview(reviewId, userId, reason) {
        const review = await Review.findByPk(reviewId);

        if (!review) {
            return null;
        }

        // Check if user already reported this review
        // (In a real app, you'd have a separate table for reports)

        await review.increment('reportCount');

        // Log the report
        console.log(`[REPORT] Review ${reviewId} reported by user ${userId}`);
        console.log(`[REPORT] Reason: ${reason}`);

        return true;
    }

    // Get user's reviews
    async getUserReviews(userId, { page = 1, limit = 10 }) {
        const offset = (page - 1) * limit;

        const { count, rows: reviews } = await Review.findAndCountAll({
            where: { userId },
            include: [{
                model: Book,
                as: 'book',
                attributes: ['id', 'title', 'author', 'coverImage']
            }],
            order: [
                ['createdAt', 'DESC']
            ],
            limit,
            offset,
            distinct: true
        });

        const totalPages = Math.ceil(count / limit);

        return {
            count,
            reviews,
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }

    // Get recent reviews
    async getRecentReviews(limit = 5) {
        const reviews = await Review.findAll({
            include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name']
                },
                {
                    model: Book,
                    as: 'book',
                    attributes: ['id', 'title', 'author', 'coverImage']
                }
            ],
            order: [
                ['createdAt', 'DESC']
            ],
            limit
        });

        return reviews;
    }

    // Get top rated books
    async getTopRatedBooks(limit = 10) {
        // Get books with their average ratings
        const books = await Book.findAll({
            attributes: {
                include: [
                    [
                        Review.sequelize.literal(`(
              SELECT AVG(rating) 
              FROM "Reviews" 
              WHERE "Reviews"."bookId" = "Book"."id"
            )`),
                        'avgRating'
                    ],
                    [
                        Review.sequelize.literal(`(
              SELECT COUNT(*) 
              FROM "Reviews" 
              WHERE "Reviews"."bookId" = "Book"."id"
            )`),
                        'reviewCount'
                    ]
                ]
            },
            having: {
                avgRating: {
                    [Op.gte]: 4.0
                },
                reviewCount: {
                    [Op.gte]: 5
                }
            },
            order: [
                [Review.sequelize.literal('"avgRating"'), 'DESC'],
                [Review.sequelize.literal('"reviewCount"'), 'DESC']
            ],
            limit,
            subQuery: false
        });

        // Format response
        const formattedBooks = books.map(book => ({
            id: book.id,
            title: book.title,
            author: book.author,
            price: book.price,
            coverImage: book.coverImage,
            avgRating: parseFloat(book.dataValues.avgRating || 0).toFixed(1),
            reviewCount: parseInt(book.dataValues.reviewCount || 0)
        }));

        return formattedBooks;
    }

    // ==================== ADMIN FUNCTIONS ====================

    // Get all reviews (Admin)
    async getAllReviews({
        page = 1,
        limit = 20,
        status,
        bookId,
        userId,
        rating
    }) {
        const offset = (page - 1) * limit;

        const where = {};

        if (status === 'reported') {
            where.reportCount = {
                [Op.gt]: 0
            };
        }

        if (bookId) where.bookId = bookId;
        if (userId) where.userId = userId;
        if (rating) where.rating = parseInt(rating);

        const { count, rows: reviews } = await Review.findAndCountAll({
            where,
            include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: Book,
                    as: 'book',
                    attributes: ['id', 'title', 'author']
                }
            ],
            order: [
                ['createdAt', 'DESC']
            ],
            limit,
            offset,
            distinct: true
        });

        const totalPages = Math.ceil(count / limit);

        return {
            count,
            reviews,
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            filters: { status, bookId, userId, rating }
        };
    }

    // Delete review (Admin)
    async deleteReviewAdmin(reviewId, reason, adminId) {
        const review = await Review.findByPk(reviewId, {
            include: [{
                    model: User,
                    as: 'user',
                    attributes: ['name', 'email']
                },
                {
                    model: Book,
                    as: 'book',
                    attributes: ['title']
                }
            ]
        });

        if (!review) {
            return null;
        }

        // Log the deletion
        console.log(`[ADMIN] Review ${reviewId} deleted by admin ${adminId}`);
        console.log(`[ADMIN] Reason: ${reason || 'No reason provided'}`);
        console.log(
            `[ADMIN] Review details: User ${review.user.name}, Book: ${review.book.title}`
        );

        await review.destroy();
        return true;
    }

    // Clear reported flags (Admin)
    async clearReports(reviewId) {
        const review = await Review.findByPk(reviewId);

        if (!review) {
            return null;
        }

        await review.update({
            reportCount: 0
        });

        return review;
    }

    // Helper: Calculate book rating stats
    async calculateBookRatingStats(bookId) {
        const ratingStats = await Review.findAll({
            where: { bookId },
            attributes: [
                'rating', [Review.sequelize.fn('COUNT', Review.sequelize.col('id')), 'count']
            ],
            group: ['rating']
        });

        const avgRatingResult = await Review.findOne({
            where: { bookId },
            attributes: [
                [
                    Review.sequelize.fn('AVG', Review.sequelize.col('rating')),
                    'avgRating'
                ]
            ]
        });

        const totalReviews = await Review.count({ where: { bookId } });
        const avgRating = parseFloat(
            avgRatingResult ?.dataValues ?.avgRating || 0
        ).toFixed(1);

        return {
            totalReviews,
            avgRating,
            distribution: ratingStats.reduce((acc, stat) => {
                acc[stat.rating] = parseInt(stat.dataValues.count);
                return acc;
            }, {})
        };
    }

    // Helper: Check if user can review a book
    async canUserReviewBook(userId, bookId) {
        const hasPurchased = await Order.findOne({
            include: [{
                model: OrderItem,
                as: 'orderItems',
                where: { bookId },
                required: true
            }],
            where: {
                userId,
                status: 'delivered'
            }
        });

        const hasReviewed = await Review.findOne({
            where: { userId, bookId }
        });

        return {
            canReview: hasPurchased && !hasReviewed,
            hasPurchased: !!hasPurchased,
            hasReviewed: !!hasReviewed
        };
    }
}

module.exports = new ReviewService();