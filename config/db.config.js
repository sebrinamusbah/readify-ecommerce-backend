require("dotenv").config();

module.exports = {
    development: {
        url: process.env.DB_URL,
        dialect: "postgres",
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    },
};