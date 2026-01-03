// controllers/cartController.js
const { CartItem, Book, User } = require("../models");
const { Op } = require("sequelize");

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cartItems = await CartItem.findAll({
      where: { userId },
      include: [
        {
          model: Book,
          as: "book",
          attributes: ["id", "title", "author", "price", "coverImage", "stock"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Calculate totals
    let subtotal = 0;
    let totalItems = 0;

    const items = cartItems.map((item) => {
      const itemTotal = item.quantity * item.book.price;
      subtotal += itemTotal;
      totalItems += item.quantity;

      return {
        id: item.id,
        bookId: item.bookId,
        quantity: item.quantity,
        book: item.book,
        itemTotal: parseFloat(itemTotal.toFixed(2)),
        createdAt: item.createdAt,
      };
    });

    // Calculate tax and total (example: 10% tax)
    const taxRate = 0.1;
    const tax = parseFloat((subtotal * taxRate).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    res.json({
      success: true,
      data: {
        items,
        summary: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          tax,
          total,
          totalItems,
        },
      },
    });
  } catch (error) {
    console.error("[ERROR] Get cart failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch cart",
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId, quantity = 1 } = req.body;

    // Validate input
    if (!bookId) {
      return res.status(400).json({
        success: false,
        error: "Book ID is required",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        error: "Quantity must be at least 1",
      });
    }

    // Check if book exists and is in stock
    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        error: "Book not found",
      });
    }

    if (book.stock < quantity) {
      return res.status(400).json({
        success: false,
        error: `Only ${book.stock} items available in stock`,
      });
    }

    // Check if item already exists in cart
    let cartItem = await CartItem.findOne({
      where: { userId, bookId },
    });

    if (cartItem) {
      // Update quantity if item already in cart
      const newQuantity = cartItem.quantity + quantity;

      // Check stock again for total quantity
      if (book.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          error: `Cannot add ${quantity} more. Only ${
            book.stock - cartItem.quantity
          } available.`,
        });
      }

      cartItem.quantity = newQuantity;
      await cartItem.save();
    } else {
      // Create new cart item
      cartItem = await CartItem.create({
        userId,
        bookId,
        quantity,
      });
    }

    // Get updated cart item with book details
    const updatedCartItem = await CartItem.findByPk(cartItem.id, {
      include: [
        {
          model: Book,
          as: "book",
          attributes: ["id", "title", "author", "price", "coverImage"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Item added to cart",
      data: {
        id: updatedCartItem.id,
        bookId: updatedCartItem.bookId,
        quantity: updatedCartItem.quantity,
        book: updatedCartItem.book,
        itemTotal: parseFloat(
          (updatedCartItem.quantity * updatedCartItem.book.price).toFixed(2)
        ),
      },
    });
  } catch (error) {
    console.error("[ERROR] Add to cart failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add item to cart",
    });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:id
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        error: "Valid quantity is required",
      });
    }

    // Find cart item
    const cartItem = await CartItem.findOne({
      where: { id, userId },
      include: [
        {
          model: Book,
          as: "book",
        },
      ],
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: "Cart item not found",
      });
    }

    // If quantity is 0, remove item
    if (quantity === 0) {
      await cartItem.destroy();
      return res.json({
        success: true,
        message: "Item removed from cart",
      });
    }

    // Check stock availability
    if (cartItem.book.stock < quantity) {
      return res.status(400).json({
        success: false,
        error: `Only ${cartItem.book.stock} items available in stock`,
      });
    }

    // Update quantity
    cartItem.quantity = quantity;
    await cartItem.save();

    const updatedCartItem = await CartItem.findByPk(cartItem.id, {
      include: [
        {
          model: Book,
          as: "book",
          attributes: ["id", "title", "author", "price", "coverImage"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Cart updated",
      data: {
        id: updatedCartItem.id,
        bookId: updatedCartItem.bookId,
        quantity: updatedCartItem.quantity,
        book: updatedCartItem.book,
        itemTotal: parseFloat(
          (updatedCartItem.quantity * updatedCartItem.book.price).toFixed(2)
        ),
      },
    });
  } catch (error) {
    console.error("[ERROR] Update cart item failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update cart",
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const cartItem = await CartItem.findOne({
      where: { id, userId },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: "Cart item not found",
      });
    }

    await cartItem.destroy();

    res.json({
      success: true,
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("[ERROR] Remove from cart failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove item from cart",
    });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    await CartItem.destroy({
      where: { userId },
    });

    res.json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    console.error("[ERROR] Clear cart failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear cart",
    });
  }
};

// @desc    Get cart count
// @route   GET /api/cart/count
// @access  Private
exports.getCartCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const cartItems = await CartItem.findAll({
      where: { userId },
      attributes: ["quantity"],
    });

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      data: {
        totalItems,
        uniqueItems: cartItems.length,
      },
    });
  } catch (error) {
    console.error("[ERROR] Get cart count failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get cart count",
    });
  }
};

// @desc    Move item to wishlist (optional feature)
// @route   POST /api/cart/:id/move-to-wishlist
// @access  Private
exports.moveToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // This would require a Wishlist model
    // For now, just remove from cart
    const cartItem = await CartItem.findOne({
      where: { id, userId },
      include: [{ model: Book, as: "book" }],
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: "Cart item not found",
      });
    }

    // TODO: Add to wishlist model if you create one

    await cartItem.destroy();

    res.json({
      success: true,
      message: "Item moved to wishlist",
      data: {
        book: cartItem.book,
      },
    });
  } catch (error) {
    console.error("[ERROR] Move to wishlist failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to move item to wishlist",
    });
  }
};
