
import db from '../config/database.js';

const createTableQuery = `
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT NULL,
    nama_pengguna VARCHAR(255),
    action_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NULL COMMENT 'ID of the affected entity (e.g., PR Number)',
    details TEXT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    INDEX idx_user (id_user)
);
`;

const run = async () => {
    try {
        await db.query(createTableQuery);
        console.log("Table 'activity_logs' created or already exists.");
        process.exit(0);
    } catch (err) {
        console.error("Error creating table:", err);
        process.exit(1);
    }
};

run();
