const { Category, Book } = require("../models");
const { Op } = require("sequelize");
const slugify = require("slugify");

class CategoryService {
  // Helper function to generate slug
  generateSlug(name) {
    return slugify(name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }

  // Get all categories with book counts
  async getAllCategories() {
    const categories = await Category.findAll({
      order: [["name", "ASC"]],
      attributes: ["id", "name", "slug", "description", "createdAt"],
    });

    // Get book count for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const bookCount = await Book.count({
          where: { categoryId: category.id },
        });

        return {
          ...category.toJSON(),
          bookCount,
        };
      })
    );

    return categoriesWithCounts;
  }

  // Get single category by ID
  async getCategoryById(id) {
    const category = await Category.findByPk(id, {
      include: [
        {
          model: Book,
          as: "books",
          attributes: ["id", "title", "author", "price", "coverImage", "stock"],
          limit: 10, // Limit books in response
        },
      ],
    });

    if (!category) {
      return null;
    }

    // Get total book count
    const bookCount = await Book.count({
      where: { categoryId: category.id },
    });

    const categoryData = category.toJSON();
    categoryData.bookCount = bookCount;

    return categoryData;
  }

  // Get category by slug
  async getCategoryBySlug(slug) {
    const category = await Category.findOne({
      where: { slug },
      include: [
        {
          model: Book,
          as: "books",
          attributes: [
            "id",
            "title",
            "author",
            "price",
            "coverImage",
            "stock",
            "isFeatured",
          ],
          order: [["createdAt", "DESC"]],
          limit: 20,
        },
      ],
    });

    if (!category) {
      return null;
    }

    // Get book count and featured books
    const bookCount = await Book.count({
      where: { categoryId: category.id },
    });

    const featuredBooks = await Book.findAll({
      where: {
        categoryId: category.id,
        isFeatured: true,
      },
      limit: 5,
      attributes: ["id", "title", "author", "price", "coverImage"],
    });

    const categoryData = category.toJSON();
    categoryData.bookCount = bookCount;
    categoryData.featuredBooks = featuredBooks;

    return categoryData;
  }

  // Create new category
  async createCategory({ name, description }) {
    // Generate slug
    const slug = this.generateSlug(name);

    // Check if category already exists
    const existingCategory = await Category.findOne({
      where: {
        [Op.or]: [
          {
            name: {
              [Op.iLike]: name,
            },
          },
          { slug: slug },
        ],
      },
    });

    if (existingCategory) {
      throw new Error("Category with this name or slug already exists");
    }

    // Create category
    const category = await Category.create({
      name,
      slug,
      description: description,
    });

    return category;
  }

  // Update category
  async updateCategory(id, { name, description }) {
    const category = await Category.findByPk(id);
    if (!category) {
      return null;
    }

    const updateData = {};

    // Update name if provided
    if (name !== undefined) {
      const newName = name;
      const newSlug = this.generateSlug(newName);

      // Check if new name/slug conflicts with existing category
      if (newName.toLowerCase() !== category.name.toLowerCase()) {
        const existingCategory = await Category.findOne({
          where: {
            [Op.or]: [
              {
                name: {
                  [Op.iLike]: newName,
                },
              },
              { slug: newSlug },
            ],
            id: {
              [Op.ne]: id,
            },
          },
        });

        if (existingCategory) {
          throw new Error(
            "Another category with this name or slug already exists"
          );
        }
      }

      updateData.name = newName;
      updateData.slug = newSlug;
    }

    // Update description if provided
    if (description !== undefined) {
      updateData.description = description;
    }

    // Update category
    await category.update(updateData);

    // Get updated category
    const updatedCategory = await Category.findByPk(id);
    return updatedCategory;
  }

  // Delete category
  async deleteCategory(id) {
    const category = await Category.findByPk(id);
    if (!category) {
      return { found: false, deleted: false, bookCount: 0 };
    }

    // Check if category has books
    const bookCount = await Book.count({
      where: { categoryId: id },
    });

    if (bookCount > 0) {
      return { found: true, deleted: false, bookCount };
    }

    await category.destroy();
    return { found: true, deleted: true, bookCount: 0 };
  }

  // Get categories summary (for sidebar/filter)
  async getCategoriesSummary() {
    const categories = await Category.findAll({
      attributes: ["id", "name", "slug"],
      order: [["name", "ASC"]],
    });

    // Get book counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const bookCount = await Book.count({
          where: { categoryId: category.id },
        });

        return {
          id: category.id,
          name: category.name,
          slug: category.slug,
          bookCount,
        };
      })
    );

    // Filter out categories with no books
    const activeCategories = categoriesWithCounts.filter(
      (cat) => cat.bookCount > 0
    );

    return activeCategories;
  }

  // Search categories
  async searchCategories(query) {
    const categories = await Category.findAll({
      where: {
        [Op.or]: [
          {
            name: {
              [Op.iLike]: `%${query}%`,
            },
          },
          {
            description: {
              [Op.iLike]: `%${query}%`,
            },
          },
        ],
      },
      include: [
        {
          model: Book,
          as: "books",
          attributes: [],
          required: false,
        },
      ],
      attributes: [
        "id",
        "name",
        "slug",
        "description",
        [
          Book.sequelize.fn("COUNT", Book.sequelize.col("books.id")),
          "bookCount",
        ],
      ],
      group: ["Category.id"],
      order: [["name", "ASC"]],
      limit: 10,
    });

    return categories;
  }

  // Bulk create categories
  async bulkCreateCategories(categories) {
    // Validate each category
    const validCategories = [];
    const errors = [];

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];

      if (!cat.name || cat.name.trim().length < 2) {
        errors.push(`Category ${i + 1}: Name must be at least 2 characters`);
        continue;
      }

      if (cat.name.length > 100) {
        errors.push(`Category ${i + 1}: Name cannot exceed 100 characters`);
        continue;
      }

      const slug = this.generateSlug(cat.name.trim());

      // Check for duplicates in the request
      const isDuplicate = validCategories.some(
        (validCat) =>
          validCat.name.toLowerCase() === cat.name.toLowerCase() ||
          validCat.slug === slug
      );

      if (isDuplicate) {
        errors.push(`Category ${i + 1}: Duplicate category name`);
        continue;
      }

      validCategories.push({
        name: cat.name.trim(),
        slug,
        description: cat.description ? cat.description.trim() : null,
      });
    }

    if (errors.length > 0) {
      return { errors, createdCategories: [] };
    }

    // Create categories
    const createdCategories = await Category.bulkCreate(validCategories, {
      returning: true,
    });

    return { errors: [], createdCategories };
  }

  // Helper: Get book count for category
  async getBookCount(categoryId) {
    return await Book.count({
      where: { categoryId },
    });
  }
}

module.exports = new CategoryService();
