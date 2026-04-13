module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("OrderItems", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            quantity: Sequelize.INTEGER,
            price: Sequelize.FLOAT,
            orderId: {
                type: Sequelize.INTEGER,
                references: { model: "Orders", key: "id" },
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
        await queryInterface.dropTable("OrderItems");
    },
};