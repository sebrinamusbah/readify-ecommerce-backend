const app = require("./app");
const db = require("./models");
const logger = require("./shared/logger/logger");
const { sequelize } = db;

const PORT = process.env.PORT || 5000;

// =====================
// DATABASE CONNECTION
// =====================
const startServer = async() => {
    try {
        await sequelize.authenticate();
        logger.info("Database connected successfully");

        // optional in dev
        await sequelize.sync({ alter: false });

        // =====================
        // START SERVER
        // =====================
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    } catch (error) {
        logger.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();