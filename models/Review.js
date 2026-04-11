const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    class Review extends Model {
        static associate(models) {
            // Review belongs to a User
            Review.belongsTo(models.User, {
                foreignKey: "userId",
                as: "user",
            });

            // Review belongs to a Book
            Review.belongsTo(models.Book, {
                foreignKey: "bookId",
                as: "book",
            });
        }
    }

    Review.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "Users",
                key: "id",
            },
        },
        bookId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "Books",
                key: "id",
            },
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
            },
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        isApproved: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    }, {
        sequelize,
        modelName: "Review",
        tableName: "Reviews",
        timestamps: true,
        indexes: [{
            unique: true,
            fields: ["userId", "bookId"],
        }, ],
    }, );

    return Review;
};