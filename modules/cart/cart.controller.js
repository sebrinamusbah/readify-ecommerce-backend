const service = require("./cart.service");

exports.getCart = async (req, res) => {
  try {
    const data = await service.getCart(req.user.id);
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { bookId, quantity } = req.body;
    const data = await service.addToCart(req.user.id, bookId, quantity);
    res.status(201).json({ success: true, data });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
