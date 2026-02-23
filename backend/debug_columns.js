
import db from "./config/database.js";

async function checkColumns() {
    try {
        const [rows] = await db.query("SHOW COLUMNS FROM mr_item");
        console.log("Columns in mr_item:");
        rows.forEach(r => console.log(r.Field));
        
        const [rows2] = await db.query("SHOW COLUMNS FROM mr");
        console.log("\nColumns in mr:");
        rows2.forEach(r => console.log(r.Field));
        
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

checkColumns();
