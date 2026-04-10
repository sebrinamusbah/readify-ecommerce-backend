// config/db.js
const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false, // cleaner for production
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Test connection + set schema safely
const initDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to Neon PostgreSQL");

    // Set schema manually (IMPORTANT FIX)
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS project2;`);
    await sequelize.query(`SET search_path TO project2, public;`);

    console.log("🏗️ Schema ready: project2");
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
  }
};

initDB();

module.exports = { sequelize };
