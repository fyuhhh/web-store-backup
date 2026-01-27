import db from "./config/database.js";

async function addColumns() {
    try {
        console.log("Adding columns to pr_item...");

        // Array of column definitions
        const columns = [
            "ADD COLUMN kodeBarang VARCHAR(255) NULL AFTER id_PR",
            "ADD COLUMN spesifikasi TEXT NULL AFTER namaBarang",
            "ADD COLUMN noMR VARCHAR(255) NULL AFTER spesifikasi"
        ];

        for (const colDef of columns) {
            try {
                await db.query(`ALTER TABLE pr_item ${colDef}`);
                console.log(`Success: ${colDef}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Skipped: Column already exists (${colDef})`);
                } else {
                    console.error(`Error adding column: ${err.message}`);
                }
            }
        }

        console.log("Migration complete.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

addColumns();
