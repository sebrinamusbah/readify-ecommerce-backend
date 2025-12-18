const fs = require("fs");
const db = require("./db");

async function initDB() {
    const sql = fs.readFileSync("./database/database.sql", "utf8");
    try {
        await db.query(sql);
        console.log("Database initialized ✅");
    } catch (err) {
        console.error("DB init error:", err);
    }
}

initDB();