
import db from './config/database.js';

async function checkSchema() {
    try {
        const [btbCols] = await db.query("SHOW COLUMNS FROM btb LIKE 'biaya'");
        const [btbItemCols] = await db.query("SHOW COLUMNS FROM btb_item LIKE 'biaya'");

        console.log("BTB Columns:", btbCols);
        console.log("BTB Item Columns:", btbItemCols);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkSchema();
