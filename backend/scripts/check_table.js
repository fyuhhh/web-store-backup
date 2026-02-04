
import db from '../config/database.js';

async function check() {
    try {
        const [rows] = await db.query("DESCRIBE activity_logs");
        console.log(JSON.stringify(rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
