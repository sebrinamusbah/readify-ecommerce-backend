const router = require("express").Router();
const controller = require("./category.controller");
const auth = require("../../middlewares/auth");
const admin = require("../../middlewares/admin");

router.get("/", controller.getAll);
router.get("/summary", controller.summary);
router.get("/search", controller.search);
router.get("/:id", controller.getById);
router.get("/slug/:slug", controller.getBySlug);

router.post("/", auth, admin, controller.create);
router.post("/bulk", auth, admin, controller.bulkCreate);

router.patch("/:id", auth, admin, controller.update);
router.delete("/:id", auth, admin, controller.delete);

module.exports = router;
