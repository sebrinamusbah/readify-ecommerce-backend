const { body } = require("express-validator");

exports.createCategoryValidator = [
  body("name").isString().isLength({ min: 2 }),
  body("description").optional().isString(),
];

exports.updateCategoryValidator = [
  body("name").optional().isString().isLength({ min: 2 }),
  body("description").optional().isString(),
];
