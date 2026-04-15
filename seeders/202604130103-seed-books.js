"use strict";

module.exports = {
  async up(queryInterface) {
    const [categories] = await queryInterface.sequelize.query(
      `SELECT id, name FROM categories;`,
    );

    if (!categories || categories.length === 0) {
      throw new Error("No categories found. Seed categories first.");
    }

    const fiction = categories.find((c) => c.name === "Fiction");
    const science = categories.find((c) => c.name === "Science");

    if (!fiction || !science) {
      throw new Error("Required categories missing (Fiction / Science)");
    }

    await queryInterface.bulkInsert("books", [
      {
        title: "Clean Code",
        author: "Robert C. Martin",
        price: 30,
        description: "Software craftsmanship",
        stock: 50,
        categoryId: science.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: "Atomic Habits",
        author: "James Clear",
        price: 20,
        description: "Self improvement",
        stock: 40,
        categoryId: fiction.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("books", null, {});
  },
};
