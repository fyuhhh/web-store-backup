
import db from '../config/database.js';

async function check() {
    try {
        const [rows] = await db.query("SHOW COLUMNS FROM activity_logs");
        console.log("Columns:", rows.map(r => r.Field).join(", "));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
