import db from "./config/database.js";

async function checkJoins() {
    try {
        const [rows] = await db.query(`
      SELECT 
        btb_item.id_btb_item,
        btb_item.id_POItem,
        btb_item.nama_barang,
        po_item.id_POItem as found_id_POItem,
        po_item.id_PRItem,
        pr_item.id_PRItem as found_id_PRItem,
        pr_item.kodeBarang
      FROM btb_item
      LEFT JOIN po_item ON btb_item.id_POItem = po_item.id_POItem
      LEFT JOIN pr_item ON po_item.id_PRItem = pr_item.id_PRItem
      WHERE btb_item.id_POItem IS NOT NULL
      LIMIT 20
    `);

        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkJoins();
