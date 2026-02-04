
import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// GET recent activity logs
router.get('/logs', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const [rows] = await db.query(
            `SELECT id, user_id as id_user, username as nama_pengguna, action as action_type, details, timestamp FROM activity_logs ORDER BY timestamp DESC LIMIT ?`,
            [limit]
        );
        res.json(rows);
    } catch (err) {
        console.error("Error fetching logs:", err);
        res.status(500).json({ error: "Failed to fetch logs" });
    }
});

// GET active users (simulated based on recent login/activity in last 15 mins)
router.get('/active-users', async (req, res) => {
    try {
        // Simple logic: Users who logged in or did an action in last 15 mins
        const [rows] = await db.query(
            `SELECT DISTINCT user_id as id_user, username as nama_pengguna, MAX(timestamp) as last_seen 
             FROM activity_logs 
             WHERE timestamp >= NOW() - INTERVAL 15 MINUTE 
             GROUP BY user_id, username`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch active users" });
    }

});

// GET statistics for chart (Activity volume per hour for last 24h)
router.get('/stats', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                DATE_FORMAT(timestamp, '%H:00') as time_bucket, 
                COUNT(*) as count 
            FROM activity_logs 
            WHERE timestamp >= NOW() - INTERVAL 24 HOUR 
            GROUP BY time_bucket 
            ORDER BY MAX(timestamp) ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error("Stats error:", err);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

export default router;
