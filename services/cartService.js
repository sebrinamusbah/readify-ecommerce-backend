const { CartItem, Book } = require("../models");

class CartService {
    // Get cart items for user
    async getCart(userId) {
        const cartItems = await CartItem.findAll({
            where: { userId },
            include: [{
                model: Book,
                attributes: ["id", "title", "author", "price", "coverImage", "stock"],
            }, ],
        });

        // Calculate totals
        let subtotal = 0;
        let itemCount = 0;

        const items = cartItems.map((item) => {
            const itemTotal = item.Book.price * item.quantity;
            subtotal += itemTotal;
            itemCount += item.quantity;

            return {
                id: item.id,
                quantity: item.quantity,
                book: item.Book,
                itemTotal: parseFloat(itemTotal.toFixed(2)),
            };
        });

        return {
            items,
            subtotal: parseFloat(subtotal.toFixed(2)),
            itemCount,
            totalItems: cartItems.length,
        };
    }

    // Add item to cart
    async addToCart(userId, bookId, quantity = 1) {
        // Check book exists and has stock
        const book = await Book.findByPk(bookId);
        if (!book) {
            throw new Error("Book not found");
        }

        if (book.stock < quantity) {
            throw new Error("Insufficient stock");
        }

        // Check if item already in cart
        let cartItem = await CartItem.findOne({
            where: { userId, bookId },
        });

        if (cartItem) {
            // Update quantity
            cartItem.quantity += parseInt(quantity);
            await cartItem.save();
        } else {
            // Create new cart item
            cartItem = await CartItem.create({
                userId,
                bookId,
                quantity: parseInt(quantity),
            });
        }

        return cartItem;
    }

    // Update cart item quantity
    async updateCartItem(userId, cartItemId, quantity) {
        const cartItem = await CartItem.findOne({
            where: { id: cartItemId, userId },
            include: [Book],
        });

        if (!cartItem) {
            throw new Error("Cart item not found");
        }

        // Check stock
        if (cartItem.Book.stock < quantity) {
            throw new Error("Insufficient stock");
        }

        cartItem.quantity = quantity;
        await cartItem.save();

        return cartItem;
    }

    // Remove item from cart
    async removeCartItem(userId, cartItemId) {
        const cartItem = await CartItem.findOne({
            where: { id: cartItemId, userId },
        });

        if (!cartItem) {
            throw new Error("Cart item not found");
        }

        await cartItem.destroy();
        return true;
    }

    // Clear cart
    async clearCart(userId) {
        await CartItem.destroy({
            where: { userId },
        });

        return true;
    }

    // Move cart to order (empty cart after order)
    async checkoutCart(userId) {
        const cart = await this.getCart(userId);

        if (cart.items.length === 0) {
            throw new Error("Cart is empty");
        }

        // Clear cart
        await this.clearCart(userId);

        return cart;
    }

    // Get cart item count
    async getCartItemCount(userId) {
        const count = await CartItem.count({
            where: { userId },
        });

        return count;
    }

    // Check cart items stock
    async validateCartStock(userId) {
        const cartItems = await CartItem.findAll({
            where: { userId },
            include: [Book],
        });

        const errors = [];

        for (const item of cartItems) {
            if (item.Book.stock < item.quantity) {
                errors.push({
                    bookId: item.bookId,
                    bookTitle: item.Book.title,
                    requested: item.quantity,
                    available: item.Book.stock,
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

module.exports = new CartService();