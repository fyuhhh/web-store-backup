import db from "./config/database.js";

async function checkChain() {
    try {
        const keyword = "BARANG 1";
        console.log(`=== Tracing Chain for '${keyword}' ===`);

        // 1. Get BTB Item
        const [btbItems] = await db.query(`
      SELECT id_btb_item, id_POItem, nama_barang 
      FROM btb_item 
      WHERE nama_barang = ?
      LIMIT 1
    `, [keyword]);

        if (btbItems.length === 0) {
            console.log("No BTB item found with exact name.");
            process.exit(0);
        }

        const btb = btbItems[0];
        console.log("BTB Item:", JSON.stringify(btb, null, 2));

        if (!btb.id_POItem) {
            console.log("BTB item has no PO Item linked.");
        } else {
            // 2. Get PO Item & PR Item
            const [rows] = await db.query(`
        SELECT 
          po_item.id_POItem,
          pr_item.id_PRItem,
          pr_item.kodeBarang,
          LENGTH(pr_item.kodeBarang) as len_kode
        FROM po_item
        LEFT JOIN pr_item ON po_item.id_PRItem = pr_item.id_PRItem
        WHERE po_item.id_POItem = ?
      `, [btb.id_POItem]);

            console.log("Linked PR Item via PO:", JSON.stringify(rows[0], null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkChain();
