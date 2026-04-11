const { body } = require("express-validator");

exports.createOrderValidator = [
  body("shippingAddress")
    .isString()
    .isLength({ min: 10 })
    .withMessage("Shipping address too short"),
  body("notes").optional().isString(),
];
