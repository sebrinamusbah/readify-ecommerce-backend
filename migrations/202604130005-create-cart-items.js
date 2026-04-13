module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("CartItems", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            quantity: Sequelize.INTEGER,
            cartId: {
                type: Sequelize.INTEGER,
                references: { model: "Carts", key: "id" },
            },
            bookId: {
                type: Sequelize.INTEGER,
                references: { model: "Books", key: "id" },
            },
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable("CartItems");
    },
};