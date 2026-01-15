import db from "./config/database.js";
async function check() {
    try {
        const [rows] = await db.query("SELECT * FROM skema");
        console.log("Skemas:");
        console.log(rows);
    } catch (err) {
        console.error(err);
    }
    process.exit();
}
check();
