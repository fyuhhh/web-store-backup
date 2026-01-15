import db from "./config/database.js";
async function check() {
    try {
        const [rows] = await db.query("SELECT noPR FROM pr ORDER BY id_PR DESC LIMIT 10");
        console.log("Existing PR Numbers:");
        console.log(rows);
    } catch (err) {
        console.error(err);
    }
    process.exit();
}
check();
