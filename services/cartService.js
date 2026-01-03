const { CartItem, Book, User } = require("../models");
const { Op } = require("sequelize");

class CartService {
  // Get user's cart
  async getUserCart(userId) {
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
    const total = parseFloat((subtotal + parseFloat((subtotal * taxRate).toFixed(2))).toFixed(2));

    return {
      items,
      summary: {
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax,
        total,
        totalItems,
      },
    };
  }

  // Add item to cart
  async addToCart(userId, bookId, quantity = 1) {
    // Check if book exists and is in stock
    const book = await Book.findByPk(bookId);
    if (!book) {
      throw new Error("Book not found");
    }

    if (book.stock < quantity) {
      throw new Error(`Only ${book.stock} items available in stock`);
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
        throw new Error(
          `Cannot add ${quantity} more. Only ${
            book.stock - cartItem.quantity
          } available.`
        );
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

    return {
      id: updatedCartItem.id,
      bookId: updatedCartItem.bookId,
      quantity: updatedCartItem.quantity,
      book: updatedCartItem.book,
      itemTotal: parseFloat(
        (updatedCartItem.quantity * updatedCartItem.book.price).toFixed(2)
      ),
    };
  }

  // Update cart item quantity
  async updateCartItem(userId, cartItemId, quantity) {
    // Find cart item
    const cartItem = await CartItem.findOne({
      where: { id: cartItemId, userId },
      include: [
        {
          model: Book,
          as: "book",
        },
      ],
    });

    if (!cartItem) {
      throw new Error("Cart item not found");
    }

    // If quantity is 0, remove item
    if (quantity === 0) {
      await cartItem.destroy();
      return null;
    }

    // Check stock availability
    if (cartItem.book.stock < quantity) {
      throw new Error(`Only ${cartItem.book.stock} items available in stock`);
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

    return {
      id: updatedCartItem.id,
      bookId: updatedCartItem.bookId,
      quantity: updatedCartItem.quantity,
      book: updatedCartItem.book,
      itemTotal: parseFloat(
        (updatedCartItem.quantity * updatedCartItem.book.price).toFixed(2)
      ),
    };
  }

  // Remove item from cart
  async removeFromCart(userId, cartItemId) {
    const cartItem = await CartItem.findOne({
      where: { id: cartItemId, userId },
    });

    if (!cartItem) {
      throw new Error("Cart item not found");
    }

    await cartItem.destroy();
  }

  // Clear entire cart
  async clearCart(userId) {
    await CartItem.destroy({
      where: { userId },
    });
  }

  // Get cart count
  async getCartCount(userId) {
    const cartItems = await CartItem.findAll({
      where: { userId },
      attributes: ["quantity"],
    });

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      totalItems,
      uniqueItems: cartItems.length,
    };
  }

  // Move item to wishlist
  async moveToWishlist(userId, cartItemId) {
    const cartItem = await CartItem.findOne({
      where: { id: cartItemId, userId },
      include: [{ model: Book, as: "book" }],
    });

    if (!cartItem) {
      throw new Error("Cart item not found");
    }

    // TODO: Implement wishlist functionality
    // For now, just remove from cart
    await cartItem.destroy();

    return {
      book: cartItem.book,
    };
  }

  // Helper: Calculate cart totals
  calculateCartTotals(items) {
    let subtotal = 0;
    let totalItems = 0;

    items.forEach((item) => {
      const itemTotal = item.quantity * item.book.price;
      subtotal += itemTotal;
      totalItems += item.quantity;
    });

    const taxRate = 0.1;
    const tax = parseFloat((subtotal * taxRate).toFixed(2));
    const total = parseFloat((subtotal + parseFloat((subtotal * taxRate).toFixed(2))).toFixed(2));

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax,
      total,
      totalItems,
    };
  }
}

module.exports = new CartService();
