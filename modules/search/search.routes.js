const express = require("express");
const controller = require("./search.controller");

const router = express.Router();

// public search endpoint
router.get("/", controller.searchBooks);

module.exports = router;