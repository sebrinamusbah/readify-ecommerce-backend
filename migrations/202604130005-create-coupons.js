module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("coupons", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      value: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },

      expiryDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      usageLimit: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      usedCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },

      minOrderAmount: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },

      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("coupons");
  },
};
