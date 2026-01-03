// controllers/reviewController.js
const { Review, Book, User, Order, OrderItem } = require('../models');
const { Op } = require('sequelize');

// @desc    Get reviews for a book
// @route   GET /api/books/:bookId/reviews
// @access  Public
exports.getBookReviews = async(req, res) => {
    try {
        const { bookId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { rating, sort } = req.query;

        // Check if book exists
        const book = await Book.findByPk(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                error: 'Book not found'
            });
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
                [Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'avgRating']
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
            ratingPercentages[i] = totalRatingCount > 0 ?
                Math.round((ratingDistribution[i] || 0) / totalRatingCount * 100) :
                0;
        }

        const totalPages = Math.ceil(count / limit);
        const avgRating = parseFloat(avgRatingResult ?.dataValues ?.avgRating || 0).toFixed(1);

        res.json({
            success: true,
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
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            filters: {
                rating,
                sort
            },
            data: reviews
        });

    } catch (error) {
        console.error('[ERROR] Get book reviews failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reviews'
        });
    }
};

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
exports.getReviewById = async(req, res) => {
    try {
        const { id } = req.params;

        const review = await Review.findByPk(id, {
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

        if (!review) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        res.json({
            success: true,
            data: review
        });

    } catch (error) {
        console.error('[ERROR] Get review by ID failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch review'
        });
    }
};

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async(req, res) => {
    try {
        const userId = req.user.id;
        const { bookId, rating, comment, title } = req.body;

        // Validation
        if (!bookId) {
            return res.status(400).json({
                success: false,
                error: 'Book ID is required'
            });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: 'Rating must be between 1 and 5'
            });
        }

        if (comment && comment.length > 2000) {
            return res.status(400).json({
                success: false,
                error: 'Comment cannot exceed 2000 characters'
            });
        }

        if (title && title.length > 200) {
            return res.status(400).json({
                success: false,
                error: 'Title cannot exceed 200 characters'
            });
        }

        // Check if book exists
        const book = await Book.findByPk(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                error: 'Book not found'
            });
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

        if (!hasPurchased && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'You must purchase the book before reviewing it'
            });
        }

        // Check if user already reviewed this book
        const existingReview = await Review.findOne({
            where: { userId, bookId }
        });

        if (existingReview) {
            return res.status(409).json({
                success: false,
                error: 'You have already reviewed this book'
            });
        }

        // Create review
        const review = await Review.create({
            userId,
            bookId,
            rating: parseInt(rating),
            comment: comment ? comment.trim() : null,
            title: title ? title.trim() : null,
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

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: newReview
        });

    } catch (error) {
        console.error('[ERROR] Create review failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit review'
        });
    }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async(req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { rating, comment, title } = req.body;

        // Find review
        const review = await Review.findOne({
            where: { id, userId }
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                error: 'Review not found or you are not authorized to edit it'
            });
        }

        // Check if review is older than 30 days
        const reviewDate = new Date(review.createdAt);
        const currentDate = new Date();
        const daysDiff = Math.floor((currentDate - reviewDate) / (1000 * 60 * 60 * 24));

        if (daysDiff > 30 && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Reviews can only be edited within 30 days of submission'
            });
        }

        const updateData = {};

        if (rating !== undefined) {
            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    error: 'Rating must be between 1 and 5'
                });
            }
            updateData.rating = parseInt(rating);
        }

        if (comment !== undefined) {
            if (comment.length > 2000) {
                return res.status(400).json({
                    success: false,
                    error: 'Comment cannot exceed 2000 characters'
                });
            }
            updateData.comment = comment.trim();
        }

        if (title !== undefined) {
            if (title.length > 200) {
                return res.status(400).json({
                    success: false,
                    error: 'Title cannot exceed 200 characters'
                });
            }
            updateData.title = title.trim();
        }

        updateData.updatedAt = new Date();

        // Update review
        await review.update(updateData);

        // Get updated review with relations
        const updatedReview = await Review.findByPk(id, {
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

        res.json({
            success: true,
            message: 'Review updated successfully',
            data: updatedReview
        });

    } catch (error) {
        console.error('[ERROR] Update review failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update review'
        });
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async(req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const review = await Review.findOne({
            where: { id, userId }
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                error: 'Review not found or you are not authorized to delete it'
            });
        }

        await review.destroy();

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });

    } catch (error) {
        console.error('[ERROR] Delete review failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete review'
        });
    }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
exports.markAsHelpful = async(req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const review = await Review.findByPk(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        // Check if user already marked this as helpful
        // (In a real app, you'd have a separate table for this)
        // For now, we'll just increment

        await review.increment('helpfulCount');

        res.json({
            success: true,
            message: 'Marked as helpful',
            data: {
                helpfulCount: review.helpfulCount + 1
            }
        });

    } catch (error) {
        console.error('[ERROR] Mark as helpful failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark as helpful'
        });
    }
};

// @desc    Report a review
// @route   POST /api/reviews/:id/report
// @access  Private
exports.reportReview = async(req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim().length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a reason (minimum 10 characters)'
            });
        }

        const review = await Review.findByPk(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        // Check if user already reported this review
        // (In a real app, you'd have a separate table for reports)

        await review.increment('reportCount');

        // Log the report
        console.log(`[REPORT] Review ${id} reported by user ${userId}`);
        console.log(`[REPORT] Reason: ${reason}`);

        res.json({
            success: true,
            message: 'Review reported. Our team will review it shortly.'
        });

    } catch (error) {
        console.error('[ERROR] Report review failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to report review'
        });
    }
};

// @desc    Get user's reviews
// @route   GET /api/users/me/reviews
// @access  Private
exports.getUserReviews = async(req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
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

        res.json({
            success: true,
            count,
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            data: reviews
        });

    } catch (error) {
        console.error('[ERROR] Get user reviews failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch your reviews'
        });
    }
};

// @desc    Get recent reviews
// @route   GET /api/reviews/recent
// @access  Public
exports.getRecentReviews = async(req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;

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

        res.json({
            success: true,
            count: reviews.length,
            data: reviews
        });

    } catch (error) {
        console.error('[ERROR] Get recent reviews failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recent reviews'
        });
    }
};

// @desc    Get top rated books
// @route   GET /api/reviews/top-rated
// @access  Public
exports.getTopRatedBooks = async(req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

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

        res.json({
            success: true,
            count: formattedBooks.length,
            data: formattedBooks
        });

    } catch (error) {
        console.error('[ERROR] Get top rated books failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch top rated books'
        });
    }
};

// ==================== ADMIN FUNCTIONS ====================

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews/admin/all
// @access  Private/Admin
exports.getAllReviews = async(req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { status, bookId, userId, rating } = req.query;

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

        res.json({
            success: true,
            count,
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            filters: { status, bookId, userId, rating },
            data: reviews
        });

    } catch (error) {
        console.error('[ERROR] Get all reviews failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reviews'
        });
    }
};

// @desc    Delete review (Admin)
// @route   DELETE /api/reviews/admin/:id
// @access  Private/Admin
exports.deleteReviewAdmin = async(req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const review = await Review.findByPk(id, {
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
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        // Log the deletion
        console.log(`[ADMIN] Review ${id} deleted by admin ${req.user.id}`);
        console.log(`[ADMIN] Reason: ${reason || 'No reason provided'}`);
        console.log(`[ADMIN] Review details: User ${review.user.name}, Book: ${review.book.title}`);

        await review.destroy();

        res.json({
            success: true,
            message: 'Review deleted by admin'
        });

    } catch (error) {
        console.error('[ERROR] Admin delete review failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete review'
        });
    }
};

// @desc    Clear reported flags (Admin)
// @route   PUT /api/reviews/admin/:id/clear-reports
// @access  Private/Admin
exports.clearReports = async(req, res) => {
    try {
        const { id } = req.params;

        const review = await Review.findByPk(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                error: 'Review not found'
            });
        }

        await review.update({
            reportCount: 0
        });

        res.json({
            success: true,
            message: 'Report flags cleared',
            data: review
        });

    } catch (error) {
        console.error('[ERROR] Clear reports failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear reports'
        });
    }
};