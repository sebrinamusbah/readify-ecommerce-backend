const { User } = require("../../models");

class UserRepository {
  findByEmail(email) {
    return User.findOne({ where: { email } });
  }

  findById(id) {
    return User.findByPk(id);
  }

  create(data) {
    return User.create(data);
  }

  update(user, data) {
    return user.update(data);
  }

  list() {
    return User.findAll({ attributes: { exclude: ["password"] } });
  }
}

module.exports = new UserRepository();
