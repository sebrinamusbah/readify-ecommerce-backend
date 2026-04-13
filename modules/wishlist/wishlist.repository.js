const { Wishlist, Book } = require("../../models");

exports.findByUser = (userId) => {
    return Wishlist.findAll({
        where: { userId },
        include: [{ model: Book }],
        order: [
            ["createdAt", "DESC"]
        ],
    });
};

exports.findOne = (userId, bookId) => {
    return Wishlist.findOne({
        where: { userId, bookId },
    });
};

exports.create = (data) => {
    return Wishlist.create(data);
};

exports.delete = (userId, bookId) => {
    return Wishlist.destroy({
        where: { userId, bookId },
    });
};