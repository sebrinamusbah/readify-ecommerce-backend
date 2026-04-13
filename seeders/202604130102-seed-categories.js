"use strict";

module.exports = {
    async up(queryInterface) {
        await queryInterface.bulkInsert("Categories", [
            { name: "Fiction", createdAt: new Date(), updatedAt: new Date() },
            { name: "Science", createdAt: new Date(), updatedAt: new Date() },
            { name: "Technology", createdAt: new Date(), updatedAt: new Date() },
            { name: "History", createdAt: new Date(), updatedAt: new Date() },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("Categories", null, {});
    },
};