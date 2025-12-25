module.exports = {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || "development",
    corsOptions: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
    },
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
    },
};