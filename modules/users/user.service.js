const bcrypt = require("bcrypt");
const userRepo = require("./user.repository");
const { NotFoundError } = require("../../shared/errors");
const { userDTO } = require("./user.dto");

exports.getById = async(id) => {
    const user = await userRepo.findById(id);
    if (!user) throw new NotFoundError("User not found");
    return userDTO(user);
};

exports.getAll = async(query) => {
    const { page = 1, limit = 10 } = query;

    const offset = (page - 1) * limit;

    const users = await userRepo.findAll({ limit, offset });

    return users.map(userDTO);
};

exports.update = async(id, data) => {
    const user = await userRepo.findById(id);
    if (!user) throw new NotFoundError("User not found");

    if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
    }

    const updated = await userRepo.update(id, data);

    return userDTO(updated);
};

exports.delete = async(id) => {
    const user = await userRepo.findById(id);
    if (!user) throw new NotFoundError("User not found");

    await userRepo.delete(id);
};