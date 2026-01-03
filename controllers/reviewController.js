const reviewService = require("../services/reviewService");

// @desc    Get reviews for a book
// @route   GET /api/books/:bookId/reviews
// @access  Public
exports.getBookReviews = async (req, res) => {
  try {
    const { bookId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { rating, sort } = req.query;

    const result = await reviewService.getBookReviews(bookId, {
      page,
      limit,
      rating,
      sort,
    });

    if (!result.book) {
      return res.status(404).json({
        success: false,
        error: "Book not found",
      });
    }

    res.json({
      success: true,
      book: result.book,
      ratingStats: result.ratingStats,
      count: result.count,
      pagination: result.pagination,
      filters: result.filters,
      data: result.reviews,
    });
  } catch (error) {
    console.error("[ERROR] Get book reviews failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch reviews",
    });
  }
};

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await reviewService.getReviewById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: "Review not found",
      });
    }

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error("[ERROR] Get review by ID failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch review",
    });
  }
};

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId, rating, comment, title } = req.body;

    // Validation
    if (!bookId) {
      return res.status(400).json({
        success: false,
        error: "Book ID is required",
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 5",
      });
    }

    if (comment && comment.length > 2000) {
      return res.status(400).json({
        success: false,
        error: "Comment cannot exceed 2000 characters",
      });
    }

    if (title && title.length > 200) {
      return res.status(400).json({
        success: false,
        error: "Title cannot exceed 200 characters",
      });
    }

    const review = await reviewService.createReview({
      userId,
      bookId,
      rating: parseInt(rating),
      comment: comment ? comment.trim() : null,
      title: title ? title.trim() : null,
      userRole: req.user.role,
    });

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: review,
    });
  } catch (error) {
    console.error("[ERROR] Create review failed:", error);

    if (error.message === "Book not found") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (
      error.message === "You must purchase the book before reviewing it" ||
      error.message === "You have already reviewed this book"
    ) {
      const statusCode = error.message.includes("already") ? 409 : 403;
      return res.status(statusCode).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to submit review",
    });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { rating, comment, title } = req.body;

    // Validation
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 5",
      });
    }

    if (comment && comment.length > 2000) {
      return res.status(400).json({
        success: false,
        error: "Comment cannot exceed 2000 characters",
      });
    }

    if (title && title.length > 200) {
      return res.status(400).json({
        success: false,
        error: "Title cannot exceed 200 characters",
      });
    }

    const review = await reviewService.updateReview(id, userId, {
      rating: rating !== undefined ? parseInt(rating) : undefined,
      comment: comment !== undefined ? comment.trim() : undefined,
      title: title !== undefined ? title.trim() : undefined,
      userRole: req.user.role,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: "Review not found or you are not authorized to edit it",
      });
    }

    if (review === "time_expired") {
      return res.status(403).json({
        success: false,
        error: "Reviews can only be edited within 30 days of submission",
      });
    }

    res.json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  } catch (error) {
    console.error("[ERROR] Update review failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update review",
    });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await reviewService.deleteReview(id, userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Review not found or you are not authorized to delete it",
      });
    }

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("[ERROR] Delete review failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete review",
    });
  }
};

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
exports.markAsHelpful = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await reviewService.markAsHelpful(id, userId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Review not found",
      });
    }

    res.json({
      success: true,
      message: "Marked as helpful",
      data: {
        helpfulCount: result.helpfulCount,
      },
    });
  } catch (error) {
    console.error("[ERROR] Mark as helpful failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark as helpful",
    });
  }
};

// @desc    Report a review
// @route   POST /api/reviews/:id/report
// @access  Private
exports.reportReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: "Please provide a reason (minimum 10 characters)",
      });
    }

    const result = await reviewService.reportReview(id, userId, reason.trim());

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Review not found",
      });
    }

    res.json({
      success: true,
      message: "Review reported. Our team will review it shortly.",
    });
  } catch (error) {
    console.error("[ERROR] Report review failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to report review",
    });
  }
};

// @desc    Get user's reviews
// @route   GET /api/users/me/reviews
// @access  Private
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await reviewService.getUserReviews(userId, {
      page,
      limit,
    });

    res.json({
      success: true,
      count: result.count,
      pagination: result.pagination,
      data: result.reviews,
    });
  } catch (error) {
    console.error("[ERROR] Get user reviews failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch your reviews",
    });
  }
};

// @desc    Get recent reviews
// @route   GET /api/reviews/recent
// @access  Public
exports.getRecentReviews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const reviews = await reviewService.getRecentReviews(limit);

    res.json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error("[ERROR] Get recent reviews failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recent reviews",
    });
  }
};

// @desc    Get top rated books
// @route   GET /api/reviews/top-rated
// @access  Public
exports.getTopRatedBooks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const books = await reviewService.getTopRatedBooks(limit);

    res.json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error("[ERROR] Get top rated books failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch top rated books",
    });
  }
};

// ==================== ADMIN FUNCTIONS ====================

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews/admin/all
// @access  Private/Admin
exports.getAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { status, bookId, userId, rating } = req.query;

    const result = await reviewService.getAllReviews({
      page,
      limit,
      status,
      bookId,
      userId,
      rating,
    });

    res.json({
      success: true,
      count: result.count,
      pagination: result.pagination,
      filters: result.filters,
      data: result.reviews,
    });
  } catch (error) {
    console.error("[ERROR] Get all reviews failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch reviews",
    });
  }
};

// @desc    Delete review (Admin)
// @route   DELETE /api/reviews/admin/:id
// @access  Private/Admin
exports.deleteReviewAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await reviewService.deleteReviewAdmin(
      id,
      reason,
      req.user.id
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Review not found",
      });
    }

    res.json({
      success: true,
      message: "Review deleted by admin",
    });
  } catch (error) {
    console.error("[ERROR] Admin delete review failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete review",
    });
  }
};

// @desc    Clear reported flags (Admin)
// @route   PUT /api/reviews/admin/:id/clear-reports
// @access  Private/Admin
exports.clearReports = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await reviewService.clearReports(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: "Review not found",
      });
    }

    res.json({
      success: true,
      message: "Report flags cleared",
      data: review,
    });
  } catch (error) {
    console.error("[ERROR] Clear reports failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear reports",
    });
  }
};
