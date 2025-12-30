const db = require('../config/database.js').default;

async function run() {
    try {
        console.log("Finding AC Item...");

        // Find item via PR Item join
        const [rows] = await db.query(`
      SELECT pi.id_POItem, pri.namaBarang 
      FROM po_item pi
      JOIN pr_item pri ON pi.id_PRItem = pri.id_PRItem
      WHERE pri.namaBarang LIKE '%FUJIAIRE%'
    `);

        if (rows.length === 0) {
            console.log("Item not found using join.");
            // Fallback: Check if namaBarang is actually in po_item (unlikely but possible)
            // const [rows2] = await db.query("SELECT id_POItem FROM po_item WHERE namaBarang LIKE '%FUJIAIRE%'");
            // if (rows2.length > 0) { ... }
            process.exit(0);
        }

        const item = rows[0];
        console.log(`Found Item: ${item.id_POItem} - ${item.namaBarang}`);

        // Update Discount to string "50%+20%"
        // Price: 43.960.000
        // Qty: 1
        // Calculation:
        // 50% = 21,980,000. Rem: 21,980,000
        // 20% = 4,396,000. Rem: 17,584,000
        // Total Disc = 26,376,000.
        // PPN 11% of 17,584,000 = 1,934,240.
        // Total = 17,584,000 + 1,934,240 = 19,518,240.

        await db.query(`
      UPDATE po_item 
      SET diskonPersen = ?, 
          diskonRupiah = ?,
          ppnRupiah = ?,
          totalPerItem = ?
      WHERE id_POItem = ?
    `, [
            "50%+20%",
            26376000,
            1934240,
            19518240,
            item.id_POItem
        ]);

        console.log("Updated AC Item successfully.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
