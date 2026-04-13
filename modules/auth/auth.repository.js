const { User } = require("../../models");

exports.findByEmail = (email) => {
    return User.findOne({ where: { email } });
};

exports.findById = (id) => {
    return User.findByPk(id);
};

exports.createUser = (data) => {
    return User.create(data);
};