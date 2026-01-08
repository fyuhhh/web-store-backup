import db from '../config/database.js';

async function run() {
    try {
        const [cols] = await db.query("DESCRIBE po");
        console.log("Structure of po:");
        console.log(JSON.stringify(cols.map(c => c.Field), null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
