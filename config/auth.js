module.exports = {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || "7d",
    bcryptSaltRounds: 10,
    roles: {
        user: "user",
        admin: "admin",
    },
};