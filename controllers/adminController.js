// controllers/adminController.js
const { Book, Category, User, Order, OrderItem, Review } = require('../models');
const { Op } = require('sequelize');

// ==================== BOOK MANAGEMENT ====================

// @desc    Add new book (Admin only)
// @route   POST /api/admin/books
// @access  Private/Admin
// controllers/adminController.js - SIMPLIFIED (URL-based)
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
            coverImage // ← Accept URL as string
        } = req.body;

        // Validate required fields
        if (!title || !author || !price || !categoryId) {
            return res.status(400).json({
                success: false,
                error: 'Title, author, price, and category are required'
            });
        }

        // Check if category exists
        const category = await Category.findByPk(categoryId);
        if (!category) {
            return res.status(400).json({
                success: false,
                error: 'Category not found'
            });
        }

        // Check if ISBN exists
        if (isbn) {
            const existingBook = await Book.findOne({ where: { isbn } });
            if (existingBook) {
                return res.status(400).json({
                    success: false,
                    error: 'A book with this ISBN already exists'
                });
            }
        }

        // Validate coverImage URL if provided
        if (coverImage) {
            try {
                new URL(coverImage); // Will throw if invalid URL
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid cover image URL'
                });
            }
        }

        // Create book with cover image URL
        const book = await Book.create({
            title,
            author,
            description: description || null,
            price: parseFloat(price),
            stock: parseInt(stock) || 0,
            categoryId,
            isbn: isbn || null,
            pages: pages ? parseInt(pages) : null,
            language: language || 'English',
            publishedDate: publishedDate ? new Date(publishedDate) : null,
            isFeatured: isFeatured === 'true',
            coverImage: coverImage || "https://via.placeholder.com/300x400/4A90E2/FFFFFF?text=Book+Cover"
        });

        res.status(201).json({
            success: true,
            message: 'Book added successfully',
            data: book
        });

    } catch (error) {
        console.error('[ERROR] Add book failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add book'
        });
    }
};

// @desc    Update book (Admin only)
// @route   PUT /api/admin/books/:id
// @access  Private/Admin
exports.updateBook = async(req, res) => {
    try {
        const { id } = req.params;

        const book = await Book.findByPk(id);
        if (!book) {
            return res.status(404).json({
                success: false,
                error: 'Book not found'
            });
        }

        // Check if updating ISBN and it already exists
        if (req.body.isbn && req.body.isbn !== book.isbn) {
            const existingBook = await Book.findOne({
                where: { isbn: req.body.isbn }
            });
            if (existingBook) {
                return res.status(400).json({
                    success: false,
                    error: 'A book with this ISBN already exists'
                });
            }
        }

        // Update book
        await book.update({
            ...req.body,
            price: req.body.price ? parseFloat(req.body.price) : book.price,
            stock: req.body.stock ? parseInt(req.body.stock) : book.stock,
            pages: req.body.pages ? parseInt(req.body.pages) : book.pages,
            isFeatured: req.body.isFeatured !== undefined ?
                req.body.isFeatured === 'true' : book.isFeatured,
            ...(req.file && { coverImage: `/uploads/${req.file.filename}` })
        });

        const updatedBook = await Book.findByPk(id, {
            include: [{ model: Category, as: 'category' }]
        });

        res.json({
            success: true,
            message: 'Book updated successfully',
            data: updatedBook
        });

    } catch (error) {
        console.error('[ERROR] Update book failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update book'
        });
    }
};

// @desc    Delete book (Admin only)
// @route   DELETE /api/admin/books/:id
// @access  Private/Admin
exports.deleteBook = async(req, res) => {
    try {
        const { id } = req.params;

        const book = await Book.findByPk(id);
        if (!book) {
            return res.status(404).json({
                success: false,
                error: 'Book not found'
            });
        }

        // Check if book has orders
        const orderCount = await OrderItem.count({ where: { bookId: id } });
        if (orderCount > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete book. It has ${orderCount} order(s). You can mark it as inactive instead.`
            });
        }

        await book.destroy();

        res.json({
            success: true,
            message: 'Book deleted successfully'
        });

    } catch (error) {
        console.error('[ERROR] Delete book failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete book'
        });
    }
};

// @desc    Update book stock (Admin only)
// @route   PATCH /api/admin/books/:id/stock
// @access  Private/Admin
exports.updateStock = async(req, res) => {
    try {
        const { id } = req.params;
        const { quantity, action } = req.body; // action: 'add' or 'subtract'

        if (!quantity || isNaN(quantity)) {
            return res.status(400).json({
                success: false,
                error: 'Valid quantity is required'
            });
        }

        const book = await Book.findByPk(id);
        if (!book) {
            return res.status(404).json({
                success: false,
                error: 'Book not found'
            });
        }

        let newStock = book.stock;

        if (action === 'add') {
            newStock += parseInt(quantity);
        } else if (action === 'subtract') {
            newStock -= parseInt(quantity);
            if (newStock < 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Stock cannot be negative'
                });
            }
        } else {
            newStock = parseInt(quantity);
        }

        await book.update({ stock: newStock });

        res.json({
            success: true,
            message: `Stock updated to ${newStock}`,
            data: { stock: newStock }
        });

    } catch (error) {
        console.error('[ERROR] Update stock failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update stock'
        });
    }
};

// ==================== CATEGORY MANAGEMENT ====================

// @desc    Add new category (Admin only)
// @route   POST /api/admin/categories
// @access  Private/Admin
exports.addCategory = async(req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Category name is required'
            });
        }

        // Check if category already exists
        const existingCategory = await Category.findOne({
            where: {
                name: {
                    [Op.iLike]: name
                }
            }
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                error: 'Category with this name already exists'
            });
        }

        // Generate slug from name
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const category = await Category.create({
            name,
            slug,
            description: description || null
        });

        res.status(201).json({
            success: true,
            message: 'Category added successfully',
            data: category
        });

    } catch (error) {
        console.error('[ERROR] Add category failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add category'
        });
    }
};

// @desc    Update category (Admin only)
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
exports.updateCategory = async(req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        // Check if new name conflicts with existing category
        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({
                where: {
                    name: {
                        [Op.iLike]: name
                    },
                    id: {
                        [Op.ne]: id
                    }
                }
            });

            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    error: 'Another category with this name already exists'
                });
            }
        }

        // Update category
        const updateData = {};
        if (name) {
            updateData.name = name;
            updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        if (description !== undefined) {
            updateData.description = description;
        }

        await category.update(updateData);

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });

    } catch (error) {
        console.error('[ERROR] Update category failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update category'
        });
    }
};

// @desc    Delete category (Admin only)
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
exports.deleteCategory = async(req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByPk(id);
        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        // Check if category has books
        const bookCount = await Book.count({ where: { categoryId: id } });
        if (bookCount > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete category. It has ${bookCount} book(s). Move or delete the books first.`
            });
        }

        await category.destroy();

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });

    } catch (error) {
        console.error('[ERROR] Delete category failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete category'
        });
    }
};

// ==================== ORDER MANAGEMENT ====================

// @desc    Get all orders (Admin only)
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getAllOrders = async(req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { count, rows: orders } = await Order.findAndCountAll({
            include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                },
                {
                    model: OrderItem,
                    as: 'orderItems',
                    include: [{
                        model: Book,
                        as: 'book',
                        attributes: ['id', 'title', 'author', 'price']
                    }]
                }
            ],
            order: [
                ['createdAt', 'DESC']
            ],
            limit,
            offset,
            distinct: true
        });

        const totalPages = Math.ceil(count / limit);

        res.json({
            success: true,
            count,
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            data: orders
        });

    } catch (error) {
        console.error('[ERROR] Get all orders failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders'
        });
    }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async(req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: `Valid status required: ${validStatuses.join(', ')}`
            });
        }

        const order = await Order.findByPk(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        await order.update({ status });

        res.json({
            success: true,
            message: `Order status updated to ${status}`,
            data: order
        });

    } catch (error) {
        console.error('[ERROR] Update order status failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update order status'
        });
    }
};

// ==================== USER MANAGEMENT ====================

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async(req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { count, rows: users } = await User.findAndCountAll({
            attributes: { exclude: ['password'] },
            order: [
                ['createdAt', 'DESC']
            ],
            limit,
            offset,
            distinct: true
        });

        const totalPages = Math.ceil(count / limit);

        res.json({
            success: true,
            count,
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            data: users
        });

    } catch (error) {
        console.error('[ERROR] Get all users failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
};

// @desc    Update user (Admin only)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async(req, res) => {
    try {
        const { id } = req.params;
        const { role, isActive } = req.body;

        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Don't allow demoting the last admin
        if (role === 'user' && user.role === 'admin') {
            const adminCount = await User.count({ where: { role: 'admin' } });
            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Cannot demote the last admin user'
                });
            }
        }

        const updateData = {};
        if (role && ['user', 'admin'].includes(role)) {
            updateData.role = role;
        }
        if (isActive !== undefined) {
            updateData.isActive = isActive === 'true';
        }

        await user.update(updateData);

        res.json({
            success: true,
            message: 'User updated successfully',
            data: user
        });

    } catch (error) {
        console.error('[ERROR] Update user failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user'
        });
    }
};

// ==================== DASHBOARD STATS ====================

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async(req, res) => {
    try {
        // Get counts
        const totalBooks = await Book.count();
        const totalUsers = await User.count();
        const totalOrders = await Order.count();
        const totalCategories = await Category.count();

        // Get recent orders
        const recentOrders = await Order.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['name', 'email']
            }],
            order: [
                ['createdAt', 'DESC']
            ],
            limit: 5
        });

        // Get low stock books
        const lowStockBooks = await Book.findAll({
            where: {
                stock: {
                    [Op.lt]: 10
                }
            },
            include: [{ model: Category, as: 'category' }],
            order: [
                ['stock', 'ASC']
            ],
            limit: 5
        });

        // Calculate revenue (only completed orders)
        const revenueResult = await Order.findAll({
            where: { status: 'delivered' },
            attributes: [
                [Book.sequelize.fn('SUM', Book.sequelize.col('totalAmount')), 'totalRevenue']
            ]
        });

        const totalRevenue = parseFloat(revenueResult[0] ?.dataValues ?.totalRevenue || 0);

        res.json({
            success: true,
            data: {
                counts: {
                    books: totalBooks,
                    users: totalUsers,
                    orders: totalOrders,
                    categories: totalCategories,
                    revenue: totalRevenue.toFixed(2)
                },
                recentOrders,
                lowStockBooks
            }
        });

    } catch (error) {
        console.error('[ERROR] Get dashboard stats failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard statistics'
        });
    }
};