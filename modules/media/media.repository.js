const { Media } = require("../../models");

exports.create = (data) => {
    return Media.create(data);
};

exports.findById = (id) => {
    return Media.findByPk(id);
};

exports.findByUser = (userId, { limit, offset }) => {
    return Media.findAndCountAll({
        where: { userId },
        limit,
        offset,
        order: [
            ["createdAt", "DESC"]
        ],
    });
};

exports.delete = (id) => {
    return Media.destroy({ where: { id } });
};