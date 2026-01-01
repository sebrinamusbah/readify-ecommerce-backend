// migrations/001-initial-schema.js
const { sequelize } = require("../config/db");

async function createTables() {
  try {
    console.log("🔄 Creating database tables...");

    // Authenticate first
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");

    // SYNC ALL TABLES - This creates Books, Categories, Users, etc.
    await sequelize.sync({ force: true });

    console.log("✅ Database tables created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating tables:", error.message);
    process.exit(1);
  }
}

createTables();
