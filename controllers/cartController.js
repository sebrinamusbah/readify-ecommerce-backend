const cartService = require("../services/cartService");

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await cartService.getUserCart(userId);

    res.json({
      success: true,
      data: {
        items: result.items,
        summary: result.summary,
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

    const result = await cartService.addToCart(userId, bookId, quantity);

    res.status(201).json({
      success: true,
      message: "Item added to cart",
      data: result,
    });
  } catch (error) {
    console.error("[ERROR] Add to cart failed:", error);

    if (error.message === "Book not found") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (
      error.message.includes("available in stock") ||
      error.message.includes("Only")
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

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

    const result = await cartService.updateCartItem(userId, id, quantity);

    if (quantity === 0) {
      return res.json({
        success: true,
        message: "Item removed from cart",
      });
    }

    res.json({
      success: true,
      message: "Cart updated",
      data: result,
    });
  } catch (error) {
    console.error("[ERROR] Update cart item failed:", error);

    if (error.message === "Cart item not found") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error.message.includes("available in stock")) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

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

    await cartService.removeFromCart(userId, id);

    res.json({
      success: true,
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("[ERROR] Remove from cart failed:", error);

    if (error.message === "Cart item not found") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

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

    await cartService.clearCart(userId);

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
    const result = await cartService.getCartCount(userId);

    res.json({
      success: true,
      data: result,
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

    const result = await cartService.moveToWishlist(userId, id);

    res.json({
      success: true,
      message: "Item moved to wishlist",
      data: {
        book: result.book,
      },
    });
  } catch (error) {
    console.error("[ERROR] Move to wishlist failed:", error);

    if (error.message === "Cart item not found") {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to move item to wishlist",
    });
  }
};
