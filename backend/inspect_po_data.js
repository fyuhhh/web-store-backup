
import db from './config/database.js';

async function inspectData() {
    try {
        const noPO = 'PO/E-WALK/WBL/25/XII/00009';
        console.log(`Searching for PO: ${noPO}`);

        const [poRows] = await db.query("SELECT * FROM po WHERE noPO = ?", [noPO]);
        if (poRows.length === 0) {
            console.log("PO not found!");
            process.exit(0);
        }
        const po = poRows[0];
        console.log("PO Found:", { id_PO: po.id_PO, total: po.total });

        const [poItems] = await db.query("SELECT * FROM po_item WHERE id_PO = ?", [po.id_PO]);
        console.log(`Found ${poItems.length} PO Items.`);

        for (const item of poItems) {
            console.log(`\nPO Item [${item.id_POItem}]: ${item.nama_barang}`);
            console.log(`  Qty: ${item.jumlahAsli}, TotalPerItem: ${item.totalPerItem}`);

            const [btbItems] = await db.query("SELECT * FROM btb_item WHERE id_POItem = ?", [item.id_POItem]);
            if (btbItems.length > 0) {
                console.log(`  Associated BTB Items:`);
                btbItems.forEach(bi => {
                    console.log(`    BTB Item [${bi.id_btb_item}]: Qty: ${bi.jumlah_diterima}, Biaya: ${bi.biaya}`);
                });
            } else {
                console.log("  No BTB Items found.");
            }
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

inspectData();
