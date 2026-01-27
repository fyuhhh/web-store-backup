import db from "./config/database.js";

async function checkColumn() {
    try {
        const [rows] = await db.query("SHOW COLUMNS FROM pr_item LIKE 'kodeBarang'");
        console.log("Column check result:", JSON.stringify(rows));

        // Also check lowercase just in case
        const [rowsLower] = await db.query("SHOW COLUMNS FROM pr_item LIKE 'kodebarang'");
        console.log("Column lower check:", JSON.stringify(rowsLower));

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkColumn();
