const express = require("express");
const v1Routes = require("./versioning/v1");

const router = express.Router();

// =====================
// VERSION ROUTES
// =====================
router.use("/v1", v1Routes);

// =====================
// DEFAULT ROUTE
// =====================
router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "API is running 🚀",
        versions: ["v1"],
    });
});

module.exports = router;