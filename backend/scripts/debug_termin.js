import db from '../config/database.js';

async function run() {
    try {
        console.log("Checking termin_pembayaran table...");
        const [terms] = await db.query("SELECT * FROM termin_pembayaran");
        console.log(JSON.stringify(terms, null, 2));

        console.log("\nChecking po table (id_termin column)...");
        const [pos] = await db.query("SELECT id_PO, noPO, id_termin FROM po ORDER BY createdAt DESC LIMIT 5");
        console.log(JSON.stringify(pos, null, 2));

        console.log("\nChecking last 5 POs with joined termin:");
        const [rows] = await db.query(`
            SELECT po.id_PO, po.noPO, po.id_supplier, po.tanggalPO, po.id_termin, termin_pembayaran.termin
            FROM po 
            LEFT JOIN termin_pembayaran ON po.id_termin = termin_pembayaran.id_termin
            ORDER BY po.createdAt DESC LIMIT 5
        `);
        console.log(JSON.stringify(rows, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
