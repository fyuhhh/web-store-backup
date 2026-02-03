import express from "express";
import db from "../config/database.js";

const router = express.Router();

// Ensure table exists
export async function ensureActivityLogTable() {
    try {
        await db.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        username VARCHAR(255),
        action VARCHAR(255),
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log("Activity Logs table ensured.");
    } catch (err) {
        console.error("Error ensuring activity_logs table:", err);
    }
}

// GET latest logs (e.g. limit 100)
router.get("/", async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const [rows] = await db.query(
            "SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT ?",
            [limit]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new log (can be called from frontend for client-side actions)
router.post("/", async (req, res) => {
    try {
        const { user_id, username, action, details } = req.body;
        await db.query(
            "INSERT INTO activity_logs (user_id, username, action, details) VALUES (?, ?, ?, ?)",
            [user_id, username, action, details]
        );
        res.json({ message: "Log saved" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
