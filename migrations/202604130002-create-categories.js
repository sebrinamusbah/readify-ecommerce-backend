module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Categories", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            name: Sequelize.STRING,
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("Categories");
    },
};