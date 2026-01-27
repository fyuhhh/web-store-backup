import db from "./config/database.js";

async function checkSchema() {
    try {
        const [rows] = await db.query(`SHOW COLUMNS FROM pr_item`);
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkSchema();
