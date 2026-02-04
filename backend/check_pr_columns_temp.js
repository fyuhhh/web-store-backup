import db from './config/database.js';

async function checkPrColumns() {
    try {
        const [rows] = await db.query("SHOW COLUMNS FROM pr");
        console.log("Columns in 'pr' table:");
        rows.forEach(row => console.log(row.Field));
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkPrColumns();
