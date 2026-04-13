"use strict";

const bcrypt = require("bcrypt");

module.exports = {
    async up(queryInterface) {
        const password = await bcrypt.hash("password123", 10);

        await queryInterface.bulkInsert("Users", [{
                name: "Admin User",
                email: "admin@example.com",
                password,
                role: "admin",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                name: "Test User",
                email: "user@example.com",
                password,
                role: "user",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("Users", null, {});
    },
};