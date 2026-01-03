const categoryService = require("../services/categoryService");

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();

    res.json({
      success: true,
      count: categories.length,
      data: categories,
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
    const category = await categoryService.getCategoryById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    res.json({
      success: true,
      data: category,
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
    const category = await categoryService.getCategoryBySlug(slug);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    res.json({
      success: true,
      data: category,
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

    const category = await categoryService.createCategory({
      name: name.trim(),
      description: description ? description.trim() : null,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("[ERROR] Create category failed:", error);

    if (error.message === "Category with this name or slug already exists") {
      return res.status(409).json({
        success: false,
        error: error.message,
      });
    }

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

    // Validate name if provided
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
    }

    const category = await categoryService.updateCategory(id, {
      name: name ? name.trim() : undefined,
      description:
        description !== undefined
          ? description
            ? description.trim()
            : null
          : undefined,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("[ERROR] Update category failed:", error);

    if (
      error.message === "Another category with this name or slug already exists"
    ) {
      return res.status(409).json({
        success: false,
        error: error.message,
      });
    }

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

    const result = await categoryService.deleteCategory(id);

    if (!result.found) {
      return res.status(404).json({
        success: false,
        error: "Category not found",
      });
    }

    if (!result.deleted) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category. It has ${result.bookCount} book(s). Move or delete the books first.`,
      });
    }

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
    const categories = await categoryService.getCategoriesSummary();

    res.json({
      success: true,
      count: categories.length,
      data: categories,
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

    const result = await categoryService.searchCategories(q);

    res.json({
      success: true,
      query: q,
      count: result.length,
      data: result,
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

    const result = await categoryService.bulkCreateCategories(categories);

    if (result.errors && result.errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: result.errors,
        message: "Some categories have validation errors",
      });
    }

    res.status(201).json({
      success: true,
      message: `${result.createdCategories.length} categories created successfully`,
      data: result.createdCategories,
    });
  } catch (error) {
    console.error("[ERROR] Bulk create categories failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create categories",
    });
  }
};
