const { CartItem, Book } = require("../models");
const { sequelize } = require("../models");

// ================= GET CART =================
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

    let subtotal = 0;
    let totalItems = 0;

    const items = cartItems.map((item) => {
      const price = item.book.price;
      const itemTotal = price * item.quantity;

      subtotal += itemTotal;
      totalItems += item.quantity;

      return {
        id: item.id,
        bookId: item.bookId,
        quantity: item.quantity,
        book: item.book,
        itemTotal: Number(itemTotal.toFixed(2)),
      };
    });

    const tax = Number((subtotal * 0.1).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    res.json({
      success: true,
      data: {
        items,
        summary: {
          subtotal,
          tax,
          total,
          totalItems,
        },
      },
    });
  } catch (error) {
    console.error("[CART GET ERROR]", error);
    res.status(500).json({ success: false, error: "Failed to fetch cart" });
  }
};

// ================= ADD TO CART (SAFE VERSION) =================
exports.addToCart = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { bookId, quantity = 1 } = req.body;

    if (!bookId) {
      return res.status(400).json({ error: "BookId required" });
    }

    const book = await Book.findByPk(bookId, { transaction: t });

    if (!book) {
      await t.rollback();
      return res.status(404).json({ error: "Book not found" });
    }

    if (book.stock < quantity) {
      await t.rollback();
      return res.status(400).json({
        error: `Only ${book.stock} items available`,
      });
    }

    let cartItem = await CartItem.findOne({
      where: { userId, bookId },
      transaction: t,
    });

    if (cartItem) {
      const newQty = cartItem.quantity + quantity;

      if (book.stock < newQty) {
        await t.rollback();
        return res.status(400).json({
          error: "Not enough stock",
        });
      }

      cartItem.quantity = newQty;
      await cartItem.save({ transaction: t });
    } else {
      cartItem = await CartItem.create(
        { userId, bookId, quantity },
        { transaction: t },
      );
    }

    await t.commit();

    const updated = await CartItem.findByPk(cartItem.id, {
      include: [{ model: Book, as: "book" }],
    });

    res.status(201).json({
      success: true,
      message: "Added to cart",
      data: updated,
    });
  } catch (error) {
    await t.rollback();
    console.error("[CART ADD ERROR]", error);
    res.status(500).json({ error: "Add to cart failed" });
  }
};

// ================= UPDATE CART =================
exports.updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const item = await CartItem.findOne({
      where: { id, userId: req.user.id },
      include: [{ model: Book, as: "book" }],
    });

    if (!item) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    if (quantity === 0) {
      await item.destroy();
      return res.json({ success: true, message: "Removed" });
    }

    if (item.book.stock < quantity) {
      return res.status(400).json({ error: "Not enough stock" });
    }

    item.quantity = quantity;
    await item.save();

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ error: "Update failed" });
  }
};

// ================= REMOVE =================
exports.removeFromCart = async (req, res) => {
  try {
    const deleted = await CartItem.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!deleted) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
};

// ================= CLEAR CART =================
exports.clearCart = async (req, res) => {
  try {
    await CartItem.destroy({ where: { userId: req.user.id } });

    res.json({ success: true, message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ error: "Clear failed" });
  }
};
