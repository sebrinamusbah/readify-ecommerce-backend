module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Orders", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            total: Sequelize.FLOAT,
            status: { type: Sequelize.STRING, defaultValue: "pending" },
            userId: {
                type: Sequelize.INTEGER,
                references: { model: "Users", key: "id" },
            },
            couponId: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: { model: "Coupons", key: "id" },
            },
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable("Orders");
    },
};