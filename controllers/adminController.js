const { User, Book, Order, Category } = require("../models");
const formatResponse = require("../utils/formatResponse");

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async(req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ["password"] },
            order: [
                ["createdAt", "DESC"]
            ],
        });

        res.json(formatResponse(true, users, "Users retrieved successfully"));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(false, null, "Server error"));
    }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async(req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ["password"] },
            include: [{
                model: Order,
                include: [OrderItem],
            }, ],
        });

        if (!user) {
            return res
                .status(404)
                .json(formatResponse(false, null, "User not found"));
        }

        res.json(formatResponse(true, user, "User retrieved successfully"));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(false, null, "Server error"));
    }
};

// @desc    Update user (Admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async(req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res
                .status(404)
                .json(formatResponse(false, null, "User not found"));
        }

        const { name, email, role, isActive } = req.body;

        // Check if email is being changed and already exists
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ where: { email } });
            if (emailExists) {
                return res
                    .status(400)
                    .json(formatResponse(false, null, "Email already in use"));
            }
        }

        await user.update({
            name: name || user.name,
            email: email || user.email,
            role: role || user.role,
            isActive: isActive !== undefined ? isActive : user.isActive,
        });

        // Get updated user without password
        const updatedUser = await User.findByPk(req.params.id, {
            attributes: { exclude: ["password"] },
        });

        res.json(formatResponse(true, updatedUser, "User updated successfully"));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(false, null, "Server error"));
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async(req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res
                .status(404)
                .json(formatResponse(false, null, "User not found"));
        }

        // Prevent deleting self
        if (user.id === req.user.id) {
            return res
                .status(400)
                .json(formatResponse(false, null, "Cannot delete your own account"));
        }

        await user.destroy();

        res.json(formatResponse(true, null, "User deleted successfully"));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(false, null, "Server error"));
    }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async(req, res) => {
    try {
        // Get counts
        const totalUsers = await User.count();
        const totalBooks = await Book.count();
        const totalOrders = await Order.count();
        const totalCategories = await Category.count();

        // Get recent orders
        const recentOrders = await Order.findAll({
            limit: 10,
            include: [User],
            order: [
                ["createdAt", "DESC"]
            ],
        });

        // Get low stock books
        const lowStockBooks = await Book.findAll({
            where: {
                stock: {
                    [require("sequelize").Op.lt]: 10, // Less than 10
                },
            },
            limit: 10,
            order: [
                ["stock", "ASC"]
            ],
        });

        // Calculate total revenue
        const revenueResult = await Order.findOne({
            attributes: [
                [
                    require("sequelize").fn(
                        "SUM",
                        require("sequelize").col("totalAmount")
                    ),
                    "totalRevenue",
                ],
            ],
            where: {
                paymentStatus: "paid",
            },
        });

        const totalRevenue = revenueResult ? .dataValues ? .totalRevenue || 0;

        res.json(
            formatResponse(
                true, {
                    counts: {
                        totalUsers,
                        totalBooks,
                        totalOrders,
                        totalCategories,
                        totalRevenue: parseFloat(totalRevenue),
                    },
                    recentOrders,
                    lowStockBooks,
                },
                "Dashboard stats retrieved successfully"
            )
        );
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(false, null, "Server error"));
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getDashboardStats,
};