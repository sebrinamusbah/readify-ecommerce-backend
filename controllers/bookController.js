// controllers/bookController.js
const { Book, Category, Review, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all books
// @route   GET /api/books
// @access  Public
exports.getAllBooks = async(req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Build filter conditions
        const where = {};

        // Category filter
        if (req.query.categoryId) {
            where.categoryId = req.query.categoryId;
        }

        // Search filter
        if (req.query.search) {
            where[Op.or] = [{
                    title: {
                        [Op.iLike]: `%${req.query.search}%`
                    }
                },
                {
                    author: {
                        [Op.iLike]: `%${req.query.search}%`
                    }
                },
                {
                    description: {
                        [Op.iLike]: `%${req.query.search}%`
                    }
                }
            ];
        }

        // Featured filter
        if (req.query.featured === 'true') {
            where.isFeatured = true;
        }

        // Price range filter
        if (req.query.minPrice) {
            where.price = {
                [Op.gte]: parseFloat(req.query.minPrice)
            };
        }
        if (req.query.maxPrice) {
            where.price = {...where.price, [Op.lte]: parseFloat(req.query.maxPrice) };
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
                const reviews = await Review.findAll({
                    where: { bookId: book.id },
                    attributes: [
                        [Book.sequelize.fn('AVG', Book.sequelize.col('rating')), 'avgRating']
                    ]
                });

                const avgRating = reviews[0] ?.dataValues ?.avgRating || 0;

                return {
                    ...book.toJSON(),
                    avgRating: parseFloat(avgRating).toFixed(1)
                };
            })
        );

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
            filters: {
                categoryId: req.query.categoryId,
                search: req.query.search,
                featured: req.query.featured,
                minPrice: req.query.minPrice,
                maxPrice: req.query.maxPrice
            },
            data: booksWithAvgRating
        });

    } catch (error) {
        console.error('[ERROR] Get all books failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch books'
        });
    }
};

// @desc    Get single book by ID
// @route   GET /api/books/:id
// @access  Public
// Fixed getBookById function
// Fixed getBookById function
exports.getBookById = async(req, res) => {
    try {
        const { id } = req.params;

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
            return res.status(404).json({
                success: false,
                error: 'Book not found'
            });
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

        res.json({
            success: true,
            data: bookData
        });

    } catch (error) {
        console.error('[ERROR] Get book by ID failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch book'
        });
    }
};
// @desc    Get featured books
// @route   GET /api/books/featured
// @access  Public
exports.getFeaturedBooks = async(req, res) => {
    try {
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

        res.json({
            success: true,
            count: books.length,
            data: books
        });

    } catch (error) {
        console.error('[ERROR] Get featured books failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch featured books'
        });
    }
};

// @desc    Search books
// @route   GET /api/books/search
// @access  Public
exports.searchBooks = async(req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Search query must be at least 2 characters'
            });
        }

        const books = await Book.findAll({
            where: {
                [Op.or]: [{
                        title: {
                            [Op.iLike]: `%${q}%`
                        }
                    },
                    {
                        author: {
                            [Op.iLike]: `%${q}%`
                        }
                    },
                    {
                        description: {
                            [Op.iLike]: `%${q}%`
                        }
                    },
                    {
                        isbn: {
                            [Op.iLike]: `%${q}%`
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

        res.json({
            success: true,
            query: q,
            count: books.length,
            data: books
        });

    } catch (error) {
        console.error('[ERROR] Search books failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search books'
        });
    }
};

// @desc    Get books with filters
// @route   GET /api/books/filter
// @access  Public
exports.filterBooks = async(req, res) => {
    try {
        const {
            categoryId,
            minPrice,
            maxPrice,
            minRating,
            inStock
        } = req.query;

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
                    const reviews = await Review.findAll({
                        where: { bookId: book.id },
                        attributes: [
                            [Book.sequelize.fn('AVG', Book.sequelize.col('rating')), 'avgRating']
                        ]
                    });

                    const avgRating = parseFloat(reviews[0] ?.dataValues ?.avgRating || 0);
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

        res.json({
            success: true,
            filters: {
                categoryId,
                minPrice,
                maxPrice,
                minRating,
                inStock
            },
            count: filteredBooks.length,
            data: filteredBooks
        });

    } catch (error) {
        console.error('[ERROR] Filter books failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to filter books'
        });
    }
};
// @desc    Get books by category
// @route   GET /api/books/category/:categoryId
// @access  Public
exports.getBooksByCategory = async(req, res) => {
    try {
        const { categoryId } = req.params;

        const books = await Book.findAll({
            where: { categoryId },
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name', 'slug']
            }],
            order: [
                ['createdAt', 'DESC']
            ]
        });

        res.json({
            success: true,
            count: books.length,
            data: books
        });

    } catch (error) {
        console.error('[ERROR] Get books by category failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch books by category'
        });
    }
};