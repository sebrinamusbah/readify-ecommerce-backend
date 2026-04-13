exports.reviewDTO = (review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    user: review.User ?
        {
            id: review.User.id,
            name: review.User.name,
        } :
        null,
    createdAt: review.createdAt,
});