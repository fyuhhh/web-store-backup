
import db from './config/database.js';

async function checkData() {
    try {
        const [rows] = await db.query("SELECT id_btb_item, biaya FROM btb_item ORDER BY id_btb_item DESC LIMIT 5");
        console.log("Latest 5 BTB Items:", rows);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkData();
