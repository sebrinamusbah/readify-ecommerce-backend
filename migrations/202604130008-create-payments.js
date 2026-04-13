module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Payments", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            amount: Sequelize.FLOAT,
            status: Sequelize.STRING,
            method: Sequelize.STRING,
            orderId: {
                type: Sequelize.INTEGER,
                references: { model: "Orders", key: "id" },
            },
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable("Payments");
    },
};