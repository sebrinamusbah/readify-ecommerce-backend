module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("orders", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },

      total: Sequelize.FLOAT,

      status: {
        type: Sequelize.STRING,
        defaultValue: "pending",
      },

      userId: {
        type: Sequelize.INTEGER,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },

      couponId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "coupons", key: "id" },
        onDelete: "SET NULL",
      },

      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("orders");
  },
};
