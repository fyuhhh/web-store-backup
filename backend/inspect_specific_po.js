
import db from './config/database.js';

async function inspectSpecific() {
    try {
        const noPO = 'PO/E-WALK/WBL/25/XII/00009';
        const [poRows] = await db.query("SELECT * FROM po WHERE noPO = ?", [noPO]);
        if (!poRows.length) { console.log("PO not found"); process.exit(0); }
        const po = poRows[0];

        const [items] = await db.query(`
      SELECT 
        pi.id_POItem, pi.totalPerItem, pi.jumlahAsli,
        bi.id_btb_item, bi.jumlah_diterima, bi.biaya AS btb_biaya
      FROM po_item pi
      LEFT JOIN btb_item bi ON pi.id_POItem = bi.id_POItem
      WHERE pi.id_PO = ?
    `, [po.id_PO]);

        console.log("Items:");
        items.forEach(item => {
            console.log(`PO Item ${item.id_POItem}: TotalPerItem=${item.totalPerItem}, QtyAsli=${item.jumlahAsli}`);
            console.log(`  -> BTB Item ${item.id_btb_item}: QtyReceive=${item.jumlah_diterima}, Biaya=${item.btb_biaya}`);

            // Check calculation
            const expected = (item.jumlah_diterima / item.jumlahAsli) * item.totalPerItem;
            console.log(`  -> Expected Biaya: ${expected}`);
            console.log(`  -> Diff: ${expected - item.btb_biaya}`);
        });
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

inspectSpecific();
