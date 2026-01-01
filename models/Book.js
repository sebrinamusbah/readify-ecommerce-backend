const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class Book extends Model {
    static associate(models) {
      // Each book belongs to one category
      Book.belongsTo(models.Category, {
        foreignKey: "categoryId",
        as: "category",
      });
      // Book.hasMany(models.Review, { foreignKey: 'bookId' });
      // Book.hasMany(models.OrderItem, { foreignKey: 'bookId' });
    }
  }

  Book.init(
    {
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
      coverImage: {
        type: DataTypes.STRING,
        defaultValue: "default-book.jpg",
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
      // ADD THIS FIELD
      categoryId: {
        type: DataTypes.UUID,
        references: {
          model: "Categories",
          key: "id",
        },
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Book",
      timestamps: true,
    }
  );

  return Book;
};
