const { Book, Category } = require("../models");
const { Op } = require("sequelize");

class BookService {
    // Get all books with filters
    async getAllBooks(filters = {}) {
        const {
            page = 1,
                limit = 10,
                search = "",
                category = null,
                minPrice = null,
                maxPrice = null,
                sortBy = "createdAt",
                order = "DESC",
        } = filters;

        const where = {};

        // Search filter
        if (search) {
            where[Op.or] = [
                { title: {
                        [Op.iLike]: `%${search}%` } },
                { author: {
                        [Op.iLike]: `%${search}%` } },
                { description: {
                        [Op.iLike]: `%${search}%` } },
            ];
        }

        // Price filter
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
            if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await Book.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [
                [sortBy, order]
            ],
            include: [{
                model: Category,
                through: { attributes: [] },
                where: category ? { id: category } : undefined,
                required: !!category,
            }, ],
        });

        return {
            books: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            totalBooks: count,
        };
    }

    // Get book by ID
    async getBookById(id) {
        return await Book.findByPk(id, {
            include: [{
                model: Category,
                through: { attributes: [] },
            }, ],
        });
    }

    // Create book
    async createBook(bookData) {
        const book = await Book.create(bookData);

        if (bookData.categories && bookData.categories.length > 0) {
            await book.setCategories(bookData.categories);
        }

        return book;
    }

    // Update book
    async updateBook(id, bookData) {
        const book = await Book.findByPk(id);

        if (!book) {
            throw new Error("Book not found");
        }

        await book.update(bookData);

        if (bookData.categories) {
            await book.setCategories(bookData.categories);
        }

        return book;
    }

    // Delete book
    async deleteBook(id) {
        const book = await Book.findByPk(id);

        if (!book) {
            throw new Error("Book not found");
        }

        await book.destroy();
        return true;
    }

    // Get featured books
    async getFeaturedBooks(limit = 5) {
        return await Book.findAll({
            where: { isFeatured: true },
            limit,
            order: [
                ["createdAt", "DESC"]
            ],
            include: [Category],
        });
    }

    // Update book stock
    async updateStock(bookId, quantity) {
        const book = await Book.findByPk(bookId);

        if (!book) {
            throw new Error("Book not found");
        }

        if (book.stock + quantity < 0) {
            throw new Error("Insufficient stock");
        }

        book.stock += quantity;
        await book.save();

        return book;
    }

    // Search books
    async searchBooks(query, limit = 20) {
        return await Book.findAll({
            where: {
                [Op.or]: [
                    { title: {
                            [Op.iLike]: `%${query}%` } },
                    { author: {
                            [Op.iLike]: `%${query}%` } },
                    { description: {
                            [Op.iLike]: `%${query}%` } },
                ],
            },
            limit,
            include: [Category],
        });
    }
}

module.exports = new BookService();