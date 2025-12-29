const { User, Order } = require("../models");
const formatResponse = require("../utils/formatResponse");
const bcrypt = require("bcryptjs");

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async(req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ["password"] },
        });

        res.json(formatResponse(true, user, "User profile retrieved successfully"));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(false, null, "Server error"));
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async(req, res) => {
    try {
        const { name, email, address, phone } = req.body;

        const user = await User.findByPk(req.user.id);

        // Check if email is being changed and already exists
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ where: { email } });
            if (emailExists) {
                return res
                    .status(400)
                    .json(formatResponse(false, null, "Email already in use"));
            }
        }

        // Update user
        await user.update({
            name: name || user.name,
            email: email || user.email,
            address: address || user.address,
            phone: phone || user.phone,
        });

        // Get updated user without password
        const updatedUser = await User.findByPk(req.user.id, {
            attributes: { exclude: ["password"] },
        });

        res.json(formatResponse(true, updatedUser, "Profile updated successfully"));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(false, null, "Server error"));
    }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async(req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findByPk(req.user.id);

        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res
                .status(400)
                .json(formatResponse(false, null, "Current password is incorrect"));
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json(formatResponse(true, null, "Password changed successfully"));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(false, null, "Server error"));
    }
};

// @desc    Get user's orders
// @route   GET /api/users/orders
// @access  Private
const getUserOrders = async(req, res) => {
    try {
        const orders = await Order.findAll({
            where: { userId: req.user.id },
            include: [{
                model: OrderItem,
                include: [Book],
            }, ],
            order: [
                ["createdAt", "DESC"]
            ],
        });

        res.json(
            formatResponse(true, orders, "User orders retrieved successfully")
        );
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(false, null, "Server error"));
    }
};

module.exports = {
    getUserProfile,
    updateUserProfile,
    changePassword,
    getUserOrders,
};