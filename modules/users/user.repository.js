const { User } = require("../../models");

exports.findById = (id) => {
    return User.findByPk(id);
};

exports.findAll = ({ limit, offset }) => {
    return User.findAll({
        limit,
        offset,
        order: [
            ["createdAt", "DESC"]
        ],
    });
};

exports.update = async(id, data) => {
    await User.update(data, { where: { id } });
    return this.findById(id);
};

exports.delete = (id) => {
    return User.destroy({ where: { id } });
};