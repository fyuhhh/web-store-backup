import db from '../config/database.js';

async function migrate() {
    try {
        // Check if spesifikasi column exists in mr_item
        const [columns] = await db.query("SHOW COLUMNS FROM mr_item LIKE 'spesifikasi'");
        if (columns.length === 0) {
            console.log("Adding column 'spesifikasi' to table 'mr_item'...");
            await db.query("ALTER TABLE mr_item ADD COLUMN spesifikasi TEXT DEFAULT NULL AFTER satuan");
            console.log("Column 'spesifikasi' added successfully!");
        } else {
            console.log("Column 'spesifikasi' already exists in 'mr_item'.");
        }
    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        process.exit();
    }
}

migrate();
