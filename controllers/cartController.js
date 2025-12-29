const { CartItem, Book } = require("../models");
const formatResponse = require("../utils/formatResponse");

// @desc    Get user's cart items
// @route   GET /api/cart
// @access  Private
const getCartItems = async(req, res) => {
    try {
        const cartItems = await CartItem.findAll({
            where: { userId: req.user.id },
            include: [{
                model: Book,
                attributes: ["id", "title", "author", "price", "coverImage", "stock"],
            }, ],
        });

        // Calculate total
        let total = 0;
        const items = cartItems.map((item) => {
            const itemTotal = item.Book.price * item.quantity;
            total += itemTotal;

            return {
                id: item.id,
                quantity: item.quantity,
                book: item.Book,
                itemTotal: itemTotal.toFixed(2),
            };
        });

        res.json(
            formatResponse(
                true, {
                    items,
                    total: total.toFixed(2),
                    itemCount: cartItems.length,
                },
                "Cart items retrieved successfully"
            )
        );
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(false, null, "Server error"));
    }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async(req, res) => {
    try {
        const { bookId, quantity = 1 } = req.body;

        // Check if book exists and has stock
        const book = await Book.findByPk(bookId);
        if (!book) {
            return res
                .status(404)
                .json(formatResponse(false, null, "Book not found"));
        }

        if (book.stock < quantity) {
            return res
                .status(400)
                .json(formatResponse(false, null, "Insufficient stock"));
        }

        // Check if item already in cart
        let cartItem = await CartItem.findOne({
            where: { userId: req.user.id, bookId },
        });

        if (cartItem) {
            // Update quantity if already in cart
            cartItem.quantity += parseInt(quantity);
            await cartItem.save();
        } else {
            // Add new item to cart
            cartItem = await CartItem.create({
                userId: req.user.id,
                bookId,
                quantity: parseInt(quantity),
            });
        }

        res
            .status(201)
            .json(formatResponse(true, cartItem, "Item added to cart successfully"));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(false, null, "Server error"));
    }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:id
// @access  Private
const updateCartItem = async(req, res) => {
    try {
        const { quantity } = req.body;
        const cartItemId = req.params.id;

        const cartItem = await CartItem.findOne({
            where: { id: cartItemId, userId: req.user.id },
            include: [Book],
        });

        if (!cartItem) {
            return res
                .status(404)
                .json(formatResponse(false, null, "Cart item not found"));
        }

        // Check stock
        if (cartItem.Book.stock < quantity) {
            return res
                .status(400)
                .json(formatResponse(false, null, "Insufficient stock"));
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        res.json(formatResponse(true, cartItem, "Cart item updated successfully"));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(false, null, "Server error"));
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
const removeCartItem = async(req, res) => {
    try {
        const cartItemId = req.params.id;

        const cartItem = await CartItem.findOne({
            where: { id: cartItemId, userId: req.user.id },
        });

        if (!cartItem) {
            return res
                .status(404)
                .json(formatResponse(false, null, "Cart item not found"));
        }

        await cartItem.destroy();

        res.json(formatResponse(true, null, "Item removed from cart successfully"));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(false, null, "Server error"));
    }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async(req, res) => {
    try {
        await CartItem.destroy({
            where: { userId: req.user.id },
        });

        res.json(formatResponse(true, null, "Cart cleared successfully"));
    } catch (error) {
        console.error(error);
        res.status(500).json(formatResponse(false, null, "Server error"));
    }
};

module.exports = {
    getCartItems,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
};