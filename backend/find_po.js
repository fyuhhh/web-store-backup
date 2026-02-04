
import db from './config/database.js';

async function findPO() {
    try {
        const [rows] = await db.query(`
      SELECT po.noPO 
      FROM btb_item 
      JOIN po_item ON btb_item.id_POItem = po_item.id_POItem
      JOIN po ON po_item.id_PO = po.id_PO
      WHERE btb_item.id_btb_item = 860
    `);
        console.log("Associated PO:", rows[0]);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

findPO();
