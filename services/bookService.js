const { Book, Category, Review, User } = require('../models');
const { Op } = require('sequelize');

class BookService {
    // Get all books with pagination and filters
    async getAllBooks({
        page = 1,
        limit = 10,
        categoryId,
        search,
        featured,
        minPrice,
        maxPrice
    }) {
        const offset = (page - 1) * limit;

        // Build filter conditions
        const where = {};

        // Category filter
        if (categoryId) {
            where.categoryId = categoryId;
        }

        // Search filter
        if (search) {
            where[Op.or] = [{
                    title: {
                        [Op.iLike]: `%${search}%`
                    }
                },
                {
                    author: {
                        [Op.iLike]: `%${search}%`
                    }
                },
                {
                    description: {
                        [Op.iLike]: `%${search}%`
                    }
                }
            ];
        }

        // Featured filter
        if (featured === 'true') {
            where.isFeatured = true;
        }

        // Price range filter
        if (minPrice) {
            where.price = {
                [Op.gte]: parseFloat(minPrice)
            };
        }
        if (maxPrice) {
            where.price = {...where.price, [Op.lte]: parseFloat(maxPrice) };
        }

        // Get books with pagination
        const { count, rows: books } = await Book.findAndCountAll({
            where,
            include: [{
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'name', 'slug']
                },
                {
                    model: Review,
                    as: 'reviews',
                    attributes: ['id', 'rating', 'comment', 'createdAt'],
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['id', 'name']
                    }],
                    limit: 3 // Show only 3 latest reviews
                }
            ],
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            },
            order: [
                ['createdAt', 'DESC']
            ],
            limit,
            offset,
            distinct: true
        });

        // Calculate average rating for each book
        const booksWithAvgRating = await Promise.all(
            books.map(async(book) => {
                const avgRating = await this.calculateAverageRating(book.id);
                return {
                    ...book.toJSON(),
                    avgRating: parseFloat(avgRating).toFixed(1)
                };
            })
        );

        const totalPages = Math.ceil(count / limit);

        return {
            count,
            books: booksWithAvgRating,
            pagination: {
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            filters: {
                categoryId,
                search,
                featured,
                minPrice,
                maxPrice
            }
        };
    }

    // Get single book by ID
    async getBookById(id) {
        const book = await Book.findByPk(id, {
            include: [{
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'name', 'slug', 'description']
                },
                {
                    model: Review,
                    as: 'reviews',
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['id', 'name']
                    }],
                    order: [
                        ['createdAt', 'DESC']
                    ]
                }
            ]
        });

        if (!book) {
            return null;
        }

        // Calculate average rating and total reviews
        const reviews = await Review.findAll({
            where: { bookId: book.id },
            attributes: [
                [Review.sequelize.fn('COUNT', Review.sequelize.col('id')), 'totalReviews'],
                [Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'avgRating']
            ]
        });

        const bookData = book.toJSON();
        bookData.totalReviews = parseInt(reviews[0] ?.dataValues ?.totalReviews || 0);
        bookData.avgRating = parseFloat(reviews[0] ?.dataValues ?.avgRating || 0).toFixed(1);
        bookData.inStock = book.stock > 0;
        bookData.stockStatus = book.stock > 10 ? 'In Stock' :
            book.stock > 0 ? 'Low Stock' : 'Out of Stock';

        return bookData;
    }

    // Get featured books
    async getFeaturedBooks() {
        const books = await Book.findAll({
            where: { isFeatured: true },
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name', 'slug']
            }],
            order: [
                ['createdAt', 'DESC']
            ],
            limit: 8
        });

        return books;
    }

    // Search books
    async searchBooks(query) {
        const books = await Book.findAll({
            where: {
                [Op.or]: [{
                        title: {
                            [Op.iLike]: `%${query}%`
                        }
                    },
                    {
                        author: {
                            [Op.iLike]: `%${query}%`
                        }
                    },
                    {
                        description: {
                            [Op.iLike]: `%${query}%`
                        }
                    },
                    {
                        isbn: {
                            [Op.iLike]: `%${query}%`
                        }
                    }
                ]
            },
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name', 'slug']
            }],
            order: [
                ['createdAt', 'DESC']
            ],
            limit: 20
        });

        return books;
    }

    // Filter books
    async filterBooks({
        categoryId,
        minPrice,
        maxPrice,
        minRating,
        inStock
    }) {
        const where = {};

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (minPrice) {
            where.price = {
                [Op.gte]: parseFloat(minPrice)
            };
        }

        if (maxPrice) {
            where.price = {...where.price, [Op.lte]: parseFloat(maxPrice) };
        }

        if (inStock === 'true') {
            where.stock = {
                [Op.gt]: 0
            };
        }

        const books = await Book.findAll({
            where,
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name', 'slug']
            }],
            order: [
                ['createdAt', 'DESC']
            ],
            limit: 50
        });

        // Filter by rating if specified
        let filteredBooks = books;
        if (minRating) {
            filteredBooks = await Promise.all(
                books.map(async(book) => {
                    const avgRating = await this.calculateAverageRating(book.id);
                    if (avgRating >= parseFloat(minRating)) {
                        return {
                            ...book.toJSON(),
                            avgRating: avgRating.toFixed(1)
                        };
                    }
                    return null;
                })
            );
            filteredBooks = filteredBooks.filter(book => book !== null);
        }

        return {
            books: filteredBooks,
            filters: {
                categoryId,
                minPrice,
                maxPrice,
                minRating,
                inStock
            }
        };
    }

    // Helper: Calculate average rating for a book
    async calculateAverageRating(bookId) {
        const reviews = await Review.findAll({
            where: { bookId },
            attributes: [
                [Book.sequelize.fn('AVG', Book.sequelize.col('rating')), 'avgRating']
            ]
        });

        return reviews[0] ?.dataValues ?.avgRating || 0;
    }

    // Helper: Calculate stock status
    getStockStatus(stock) {
        if (stock > 10) return 'In Stock';
        if (stock > 0) return 'Low Stock';
        return 'Out of Stock';
    }
}

module.exports = new BookService();