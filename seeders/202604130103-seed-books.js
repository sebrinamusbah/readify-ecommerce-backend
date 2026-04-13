"use strict";

module.exports = {
    async up(queryInterface) {
        await queryInterface.bulkInsert("Books", [{
                title: "Clean Code",
                author: "Robert C. Martin",
                price: 30,
                description: "Software craftsmanship",
                stock: 50,
                categoryId: 3,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                title: "Atomic Habits",
                author: "James Clear",
                price: 20,
                description: "Self improvement",
                stock: 40,
                categoryId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("Books", null, {});
    },
};