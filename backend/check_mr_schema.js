import db from './config/database.js';

async function checkSchema() {
    try {
        const [mrColumns] = await db.query("DESCRIBE mr");
        console.log("=== Table: mr ===");
        mrColumns.forEach(c => console.log(`${c.Field} (${c.Type})`));

        const [mrItemColumns] = await db.query("DESCRIBE mr_item");
        console.log("=== Table: mr_item ===");
        mrItemColumns.forEach(c => console.log(`${c.Field} (${c.Type})`));

    } catch (err) {
        console.error("Error describing tables:", err.message);
    } finally {
        process.exit();
    }
}

checkSchema();
