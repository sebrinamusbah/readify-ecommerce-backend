const { Review } = require("../../models");

class ReviewRepository {
  findByBook(bookId) {
    return Review.findAll({ where: { bookId } });
  }

  findUserReview(userId, bookId) {
    return Review.findOne({ where: { userId, bookId } });
  }

  create(data) {
    return Review.create(data);
  }

  update(review, data) {
    return review.update(data);
  }

  delete(id, userId) {
    return Review.destroy({ where: { id, userId } });
  }
}

module.exports = new ReviewRepository();
