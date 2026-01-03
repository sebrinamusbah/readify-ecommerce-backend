const { Book, Category, User, Order, OrderItem } = require('../models');
const { Op } = require('sequelize');

class AdminService {
    /**
     * Add new book
     * @param {Object} bookData - Book information
     * @returns {Promise<Book>} Created book
     */
    async addBook(bookData) {
        // Validate required fields
        if (!bookData.title || !bookData.author || !bookData.price || !bookData.categoryId) {
            throw new Error('Title, author, price, and category are required');
        }

        // Check if category exists
        const category = await Category.findByPk(bookData.categoryId);
        if (!category) {
            throw new Error('Category not found');
        }

        // Check for duplicate ISBN
        if (bookData.isbn) {
            const existingBook = await Book.findOne({ where: { isbn: bookData.isbn } });
            if (existingBook) {
                throw new Error('A book with this ISBN already exists');
            }
        }

        // Validate cover image URL format
        if (bookData.coverImage) {
            try {
                new URL(bookData.coverImage);
            } catch {
                throw new Error('Invalid cover image URL');
            }
        }

        // Create book record
        return await Book.create({
            title: bookData.title,
            author: bookData.author,
            description: bookData.description || null,
            price: parseFloat(bookData.price),
            stock: parseInt(bookData.stock) || 0,
            categoryId: bookData.categoryId,
            isbn: bookData.isbn || null,
            pages: bookData.pages ? parseInt(bookData.pages) : null,
            language: bookData.language || 'English',
            publishedDate: bookData.publishedDate ? new Date(bookData.publishedDate) : null,
            isFeatured: bookData.isFeatured === 'true',
            coverImage: bookData.coverImage || "https://via.placeholder.com/300x400/4A90E2/FFFFFF?text=Book+Cover"
        });
    }

    /**
     * Update book information
     * @param {string} id - Book ID
     * @param {Object} updateData - Updated book data
     * @returns {Promise<Book>} Updated book
     */
    async updateBook(id, updateData) {
        // Find the book
        const book = await Book.findByPk(id);
        if (!book) {
            throw new Error('Book not found');
        }

        // Check if new ISBN conflicts with existing book
        if (updateData.isbn && updateData.isbn !== book.isbn) {
            const existingBook = await Book.findOne({ where: { isbn: updateData.isbn } });
            if (existingBook) {
                throw new Error('A book with this ISBN already exists');
            }
        }

        // Update book with parsed values
        await book.update({
            ...updateData,
            price: updateData.price ? parseFloat(updateData.price) : book.price,
            stock: updateData.stock ? parseInt(updateData.stock) : book.stock,
            pages: updateData.pages ? parseInt(updateData.pages) : book.pages,
            isFeatured: updateData.isFeatured !== undefined ?
                updateData.isFeatured === 'true' : book.isFeatured
        });

        // Return updated book with category
        return await Book.findByPk(id, {
            include: [{ model: Category, as: 'category' }]
        });
    }

    /**
     * Delete a book
     * @param {string} id - Book ID
     * @returns {Promise<Object>} Success message
     */
    async deleteBook(id) {
        const book = await Book.findByPk(id);
        if (!book) {
            throw new Error('Book not found');
        }

        // Check if book has associated orders
        const orderCount = await OrderItem.count({ where: { bookId: id } });
        if (orderCount > 0) {
            throw new Error(`Cannot delete book. It has ${orderCount} order(s).`);
        }

        await book.destroy();
        return { message: 'Book deleted successfully' };
    }

    /**
     * Update book stock quantity
     * @param {string} id - Book ID
     * @param {number} quantity - Quantity to add/subtract/set
     * @param {string} action - 'add', 'subtract', or 'set'
     * @returns {Promise<Object>} Updated stock information
     */
    async updateStock(id, quantity, action) {
        // Validate quantity
        if (!quantity || isNaN(quantity)) {
            throw new Error('Valid quantity is required');
        }

        const book = await Book.findByPk(id);
        if (!book) {
            throw new Error('Book not found');
        }

        let newStock = book.stock;

        // Apply stock action
        if (action === 'add') {
            newStock += parseInt(quantity);
        } else if (action === 'subtract') {
            newStock -= parseInt(quantity);
            if (newStock < 0) {
                throw new Error('Stock cannot be negative');
            }
        } else {
            newStock = parseInt(quantity);
        }

        await book.update({ stock: newStock });
        return { stock: newStock };
    }

    /**
     * Add new category
     * @param {Object} categoryData - Category information
     * @returns {Promise<Category>} Created category
     */
    async addCategory(categoryData) {
        if (!categoryData.name) {
            throw new Error('Category name is required');
        }

        // Check for duplicate category name (case-insensitive)
        const existingCategory = await Category.findOne({
            where: { name: {
                    [Op.iLike]: categoryData.name } }
        });

        if (existingCategory) {
            throw new Error('Category with this name already exists');
        }

        // Generate URL-friendly slug
        const slug = categoryData.name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        return await Category.create({
            name: categoryData.name,
            slug,
            description: categoryData.description || null
        });
    }

    /**
     * Update category information
     * @param {string} id - Category ID
     * @param {Object} updateData - Updated category data
     * @returns {Promise<Category>} Updated category
     */
    async updateCategory(id, updateData) {
        const category = await Category.findByPk(id);
        if (!category) {
            throw new Error('Category not found');
        }

        // Check if new name conflicts with other categories
        if (updateData.name && updateData.name !== category.name) {
            const existingCategory = await Category.findOne({
                where: {
                    name: {
                        [Op.iLike]: updateData.name },
                    id: {
                        [Op.ne]: id }
                }
            });

            if (existingCategory) {
                throw new Error('Another category with this name already exists');
            }
        }

        const updateObj = {};
        if (updateData.name) {
            updateObj.name = updateData.name;
            updateObj.slug = updateData.name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        }
        if (updateData.description !== undefined) {
            updateObj.description = updateData.description;
        }

        await category.update(updateObj);
        return category;
    }

    /**
     * Delete a category
     * @param {string} id - Category ID
     * @returns {Promise<Object>} Success message
     */
    async deleteCategory(id) {
        const category = await Category.findByPk(id);
        if (!category) {
            throw new Error('Category not found');
        }

        // Check if category has books
        const bookCount = await Book.count({ where: { categoryId: id } });
        if (bookCount > 0) {
            throw new Error(`Cannot delete category. It has ${bookCount} book(s).`);
        }

        await category.destroy();
        return { message: 'Category deleted successfully' };
    }

    /**
     * Get all orders with pagination
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @returns {Promise<Object>} Orders with pagination info
     */
    async getAllOrders(page = 1, limit = 20) {
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

        return {
            count,
            orders,
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }

    /**
     * Update order status
     * @param {string} id - Order ID
     * @param {string} status - New status
     * @returns {Promise<Order>} Updated order
     */
    async updateOrderStatus(id, status) {
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

        if (!status || !validStatuses.includes(status)) {
            throw new Error(`Valid status required: ${validStatuses.join(', ')}`);
        }

        const order = await Order.findByPk(id);
        if (!order) {
            throw new Error('Order not found');
        }

        await order.update({ status });
        return order;
    }

    /**
     * Get all users with pagination
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @returns {Promise<Object>} Users with pagination info
     */
    async getAllUsers(page = 1, limit = 20) {
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

        return {
            count,
            users,
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };
    }

    /**
     * Update user role or status
     * @param {string} id - User ID
     * @param {Object} updateData - Updated user data
     * @returns {Promise<User>} Updated user
     */
    async updateUser(id, updateData) {
        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Prevent demoting the last admin
        if (updateData.role === 'user' && user.role === 'admin') {
            const adminCount = await User.count({ where: { role: 'admin' } });
            if (adminCount <= 1) {
                throw new Error('Cannot demote the last admin user');
            }
        }

        const updateObj = {};
        if (updateData.role && ['user', 'admin'].includes(updateData.role)) {
            updateObj.role = updateData.role;
        }
        if (updateData.isActive !== undefined) {
            updateObj.isActive = updateData.isActive === 'true';
        }

        await user.update(updateObj);
        return user;
    }

    /**
     * Get dashboard statistics
     * @returns {Promise<Object>} Dashboard stats
     */
    async getDashboardStats() {
        // Get counts in parallel for better performance
        const [totalBooks, totalUsers, totalOrders, totalCategories] = await Promise.all([
            Book.count(),
            User.count(),
            Order.count(),
            Category.count()
        ]);

        // Get recent orders and low stock books in parallel
        const [recentOrders, lowStockBooks] = await Promise.all([
            Order.findAll({
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['name', 'email']
                }],
                order: [
                    ['createdAt', 'DESC']
                ],
                limit: 5
            }),
            Book.findAll({
                where: { stock: {
                        [Op.lt]: 10 } },
                include: [{ model: Category, as: 'category' }],
                order: [
                    ['stock', 'ASC']
                ],
                limit: 5
            })
        ]);

        // Calculate total revenue from delivered orders
        const revenueResult = await Order.findAll({
            where: { status: 'delivered' },
            attributes: [
                [Book.sequelize.fn('SUM', Book.sequelize.col('totalAmount')), 'totalRevenue']
            ]
        });

        const totalRevenue = parseFloat(revenueResult[0] ?.dataValues ?.totalRevenue || 0);

        return {
            counts: {
                books: totalBooks,
                users: totalUsers,
                orders: totalOrders,
                categories: totalCategories,
                revenue: totalRevenue.toFixed(2)
            },
            recentOrders,
            lowStockBooks
        };
    }
}

module.exports = new AdminService();