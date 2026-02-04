
import db from '../config/database.js';

async function check() {
    try {
        const [rows] = await db.query("SHOW COLUMNS FROM activity_logs");
        rows.forEach(r => console.log(r.Field));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
