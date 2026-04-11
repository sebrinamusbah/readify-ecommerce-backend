// controllers/categoryController.js
const { Category, Book, sequelize } = require("../models");
const { Op } = require("sequelize");
const slugify = require("slugify");

// ==========================
// Helper: Generate slug
// ==========================
const generateSlug = (name) => {
    return slugify(name, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g,
    });
};

// ==========================
// RESPONSE HELPER (optional but clean)
// ==========================
const sendResponse = (res, statusCode, success, message, data = null) => {
    return res.status(statusCode).json({
        success,
        message,
        data,
    });
};

// ==========================
// GET ALL CATEGORIES (OPTIMIZED)
// ==========================
exports.getAllCategories = async(req, res) => {
    try {
        const categories = await Category.findAll({
            attributes: [
                "id",
                "name",
                "slug",
                "description",
                "createdAt", [
                    sequelize.fn("COUNT", sequelize.col("books.id")),
                    "bookCount",
                ],
            ],
            include: [{
                model: Book,
                as: "books",
                attributes: [],
                required: false,
            }, ],
            group: ["Category.id"],
            order: [
                ["name", "ASC"]
            ],
        });

        return sendResponse(
            res,
            200,
            true,
            "Categories fetched successfully",
            categories
        );
    } catch (error) {
        console.error("[GET CATEGORIES ERROR]", error);
        return sendResponse(res, 500, false, "Failed to fetch categories");
    }
};

// ==========================
// GET CATEGORY BY ID
// ==========================
exports.getCategoryById = async(req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id, {
            include: [{
                model: Book,
                as: "books",
                attributes: ["id", "title", "author", "price", "coverImage", "stock"],
            }, ],
        });

        if (!category) {
            return sendResponse(res, 404, false, "Category not found");
        }

        const bookCount = await Book.count({
            where: { categoryId: id },
        });

        const result = {
            ...category.toJSON(),
            bookCount,
        };

        return sendResponse(res, 200, true, "Category fetched successfully", result);
    } catch (error) {
        console.error("[GET CATEGORY BY ID ERROR]", error);
        return sendResponse(res, 500, false, "Failed to fetch category");
    }
};

// ==========================
// GET CATEGORY BY SLUG
// ==========================
exports.getCategoryBySlug = async(req, res) => {
    try {
        const { slug } = req.params;

        const category = await Category.findOne({
            where: { slug },
            include: [{
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
                limit: 20,
                order: [
                    ["createdAt", "DESC"]
                ],
            }, ],
        });

        if (!category) {
            return sendResponse(res, 404, false, "Category not found");
        }

        const bookCount = await Book.count({
            where: { categoryId: category.id },
        });

        const featuredBooks = await Book.findAll({
            where: {
                categoryId: category.id,
                isFeatured: true,
            },
            limit: 5,
        });

        const result = {
            ...category.toJSON(),
            bookCount,
            featuredBooks,
        };

        return sendResponse(res, 200, true, "Category fetched successfully", result);
    } catch (error) {
        console.error("[GET CATEGORY SLUG ERROR]", error);
        return sendResponse(res, 500, false, "Failed to fetch category");
    }
};

// ==========================
// CREATE CATEGORY (ADMIN)
// ==========================
exports.createCategory = async(req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || name.trim().length < 2) {
            return sendResponse(
                res,
                400,
                false,
                "Category name must be at least 2 characters"
            );
        }

        const slug = generateSlug(name);

        const existing = await Category.findOne({
            where: {
                [Op.or]: [{ name }, { slug }],
            },
        });

        if (existing) {
            return sendResponse(res, 409, false, "Category already exists");
        }

        const category = await Category.create({
            name: name.trim(),
            slug,
            description: description ? .trim() || null,
        });

        return sendResponse(
            res,
            201,
            true,
            "Category created successfully",
            category
        );
    } catch (error) {
        console.error("[CREATE CATEGORY ERROR]", error);
        return sendResponse(res, 500, false, "Failed to create category");
    }
};

// ==========================
// UPDATE CATEGORY (ADMIN)
// ==========================
exports.updateCategory = async(req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const category = await Category.findByPk(id);
        if (!category) {
            return sendResponse(res, 404, false, "Category not found");
        }

        let updateData = {};

        if (name) {
            const slug = generateSlug(name);

            const exists = await Category.findOne({
                where: {
                    id: {
                        [Op.ne]: id },
                    [Op.or]: [{ name }, { slug }],
                },
            });

            if (exists) {
                return sendResponse(res, 409, false, "Category already exists");
            }

            updateData.name = name.trim();
            updateData.slug = slug;
        }

        if (description !== undefined) {
            updateData.description = description ? .trim() || null;
        }

        await category.update(updateData);

        return sendResponse(
            res,
            200,
            true,
            "Category updated successfully",
            category
        );
    } catch (error) {
        console.error("[UPDATE CATEGORY ERROR]", error);
        return sendResponse(res, 500, false, "Failed to update category");
    }
};

// ==========================
// DELETE CATEGORY (ADMIN)
// ==========================
exports.deleteCategory = async(req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id);
        if (!category) {
            return sendResponse(res, 404, false, "Category not found");
        }

        const bookCount = await Book.count({
            where: { categoryId: id },
        });

        if (bookCount > 0) {
            return sendResponse(
                res,
                400,
                false,
                `Cannot delete category. It has ${bookCount} books.`
            );
        }

        await category.destroy();

        return sendResponse(res, 200, true, "Category deleted successfully");
    } catch (error) {
        console.error("[DELETE CATEGORY ERROR]", error);
        return sendResponse(res, 500, false, "Failed to delete category");
    }
};

// ==========================
// CATEGORY SUMMARY (FAST FILTER UI)
// ==========================
exports.getCategoriesSummary = async(req, res) => {
    try {
        const categories = await Category.findAll({
            attributes: ["id", "name", "slug"],
        });

        const result = await Promise.all(
            categories.map(async(cat) => {
                const count = await Book.count({
                    where: { categoryId: cat.id },
                });

                return {
                    ...cat.toJSON(),
                    bookCount: count,
                };
            })
        );

        const active = result.filter((c) => c.bookCount > 0);

        return sendResponse(
            res,
            200,
            true,
            "Category summary fetched",
            active
        );
    } catch (error) {
        console.error("[SUMMARY ERROR]", error);
        return sendResponse(res, 500, false, "Failed to fetch summary");
    }
};

// ==========================
// SEARCH CATEGORIES
// ==========================
exports.searchCategories = async(req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return sendResponse(res, 400, false, "Search query too short");
        }

        const categories = await Category.findAll({
            where: {
                name: {
                    [Op.like]: `%${q}%`,
                },
            },
            limit: 10,
        });

        return sendResponse(
            res,
            200,
            true,
            "Search results",
            categories
        );
    } catch (error) {
        console.error("[SEARCH ERROR]", error);
        return sendResponse(res, 500, false, "Search failed");
    }
};

// ==========================
// BULK CREATE (ADMIN)
// ==========================
exports.bulkCreateCategories = async(req, res) => {
    try {
        const { categories } = req.body;

        if (!Array.isArray(categories)) {
            return sendResponse(res, 400, false, "Invalid input");
        }

        const data = categories.map((c) => ({
            name: c.name.trim(),
            slug: generateSlug(c.name),
            description: c.description || null,
        }));

        const created = await Category.bulkCreate(data);

        return sendResponse(
            res,
            201,
            true,
            "Categories created",
            created
        );
    } catch (error) {
        console.error("[BULK ERROR]", error);
        return sendResponse(res, 500, false, "Bulk create failed");
    }
};