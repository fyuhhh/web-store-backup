import db from "./config/database.js";

async function migrate() {
    try {
        console.log("Starting migration: Add noMR to pr table...");

        // 1. Check if column exists
        const [columns] = await db.query("SHOW COLUMNS FROM pr LIKE 'noMR'");
        if (columns.length === 0) {
            console.log("Adding noMR column to pr table...");
            await db.query("ALTER TABLE pr ADD COLUMN noMR VARCHAR(255) DEFAULT NULL AFTER id_divisi");
            console.log("Column noMR added.");
        } else {
            console.log("Column noMR already exists.");
        }

        // 2. Migrate data from pr_item
        console.log("Migrating existing noMR data from pr_item to pr...");
        // Strategy: Take the first non-empty noMR found for each PR
        const query = `
      UPDATE pr p 
      JOIN (
        SELECT id_PR, MAX(noMR) as mNoMR 
        FROM pr_item 
        WHERE noMR IS NOT NULL AND noMR != '' 
        GROUP BY id_PR
      ) pi ON p.id_PR = pi.id_PR 
      SET p.noMR = pi.mNoMR
      WHERE p.noMR IS NULL OR p.noMR = ''
    `;

        const [result] = await db.query(query);
        console.log(`Migration complete. Updated ${result.changedRows} rows.`);

        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
