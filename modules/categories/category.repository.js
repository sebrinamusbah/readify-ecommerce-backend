const { Category } = require("../../models");

exports.findAll = () => {
    return Category.findAll({
        order: [
            ["createdAt", "ASC"]
        ],
    });
};

exports.findById = (id) => {
    return Category.findByPk(id);
};

exports.create = (data) => {
    return Category.create(data);
};

exports.update = async(id, data) => {
    await Category.update(data, { where: { id } });
    return this.findById(id);
};

exports.delete = (id) => {
    return Category.destroy({ where: { id } });
};