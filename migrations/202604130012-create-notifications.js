module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Notifications", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            message: Sequelize.STRING,
            type: Sequelize.STRING,
            isRead: { type: Sequelize.BOOLEAN, defaultValue: false },
            userId: {
                type: Sequelize.INTEGER,
                references: { model: "Users", key: "id" },
            },
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable("Notifications");
    },
};