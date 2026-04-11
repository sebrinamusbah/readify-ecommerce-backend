const {
    Book,
    Category,
    User,
    Order,
    OrderItem
} = require("../models");

const { Op } = require("sequelize");
const cloudinary = require("../config/cloudinary");

// ================= HELPER =================
const toBool = (val) => val === true || val === "true";

const uploadToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: "books" },
            (err, result) => {
                if (err) return reject(err);
                resolve(result);
            }
        );
        stream.end(buffer);
    });
};

// ==================== BOOK ====================

// CREATE BOOK
exports.addBook = async(req, res) => {
    try {
        const {
            title,
            author,
            description,
            price,
            stock,
            categoryId,
            isbn,
            pages,
            language,
            publishedDate,
            isFeatured,
        } = req.body;

        if (!title || !author || !price || !categoryId) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (isNaN(price) || price < 0) {
            return res.status(400).json({ error: "Invalid price" });
        }

        const category = await Category.findByPk(categoryId);
        if (!category) {
            return res.status(400).json({ error: "Category not found" });
        }

        if (isbn) {
            const exists = await Book.findOne({ where: { isbn } });
            if (exists) {
                return res.status(400).json({ error: "ISBN already exists" });
            }
        }

        let imageUrl =
            "https://via.placeholder.com/300x400/4A90E2/FFFFFF?text=Book+Cover";

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            imageUrl = result.secure_url;
        }

        const book = await Book.create({
            title,
            author,
            description,
            price: Number(price),
            stock: stock ? Number(stock) : 0,
            categoryId,
            isbn,
            pages: pages ? Number(pages) : null,
            language: language || "English",
            publishedDate: publishedDate || null,
            isFeatured: toBool(isFeatured),
            coverImage: imageUrl,
        });

        res.status(201).json({ success: true, data: book });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Create book failed" });
    }
};

// UPDATE BOOK
exports.updateBook = async(req, res) => {
    try {
        const book = await Book.findByPk(req.params.id);

        if (!book) {
            return res.status(404).json({ error: "Book not found" });
        }

        let imageUrl = book.coverImage;

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            imageUrl = result.secure_url;
        }

        await book.update({
            ...req.body,
            coverImage: imageUrl,
            price: req.body.price ? Number(req.body.price) : book.price,
            stock: req.body.stock ? Number(req.body.stock) : book.stock,
            pages: req.body.pages ? Number(req.body.pages) : book.pages,
            isFeatured: req.body.isFeatured !== undefined ?
                toBool(req.body.isFeatured) :
                book.isFeatured,
        });

        res.json({ success: true, data: book });

    } catch (err) {
        res.status(500).json({ error: "Update failed" });
    }
};

// DELETE BOOK (WITH TRANSACTION)
exports.deleteBook = async(req, res) => {
    const t = await Book.sequelize.transaction();

    try {
        const book = await Book.findByPk(req.params.id, { transaction: t });

        if (!book) {
            await t.rollback();
            return res.status(404).json({ error: "Book not found" });
        }

        const count = await OrderItem.count({
            where: { bookId: book.id },
            transaction: t,
        });

        if (count > 0) {
            await t.rollback();
            return res.status(400).json({
                error: "Cannot delete book with orders",
            });
        }

        await book.destroy({ transaction: t });

        await t.commit();

        res.json({ success: true });

    } catch (err) {
        await t.rollback();
        res.status(500).json({ error: "Delete failed" });
    }
};

// UPDATE STOCK
exports.updateStock = async(req, res) => {
    try {
        const { quantity, action } = req.body;

        if (!quantity || isNaN(quantity)) {
            return res.status(400).json({ error: "Invalid quantity" });
        }

        const book = await Book.findByPk(req.params.id);
        if (!book) {
            return res.status(404).json({ error: "Book not found" });
        }

        let newStock = book.stock;

        if (action === "add") newStock += Number(quantity);
        else if (action === "subtract") newStock -= Number(quantity);
        else newStock = Number(quantity);

        if (newStock < 0) {
            return res.status(400).json({ error: "Stock cannot be negative" });
        }

        await book.update({ stock: newStock });

        res.json({ success: true, stock: newStock });

    } catch (err) {
        res.status(500).json({ error: "Stock update failed" });
    }
};

// ==================== CATEGORY ====================

exports.addCategory = async(req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) return res.status(400).json({ error: "Name required" });

        const exists = await Category.findOne({
            where: { name: {
                    [Op.iLike]: name } },
        });

        if (exists) {
            return res.status(400).json({ error: "Category exists" });
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

        const category = await Category.create({
            name,
            slug,
            description,
        });

        res.status(201).json({ success: true, data: category });

    } catch (err) {
        res.status(500).json({ error: "Create category failed" });
    }
};

// ==================== ORDER ====================

exports.getAllOrders = async(req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                { model: User, as: "user", attributes: ["id", "name"] },
                {
                    model: OrderItem,
                    as: "orderItems",
                    include: [{ model: Book, as: "book" }],
                },
            ],
            order: [
                ["createdAt", "DESC"]
            ],
        });

        res.json({ success: true, data: orders });

    } catch (err) {
        res.status(500).json({ error: "Fetch orders failed" });
    }
};

// ==================== USERS ====================

exports.getAllUsers = async(req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ["password"] },
            order: [
                ["createdAt", "DESC"]
            ],
        });

        res.json({ success: true, data: users });

    } catch (err) {
        res.status(500).json({ error: "Fetch users failed" });
    }
};

// ==================== DASHBOARD ====================

exports.getDashboardStats = async(req, res) => {
    try {
        const totalBooks = await Book.count();
        const totalUsers = await User.count();
        const totalOrders = await Order.count();
        const totalCategories = await Category.count();

        const revenueResult = await Order.findAll({
            where: { status: "delivered" },
            attributes: [
                [
                    Order.sequelize.fn("SUM", Order.sequelize.col("totalAmount")),
                    "totalRevenue",
                ],
            ],
        });

        const revenue =
            parseFloat(revenueResult[0] ? .dataValues ? .totalRevenue || 0);

        res.json({
            success: true,
            data: {
                totalBooks,
                totalUsers,
                totalOrders,
                totalCategories,
                revenue,
            },
        });

    } catch (err) {
        res.status(500).json({ error: "Dashboard failed" });
    }
};