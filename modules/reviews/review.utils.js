exports.normalizeRating = (rating) => {
    return Math.max(1, Math.min(5, rating));
};