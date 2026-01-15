import db from "./config/database.js";
async function check() {
    try {
        const [ewalk] = await db.query("SELECT noPR FROM pr WHERE noPR LIKE '%E-WALK%' LIMIT 5");
        const [pentacity] = await db.query("SELECT noPR FROM pr WHERE noPR LIKE '%PENTACITY%' LIMIT 5");
        const [prq] = await db.query("SELECT noPR FROM pr WHERE noPR LIKE '%PRQ%' LIMIT 5");

        console.log("E-WALK matches:", ewalk);
        console.log("PENTACITY matches:", pentacity);
        console.log("PRQ matches:", prq);
    } catch (err) {
        console.error(err);
    }
    process.exit();
}
check();
