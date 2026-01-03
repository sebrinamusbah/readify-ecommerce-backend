// controllers/categoryController.js
const { Category, Book } = require("../models");
const { Op } = require("sequelize");
const slugify = require("slugify");

// Helper function to generate slug
const generateSlug = (name) => {
  return slugify(name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res) => {
  try {
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

    res.json({
      success: true,
      count: categories.length,
      data: categoriesWithCounts,
    });
  } catch (error) {
    console.error("[ERROR] Get all categories failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
    });
  }
};

// @desc    Get single category by ID
// @route   GET /api/categories/:id
// @access  Public
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

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
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    // Get total book count
    const bookCount = await Book.count({
      where: { categoryId: category.id },
    });

    const categoryData = category.toJSON();
    categoryData.bookCount = bookCount;

    res.json({
      success: true,
      data: categoryData,
    });
  } catch (error) {
    console.error("[ERROR] Get category by ID failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch category",
    });
  }
};

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
exports.getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

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
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
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

    res.json({
      success: true,
      data: categoryData,
    });
  } catch (error) {
    console.error("[ERROR] Get category by slug failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch category",
    });
  }
};

// @desc    Create new category (Admin only)
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate input
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Category name must be at least 2 characters",
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        error: "Category name cannot exceed 100 characters",
      });
    }

    // Generate slug
    const slug = generateSlug(name.trim());

    // Check if category already exists
    const existingCategory = await Category.findOne({
      where: {
        [Op.or]: [
          {
            name: {
              [Op.iLike]: name.trim(),
            },
          },
          { slug: slug },
        ],
      },
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        error: "Category with this name or slug already exists",
      });
    }

    // Create category
    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description ? description.trim() : null,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("[ERROR] Create category failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create category",
    });
  }
};

// @desc    Update category (Admin only)
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    const updateData = {};

    // Update name if provided
    if (name !== undefined) {
      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: "Category name must be at least 2 characters",
        });
      }

      if (name.length > 100) {
        return res.status(400).json({
          success: false,
          error: "Category name cannot exceed 100 characters",
        });
      }

      const newName = name.trim();
      const newSlug = generateSlug(newName);

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
          return res.status(409).json({
            success: false,
            error: "Another category with this name or slug already exists",
          });
        }
      }

      updateData.name = newName;
      updateData.slug = newSlug;
    }

    // Update description if provided
    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }

    // Update category
    await category.update(updateData);

    // Get updated category
    const updatedCategory = await Category.findByPk(id);

    res.json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("[ERROR] Update category failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update category",
    });
  }
};

// @desc    Delete category (Admin only)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    // Check if category has books
    const bookCount = await Book.count({
      where: { categoryId: id },
    });

    if (bookCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category. It has ${bookCount} book(s). Move or delete the books first.`,
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("[ERROR] Delete category failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete category",
    });
  }
};

// @desc    Get categories with book counts (for sidebar/filter)
// @route   GET /api/categories/summary
// @access  Public
exports.getCategoriesSummary = async (req, res) => {
  try {
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

    // Filter out categories with no books (optional)
    const activeCategories = categoriesWithCounts.filter(
      (cat) => cat.bookCount > 0
    );

    res.json({
      success: true,
      count: activeCategories.length,
      data: activeCategories,
    });
  } catch (error) {
    console.error("[ERROR] Get categories summary failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories summary",
    });
  }
};

// @desc    Search categories
// @route   GET /api/categories/search
// @access  Public
exports.searchCategories = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Search query must be at least 2 characters",
      });
    }

    const categories = await Category.findAll({
      where: {
        [Op.or]: [
          {
            name: {
              [Op.iLike]: `%${q}%`,
            },
          },
          {
            description: {
              [Op.iLike]: `%${q}%`,
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

    res.json({
      success: true,
      query: q,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("[ERROR] Search categories failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search categories",
    });
  }
};

// @desc    Bulk create categories (Admin only)
// @route   POST /api/categories/bulk
// @access  Private/Admin
exports.bulkCreateCategories = async (req, res) => {
  try {
    const { categories } = req.body; // Array of { name, description }

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Categories array is required",
      });
    }

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

      const slug = generateSlug(cat.name.trim());

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
      return res.status(400).json({
        success: false,
        errors,
        message: "Some categories have validation errors",
      });
    }

    // Create categories
    const createdCategories = await Category.bulkCreate(validCategories, {
      returning: true,
    });

    res.status(201).json({
      success: true,
      message: `${createdCategories.length} categories created successfully`,
      data: createdCategories,
    });
  } catch (error) {
    console.error("[ERROR] Bulk create categories failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create categories",
    });
  }
};
