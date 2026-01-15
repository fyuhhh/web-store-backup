import db from "./config/database.js";

async function run() {
    try {
        const [prqRows] = await db.query("SELECT noPR FROM pr WHERE noPR LIKE 'PR/PRQ/%' ORDER BY createdAt DESC LIMIT 5");
        console.log("PRQ Samples:");
        console.log(prqRows);

        const [ewalkRows] = await db.query("SELECT noPR FROM pr WHERE noPR LIKE 'PR/E-WALK/%' ORDER BY createdAt DESC LIMIT 5");
        console.log("E-WALK Samples:");
        console.log(ewalkRows);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

run();
