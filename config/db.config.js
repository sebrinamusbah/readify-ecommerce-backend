const env = require("./env.config");

module.exports = {
    database: env.DB_NAME,
    username: env.DB_USER,
    password: env.DB_PASS,
    host: env.DB_HOST,
    dialect: "postgres", // or mysql

    logging: false,

    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
};