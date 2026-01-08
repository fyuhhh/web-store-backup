import db from '../config/database.js';

async function run() {
    try {
        const [rows] = await db.query("SELECT * FROM termin_pembayaran LIMIT 1");
        if (rows.length > 0) {
            console.log("Columns:", Object.keys(rows[0]));
        } else {
            console.log("Table empty, checking via describe");
            const [cols] = await db.query("SHOW COLUMNS FROM termin_pembayaran");
            console.log("Columns from SHOW:", cols.map(c => c.Field));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
