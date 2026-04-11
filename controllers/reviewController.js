const { Review, Book, User, Order, OrderItem, sequelize } = require("../models");
const { Op } = require("sequelize");

// ==================== GET BOOK REVIEWS ====================
exports.getBookReviews = async(req, res) => {
    try {
        const { bookId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { rating, sort } = req.query;

        const book = await Book.findByPk(bookId);
        if (!book) {
            return res.status(404).json({ success: false, error: "Book not found" });
        }

        const where = { bookId };
        if (rating) where.rating = parseInt(rating);

        let order = [
            ["createdAt", "DESC"]
        ];
        if (sort === "helpful") order = [
            ["helpfulCount", "DESC"]
        ];
        if (sort === "highest_rating") order = [
            ["rating", "DESC"]
        ];
        if (sort === "lowest_rating") order = [
            ["rating", "ASC"]
        ];

        const { count, rows: reviews } = await Review.findAndCountAll({
            where,
            include: [{
                model: User,
                as: "user",
                attributes: ["id", "name"]
            }],
            order,
            limit,
            offset,
            distinct: true
        });

        // rating distribution
        const ratingStats = await Review.findAll({
            where: { bookId },
            attributes: [
                "rating", [sequelize.fn("COUNT", sequelize.col("id")), "count"]
            ],
            group: ["rating"],
            raw: true
        });

        const distribution = {};
        let totalRatingCount = 0;

        ratingStats.forEach(r => {
            distribution[r.rating] = parseInt(r.count);
            totalRatingCount += parseInt(r.count);
        });

        const percentages = {};
        for (let i = 5; i >= 1; i--) {
            percentages[i] =
                totalRatingCount > 0 ?
                Math.round(((distribution[i] || 0) / totalRatingCount) * 100) :
                0;
        }

        const avgRatingResult = await Review.findOne({
            where: { bookId },
            attributes: [
                [sequelize.fn("AVG", sequelize.col("rating")), "avg"]
            ],
            raw: true
        });

        const avgRating = Number(avgRatingResult ? .avg || 0).toFixed(1);
        const totalReviews = count;

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
                distribution,
                percentages
            },
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(count / limit),
                hasNextPage: page < Math.ceil(count / limit),
                hasPrevPage: page > 1
            },
            data: reviews
        });
    } catch (error) {
        console.error("[ERROR] Get book reviews failed:", error);
        res.status(500).json({ success: false, error: "Failed to fetch reviews" });
    }
};

// ==================== CREATE REVIEW ====================
exports.createReview = async(req, res) => {
    try {
        const userId = req.user.id;
        const { bookId, rating, comment, title } = req.body;

        if (!bookId || !rating) {
            return res.status(400).json({
                success: false,
                error: "BookId and rating are required"
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: "Rating must be 1-5"
            });
        }

        const book = await Book.findByPk(bookId);
        if (!book) {
            return res.status(404).json({ success: false, error: "Book not found" });
        }

        // verify purchase
        const hasPurchased = await Order.findOne({
            where: { userId, status: "delivered" },
            include: [{
                model: OrderItem,
                as: "items",
                where: { bookId }
            }]
        });

        if (!hasPurchased && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                error: "You must purchase before reviewing"
            });
        }

        const existing = await Review.findOne({ where: { userId, bookId } });
        if (existing) {
            return res.status(409).json({
                success: false,
                error: "Already reviewed this book"
            });
        }

        const review = await Review.create({
            userId,
            bookId,
            rating,
            comment: comment ? .trim() || null,
            title: title ? .trim() || null,
            isVerified: !!hasPurchased
        });

        const fullReview = await Review.findByPk(review.id, {
            include: [
                { model: User, as: "user", attributes: ["id", "name"] },
                { model: Book, as: "book", attributes: ["id", "title"] }
            ]
        });

        res.status(201).json({
            success: true,
            message: "Review created",
            data: fullReview
        });
    } catch (error) {
        console.error("[ERROR] Create review failed:", error);
        res.status(500).json({ success: false, error: "Failed to create review" });
    }
};

// ==================== UPDATE REVIEW ====================
exports.updateReview = async(req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const review = await Review.findOne({ where: { id, userId } });
        if (!review) {
            return res.status(404).json({
                success: false,
                error: "Review not found"
            });
        }

        const days =
            (Date.now() - new Date(review.createdAt)) / (1000 * 60 * 60 * 24);

        if (days > 30 && req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                error: "Edit allowed only within 30 days"
            });
        }

        const { rating, comment, title } = req.body;

        await review.update({
            rating: rating ? ? review.rating,
            comment: comment ? .trim() ? ? review.comment,
            title: title ? .trim() ? ? review.title
        });

        const updated = await Review.findByPk(id, {
            include: [
                { model: User, as: "user", attributes: ["id", "name"] },
                { model: Book, as: "book", attributes: ["id", "title"] }
            ]
        });

        res.json({
            success: true,
            message: "Review updated",
            data: updated
        });
    } catch (error) {
        console.error("[ERROR] Update review failed:", error);
        res.status(500).json({ success: false, error: "Failed to update review" });
    }
};

// ==================== DELETE REVIEW ====================
exports.deleteReview = async(req, res) => {
    try {
        const review = await Review.findOne({
            where: { id: req.params.id, userId: req.user.id }
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                error: "Review not found"
            });
        }

        await review.destroy();

        res.json({
            success: true,
            message: "Review deleted"
        });
    } catch (error) {
        console.error("[ERROR] Delete review failed:", error);
        res.status(500).json({ success: false, error: "Failed to delete review" });
    }
};

// ==================== HELPFUL ====================
exports.markAsHelpful = async(req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);

        if (!review) {
            return res.status(404).json({ success: false, error: "Not found" });
        }

        await review.increment("helpfulCount");

        res.json({
            success: true,
            message: "Marked helpful",
            data: { helpfulCount: review.helpfulCount + 1 }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed" });
    }
};

// ==================== REPORT ====================
exports.reportReview = async(req, res) => {
    try {
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                error: "Reason required"
            });
        }

        const review = await Review.findByPk(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, error: "Not found" });
        }

        await review.increment("reportCount");

        res.json({
            success: true,
            message: "Reported successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed" });
    }
};