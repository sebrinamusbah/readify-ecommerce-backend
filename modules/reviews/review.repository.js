const { Review, User } = require("../../models");
const { fn, col } = require("sequelize");

exports.findByBook = (bookId, { limit, offset }) => {
    return Review.findAndCountAll({
        where: { bookId },
        include: [{ model: User, attributes: ["id", "name"] }],
        limit,
        offset,
        order: [
            ["createdAt", "DESC"]
        ],
    });
};

exports.findByUserAndBook = (userId, bookId) => {
    return Review.findOne({ where: { userId, bookId } });
};

exports.findById = (id) => {
    return Review.findByPk(id);
};

exports.create = (data) => {
    return Review.create(data);
};

exports.update = async(id, data) => {
    await Review.update(data, { where: { id } });
    return this.findById(id);
};

exports.delete = (id) => {
    return Review.destroy({ where: { id } });
};

exports.getBookRatingStats = async(bookId) => {
    const result = await Review.findOne({
        where: { bookId },
        attributes: [
            [fn("AVG", col("rating")), "avg"],
            [fn("COUNT", col("id")), "count"],
        ],
        raw: true,
    });

    return {
        avg: parseFloat(result.avg),
        count: parseInt(result.count),
    };
};