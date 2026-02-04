
import db from '../config/database.js';

let ioInstance;

export const initLogger = (io) => {
    ioInstance = io;
};

export const logActivity = async (req, { action_type, entity_id, details, status }) => {
    try {
        // Try to get user from request (set by middleware if available, or manually passed)
        // Adjust based on your actual auth middleware
        const user = req.user || null;
        const id_user = user ? user.id_user : (req.body.id_user || null);
        const nama_pengguna = user ? user.nama_pengguna : (req.body.nama_pengguna || 'Unknown/System');

        const ip_address = req.ip || req.connection.remoteAddress;
        const user_agent = req.get('User-Agent');

        const detailStr = typeof details === 'object' ? JSON.stringify(details) : details;

        // DB Insert
        const [result] = await db.query(
            `INSERT INTO activity_logs (user_id, username, action, details) 
             VALUES (?, ?, ?, ?)`,
            [id_user, nama_pengguna, action_type, detailStr]
        );

        // Socket Emit
        if (ioInstance) {
            const logItem = {
                id: result.insertId,
                id_user, // For frontend compatibility (if needed)
                user_id: id_user,
                nama_pengguna,
                username: nama_pengguna,
                action_type,
                action: action_type,
                entity_id,
                details: detailStr,
                timestamp: new Date(),
                status: status || 'INFO'
            };
            ioInstance.emit('activity_new', logItem);

            // Allow separate channel for specific monitoring if needed
            ioInstance.to('monitoring').emit('activity_log', logItem);
        }

    } catch (err) {
        console.error("Failed to log activity:", err);
    }
};
