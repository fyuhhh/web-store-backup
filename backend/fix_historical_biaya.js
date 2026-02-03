
import db from './config/database.js';

async function fixHistoricalData() {
    try {
        console.log("Starting historical data fix (v2)...");

        // Find ALL BTB items that have an associated PO item
        // We will check them one by one in JS to avoid SQL complexity with types
        const [rows] = await db.query(`
      SELECT 
        bi.id_btb_item, 
        bi.biaya AS btb_biaya, 
        bi.jumlah_diterima,
        pi.totalPerItem AS po_total,
        pi.jumlahAsli AS po_qty,
        bi.id_btb
      FROM btb_item bi
      JOIN po_item pi ON bi.id_POItem = pi.id_POItem
      WHERE bi.jumlah_diterima > 0 AND pi.jumlahAsli > 0
    `);

        console.log(`Checking ${rows.length} BTB items...`);

        let updatedCount = 0;
        const btbIdsToUpdate = new Set();

        for (const row of rows) {
            const currentBiaya = Number(row.btb_biaya);
            const totalPerItem = Number(row.po_total);
            const jumlahAsli = Number(row.po_qty);
            const jumlah_diterima = Number(row.jumlah_diterima);

            // Calculate proportional cost
            const correctBiaya = (jumlah_diterima / jumlahAsli) * totalPerItem;

            // Check for difference
            // Use a small epsilon for float comparison, but enough to catch 0.15 vs 0.00
            const diff = Math.abs(correctBiaya - currentBiaya);

            if (diff > 0.01) {
                // It's different explicitly.
                // Check if the difference looks like it was because of rounding (int vs float)
                // OR if it's just wrong.
                // In this case, we TRUST the PO price as per user request ("tiru total harga").

                console.log(`[Item ${row.id_btb_item}] Fix: ${currentBiaya.toFixed(2)} -> ${correctBiaya.toFixed(2)} (Diff: ${diff.toFixed(2)})`);

                await db.query("UPDATE btb_item SET biaya = ? WHERE id_btb_item = ?", [correctBiaya, row.id_btb_item]);
                btbIdsToUpdate.add(row.id_btb);
                updatedCount++;
            }
        }

        console.log(`Updated ${updatedCount} BTB items.`);

        // Recalculate BTB Header totals
        if (btbIdsToUpdate.size > 0) {
            console.log(`Recalculating totals for ${btbIdsToUpdate.size} BTB headers...`);
            for (const btbId of btbIdsToUpdate) {
                const [[sumResult]] = await db.query("SELECT SUM(biaya) as total FROM btb_item WHERE id_btb = ?", [btbId]);
                const newTotal = Number(sumResult.total || 0);
                await db.query("UPDATE btb SET biaya = ? WHERE id_btb = ?", [newTotal, btbId]);
                console.log(`  BTB ${btbId} updated to ${newTotal.toFixed(2)}`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

fixHistoricalData();
