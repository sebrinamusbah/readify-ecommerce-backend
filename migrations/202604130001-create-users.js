module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("Users", {
            id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
            name: Sequelize.STRING,
            email: { type: Sequelize.STRING, unique: true },
            password: Sequelize.STRING,
            role: { type: Sequelize.STRING, defaultValue: "user" },
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("Users");
    },
};