
import db from './config/database.js';

const fixStatusColumn = async () => {
    try {
        console.log("Checking pr table status column items...");
        const [rows] = await db.query("SHOW COLUMNS FROM pr LIKE 'status'");
        console.log("Current Column Definition:", JSON.stringify(rows[0], null, 2));

        console.log("Altering status column to VARCHAR(50)...");
        await db.query("ALTER TABLE pr MODIFY COLUMN status VARCHAR(50) DEFAULT 'WAITING PO'");
        console.log("Successfully altered status column.");

        // Re-check
        const [rowsEnd] = await db.query("SHOW COLUMNS FROM pr LIKE 'status'");
        console.log("New Column Definition:", JSON.stringify(rowsEnd[0], null, 2));

        process.exit(0);
    } catch (error) {
        console.error("Error altering table:", error);
        process.exit(1);
    }
};

fixStatusColumn();
