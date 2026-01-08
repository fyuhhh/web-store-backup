import db from '../config/database.js';

async function run() {
    try {
        const [cols] = await db.query("DESCRIBE termin_pembayaran");
        console.log("Structure of termin_pembayaran:");
        console.log(JSON.stringify(cols, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
