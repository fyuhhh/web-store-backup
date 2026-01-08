import db from '../config/database.js';

async function run() {
    try {
        console.log("Searching for PO with id_termin = 2...");
        const [rows] = await db.query("SELECT id_PO, noPO, id_termin FROM po WHERE id_termin = 2");
        if (rows.length > 0) {
            console.log("Found:", JSON.stringify(rows));
        } else {
            console.log("Not found any PO with id_termin=2");
            // Check count of non-null termin
            const [[count]] = await db.query("SELECT COUNT(*) as c FROM po WHERE id_termin IS NOT NULL");
            console.log("Count of non-null id_termin:", count.c);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
