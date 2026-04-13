const express = require("express");
const controller = require("./review.controller");
const auth = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");

const {
    createReviewSchema,
    updateReviewSchema,
} = require("./review.validators");

const router = express.Router();

// public
router.get("/book/:bookId", controller.getBookReviews);

// protected
router.post("/", auth, validate(createReviewSchema), controller.createReview);
router.put("/:id", auth, validate(updateReviewSchema), controller.updateReview);
router.delete("/:id", auth, controller.deleteReview);

module.exports = router;