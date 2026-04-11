const { Model, DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");

module.exports = (sequelize) => {
    class User extends Model {
        async comparePassword(password) {
            return await bcrypt.compare(password, this.password);
        }

        static associate(models) {
            // User has many Orders
            User.hasMany(models.Order, {
                foreignKey: "userId",
                as: "orders",
            });

            // User has many CartItems
            User.hasMany(models.CartItem, {
                foreignKey: "userId",
                as: "cartItems",
            });
            User.hasMany(models.Review, {
                foreignKey: "userId",
                as: "reviews",
            });

            User.hasMany(models.Payment, {
                foreignKey: "userId",
                as: "payments",
            });
        }
    }

    User.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [2, 100],
            },
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM("user", "admin"),
            defaultValue: "user",
        },
        address: {
            type: DataTypes.TEXT,
        },
        phone: {
            type: DataTypes.STRING(20),
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    }, {
        // ✅ SINGLE CONFIGURATION OBJECT
        sequelize,
        modelName: "User",
        tableName: "Users",
        timestamps: true,
        hooks: {
            beforeCreate: async(user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async(user) => {
                if (user.changed("password") && user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
        },
    }, );

    return User;
};