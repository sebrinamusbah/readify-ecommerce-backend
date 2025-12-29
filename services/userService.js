const { User, Order, CartItem } = require("../models");
const bcrypt = require("bcryptjs");

class UserService {
    // Get user by ID (without password)
    async getUserById(id) {
        return await User.findByPk(id, {
            attributes: { exclude: ["password"] },
            include: [{
                model: Order,
                include: [OrderItem],
            }, ],
        });
    }

    // Get user by email
    async getUserByEmail(email) {
        return await User.findOne({ where: { email } });
    }

    // Create user
    async createUser(userData) {
        return await User.create(userData);
    }

    // Update user profile
    async updateUser(id, userData) {
        const user = await User.findByPk(id);

        if (!user) {
            throw new Error("User not found");
        }

        // Check if email is being changed
        if (userData.email && userData.email !== user.email) {
            const emailExists = await User.findOne({
                where: { email: userData.email },
            });
            if (emailExists) {
                throw new Error("Email already in use");
            }
        }

        await user.update(userData);

        // Return user without password
        return await User.findByPk(id, {
            attributes: { exclude: ["password"] },
        });
    }

    // Change password
    async changePassword(userId, currentPassword, newPassword) {
        const user = await User.findByPk(userId);

        if (!user) {
            throw new Error("User not found");
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            throw new Error("Current password is incorrect");
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        return true;
    }

    // Get user's orders
    async getUserOrders(userId) {
        return await Order.findAll({
            where: { userId },
            include: [{
                model: OrderItem,
                include: [Book],
            }, ],
            order: [
                ["createdAt", "DESC"]
            ],
        });
    }

    // Get user's cart
    async getUserCart(userId) {
        return await CartItem.findAll({
            where: { userId },
            include: [Book],
        });
    }

    // Get all users (for admin)
    async getAllUsers(page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        const { count, rows } = await User.findAndCountAll({
            attributes: { exclude: ["password"] },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [
                ["createdAt", "DESC"]
            ],
        });

        return {
            users: rows,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            totalUsers: count,
        };
    }

    // Update user role (admin only)
    async updateUserRole(userId, role) {
        const user = await User.findByPk(userId);

        if (!user) {
            throw new Error("User not found");
        }

        user.role = role;
        await user.save();

        return user;
    }

    // Deactivate/activate user
    async toggleUserStatus(userId, isActive) {
        const user = await User.findByPk(userId);

        if (!user) {
            throw new Error("User not found");
        }

        user.isActive = isActive;
        await user.save();

        return user;
    }
}

module.exports = new UserService();