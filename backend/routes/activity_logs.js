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

// GET latest logs (e.g. limit 100, optional user_id filter)
router.get("/", async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const userId = req.query.user_id;

        let query = "SELECT id, user_id as id_user, username as nama_pengguna, action as action_type, details, timestamp FROM activity_logs";
        const params = [];

        if (userId) {
            query += " WHERE user_id = ?";
            params.push(userId);
        }

        query += " ORDER BY timestamp DESC LIMIT ?";
        params.push(limit);

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new log (can be called from frontend for client-side actions)
router.post("/", async (req, res) => {
    try {
        const { user_id, username, action, details } = req.body;
        const [result] = await db.query(
            "INSERT INTO activity_logs (user_id, username, action, details) VALUES (?, ?, ?, ?)",
            [user_id, username, action, details]
        );

        const newLogId = result.insertId;
        const newLog = {
            id: newLogId,
            id_user: user_id,
            nama_pengguna: username,
            action_type: action,
            details: details,
            timestamp: new Date().toISOString()
        };

        const io = req.app.get("io");
        if (io) {
            io.to("monitoring").emit("activity_log", newLog);
        }

        res.json({ message: "Log saved", id: newLogId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
