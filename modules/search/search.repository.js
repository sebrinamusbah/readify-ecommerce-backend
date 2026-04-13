const { Op } = require("sequelize");
const { Book, Category } = require("../../models");

exports.searchBooks = ({ q, category, minPrice, maxPrice, limit, offset }) => {
    const where = {};

    // TEXT SEARCH 🔥
    if (q) {
        where[Op.or] = [
            { title: {
                    [Op.iLike]: `%${q}%` } },
            { author: {
                    [Op.iLike]: `%${q}%` } },
            { description: {
                    [Op.iLike]: `%${q}%` } },
        ];
    }

    // PRICE FILTER
    if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price[Op.gte] = minPrice;
        if (maxPrice) where.price[Op.lte] = maxPrice;
    }

    return Book.findAndCountAll({
        where,
        include: category ?
            [{ model: Category, where: { name: category } }] :
            [{ model: Category }],
        limit,
        offset,
        order: [
            ["createdAt", "DESC"]
        ],
    });
};