const express = require("express");
const controller = require("./media.controller");
const auth = require("../../middlewares/auth.middleware");

const router = express.Router();

// upload single file
router.post("/upload", auth, controller.upload);

// delete file
router.delete("/:id", auth, controller.remove);

// get user files
router.get("/", auth, controller.getMyFiles);

module.exports = router;