const { Op } = require("sequelize");
const { Book, Category } = require("../../models");

exports.findAll = async({
    limit,
    offset,
    search,
    category,
    minPrice,
    maxPrice,
}) => {
    const where = {};

    if (search) {
        where[Op.or] = [
            { title: {
                    [Op.iLike]: `%${search}%` } },
            { author: {
                    [Op.iLike]: `%${search}%` } },
        ];
    }

    if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price[Op.gte] = minPrice;
        if (maxPrice) where.price[Op.lte] = maxPrice;
    }

    return Book.findAndCountAll({
        where,
        include: category ?
            [{
                model: Category,
                where: { name: category },
            }, ] :
            [{ model: Category }],
        limit,
        offset,
        order: [
            ["createdAt", "DESC"]
        ],
    });
};

exports.findById = (id) => {
    return Book.findByPk(id, {
        include: [{ model: Category }],
    });
};

exports.create = (data) => {
    return Book.create(data);
};

exports.update = async(id, data) => {
    await Book.update(data, { where: { id } });
    return this.findById(id);
};

exports.delete = (id) => {
    return Book.destroy({ where: { id } });
};