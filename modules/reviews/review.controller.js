const reviewService = require("./review.service");

exports.getBookReviews = async(req, res, next) => {
    try {
        const reviews = await reviewService.getByBook(req.params.bookId, req.query);
        res.json(reviews);
    } catch (err) {
        next(err);
    }
};

exports.createReview = async(req, res, next) => {
    try {
        const review = await reviewService.create(req.user.id, req.body);
        res.status(201).json(review);
    } catch (err) {
        next(err);
    }
};

exports.updateReview = async(req, res, next) => {
    try {
        const review = await reviewService.update(
            req.user.id,
            req.params.id,
            req.body,
        );
        res.json(review);
    } catch (err) {
        next(err);
    }
};

exports.deleteReview = async(req, res, next) => {
    try {
        await reviewService.delete(req.user.id, req.params.id);
        res.json({ message: "Review deleted" });
    } catch (err) {
        next(err);
    }
};