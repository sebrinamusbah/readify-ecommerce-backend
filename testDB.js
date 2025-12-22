const { Client } = require("pg");

// Use the DATABASE_URL from your environment variables
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Render PostgreSQL
});

async function testConnection() {
  try {
    await client.connect();
    console.log("✅ Successfully connected to the database!");

    // Optional: query the database to test
    const res = await client.query("SELECT NOW() AS current_time;");
    console.log("Database time:", res.rows[0].current_time);

    await client.end();
  } catch (err) {
    console.error("❌ Failed to connect to the database:", err);
  }
}

// Run the test
testConnection();
