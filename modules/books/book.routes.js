const router = require("express").Router();
const controller = require("./book.controller");
const upload = require("../../shared/middleware/upload");

// ADMIN ROUTES
router.post("/", upload.single("image"), controller.createBook);
router.put("/:id", upload.single("image"), controller.updateBook);
router.delete("/:id", controller.deleteBook);
router.patch("/:id/stock", controller.updateStock);

// STATS
router.get("/stats", controller.getStats);

module.exports = router;
