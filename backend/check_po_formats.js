import db from "./config/database.js";

async function run() {
    try {
        const [rows] = await db.query("SELECT noPO FROM po ORDER BY createdAt DESC LIMIT 10");
        console.log("Latest PO Samples:");
        console.log(rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

run();
