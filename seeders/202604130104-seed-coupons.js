"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("coupons", [
      {
        code: "WELCOME10",
        type: "PERCENTAGE",
        value: 10,
        expiryDate: new Date("2026-12-31"),
        isActive: true,
        usageLimit: 100,
        usedCount: 0,
        minOrderAmount: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        code: "FLAT5",
        type: "FIXED",
        value: 5,
        expiryDate: new Date("2026-12-31"),
        isActive: true,
        usageLimit: 50,
        usedCount: 0,
        minOrderAmount: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("coupons", null, {});
  },
};
