module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Coupons", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            code: { type: Sequelize.STRING, unique: true },
            type: Sequelize.STRING,
            value: Sequelize.FLOAT,
            expiryDate: Sequelize.DATE,
            isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
            usageLimit: Sequelize.INTEGER,
            usedCount: { type: Sequelize.INTEGER, defaultValue: 0 },
            minOrderAmount: Sequelize.FLOAT,
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable("Coupons");
    },
};