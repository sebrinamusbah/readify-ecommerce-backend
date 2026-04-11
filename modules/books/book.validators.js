const validator = require("validator");

class BookValidator {
  validateCreate(data) {
    const errors = [];

    if (!data.title || data.title.trim().length < 2) {
      errors.push("Title is required (min 2 chars)");
    }

    if (!data.author || data.author.trim().length < 2) {
      errors.push("Author is required");
    }

    if (!data.price || isNaN(data.price) || Number(data.price) < 0) {
      errors.push("Valid price is required");
    }

    if (!data.categoryId) {
      errors.push("Category is required");
    }

    if (data.isbn && !validator.isISBN(data.isbn + "")) {
      errors.push("Invalid ISBN");
    }

    return errors;
  }

  validateStock(quantity) {
    if (quantity === undefined || isNaN(quantity)) {
      return "Invalid quantity";
    }
    if (Number(quantity) < 0) {
      return "Quantity cannot be negative";
    }
    return null;
  }
}

module.exports = new BookValidator();
