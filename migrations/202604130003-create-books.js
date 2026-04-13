module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Books", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            title: Sequelize.STRING,
            author: Sequelize.STRING,
            price: Sequelize.FLOAT,
            description: Sequelize.TEXT,
            stock: Sequelize.INTEGER,
            categoryId: {
                type: Sequelize.INTEGER,
                references: { model: "Categories", key: "id" },
            },
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("Books");
    },
};