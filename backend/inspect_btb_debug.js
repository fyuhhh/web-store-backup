
import db from './config/database.js';

async function inspectBTB() {
    try {
        const noBTB = 'BTB/E-WALK/25/XII/020';
        console.log(`Inspecting ${noBTB}...`);

        const [btbRows] = await db.query("SELECT * FROM btb WHERE no_btb = ?", [noBTB]);
        if (!btbRows.length) { console.log("BTB not found"); process.exit(0); }
        const btb = btbRows[0];
        console.log(`BTB ID: ${btb.id_btb}, Biaya Header: ${btb.biaya}`);

        const [items] = await db.query(`
      SELECT id_btb_item, id_POItem, nama_barang, jumlah_diterima, biaya
      FROM btb_item
      WHERE id_btb = ?
    `, [btb.id_btb]);

        console.log("BTB Items:", JSON.stringify(items, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

inspectBTB();
