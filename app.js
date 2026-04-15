const express = require("express");
const cors = require("cors");

const httpLogger = require("./shared/logger/httpLogger");
const rateLimit = require("./middlewares/rateLimit.middleware");

const errorMiddleware = require("./middlewares/error.middleware");

const routes = require("./api/routes");

const app = express();

// =====================
// GLOBAL MIDDLEWARES
// =====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "API is running 🚀" });
});

// security + logging
app.use(rateLimit);
//sanitize(app);
app.use(httpLogger);

// =====================
// API ROUTES
// =====================
app.use("/api", routes);

// =====================
// HEALTH CHECK
// =====================
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is healthy 🚀",
  });
});

// =====================
// ERROR HANDLER (LAST)
// =====================
app.use(errorMiddleware);

module.exports = app;
