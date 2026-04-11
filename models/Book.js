const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class Book extends Model {
        static associate(models) {
            // Each book belongs to one category
            Book.belongsTo(models.Category, {
                foreignKey: "categoryId",
                as: "category",
            });

            // Book has many order items
            Book.hasMany(models.OrderItem, {
                foreignKey: "bookId",
                as: "orderItems",
            });

            // Book has many cart items
            Book.hasMany(models.CartItem, {
                foreignKey: "bookId",
                as: "cartItems",
            });
            Book.hasMany(models.Review, {
                foreignKey: "bookId",
                as: "reviews",
            });

            // Uncomment when you add Review.js
            // Book.hasMany(models.Review, {
            //   foreignKey: 'bookId',
            //   as: 'reviews'
            // });
        }
    }

    Book.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        author: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        isbn: {
            type: DataTypes.STRING,
            unique: true,
        },
        description: {
            type: DataTypes.TEXT,
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0,
            },
        },
        stock: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: 0,
            },
        },
        // In Book.js model
        coverImage: {
            type: DataTypes.STRING,
            defaultValue: "https://via.placeholder.com/300x400/4A90E2/FFFFFF?text=Book+Cover",
            validate: {
                isUrl: true, // Validates it's a proper URL
            },
        },
        publishedDate: {
            type: DataTypes.DATE,
        },
        pages: {
            type: DataTypes.INTEGER,
        },
        language: {
            type: DataTypes.STRING,
            defaultValue: "English",
        },
        isFeatured: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        rating: {
            type: DataTypes.DECIMAL(3, 2),
            defaultValue: 0,
            validate: {
                min: 0,
                max: 5,
            },
        },
        categoryId: {
            type: DataTypes.UUID,
            references: {
                model: "Categories",
                key: "id",
            },
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: "Book",
        tableName: "Books",
        timestamps: true,
    }, );

    return Book;
};