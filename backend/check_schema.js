
import db from './config/database.js';

async function checkSchema() {
    try {
        const [columns] = await db.query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'web_store' 
      AND COLUMN_NAME = 'biaya' 
      AND TABLE_NAME IN ('btb', 'btb_item');
    `);
        console.log(JSON.stringify(columns, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkSchema();
