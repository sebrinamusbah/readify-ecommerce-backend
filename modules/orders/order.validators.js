exports.generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

exports.calculateTotals = (items) => {
  let total = 0;

  for (const item of items) {
    total += item.price * item.quantity;
  }

  return total;
};
