const { Notification } = require("../../models");

exports.create = (data) => {
    return Notification.create(data);
};

exports.findByUser = (userId, { limit, offset }) => {
    return Notification.findAndCountAll({
        where: { userId },
        limit,
        offset,
        order: [
            ["createdAt", "DESC"]
        ],
    });
};

exports.findById = (id) => {
    return Notification.findByPk(id);
};

exports.update = (id, data) => {
    return Notification.update(data, { where: { id } });
};

exports.delete = (id) => {
    return Notification.destroy({ where: { id } });
};