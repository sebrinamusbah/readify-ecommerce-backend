module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Carts", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            userId: {
                type: Sequelize.INTEGER,
                references: { model: "Users", key: "id" },
            },
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable("Carts");
    },
};