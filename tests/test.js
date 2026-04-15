const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { Sequelize } = require("sequelize");

console.log("DB_URL =", process.env.DB_URL);

const sequelize = new Sequelize(process.env.DB_URL, {
    dialect: "postgres",
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
});

sequelize
    .authenticate()
    .then(() => console.log("DB Connected ✅"))
    .catch((err) => console.error("DB Error ❌", err));