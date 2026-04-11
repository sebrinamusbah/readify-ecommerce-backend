const { sequelize } = require("../config/db");
require("../models");

async function setupDatabase() {
    try {
        console.log("🚀 Connecting to database...");

        // 1. Connect
        await sequelize.authenticate();
        console.log("✅ Database connected");

        // 2. DO NOT create schema (default = public)

        // 3. Sync models to public schema
        await sequelize.sync({
            force: false, // safe mode
            alter: false, // no auto changes
        });

        console.log("✅ Tables created in public schema");

        // 4. Show tables
        const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

        console.log("\n📊 Tables created:");
        tables.forEach((t) => console.log("   •", t.table_name));

        console.log(`\n🎉 Done! ${tables.length} tables ready in public schema`);

        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}

setupDatabase();