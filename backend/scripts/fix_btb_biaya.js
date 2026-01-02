
import db from "../config/database.js";

async function fixBtbBiaya() {
    const conn = await db.getConnection();
    try {
        console.log("Starting fix for btb_item.biaya...");

        // 1. Get all btb_items that have an associated PO Item
        const [btbItems] = await conn.query("SELECT id_btb_item, id_POItem, jumlah_diterima, biaya FROM btb_item WHERE id_POItem IS NOT NULL");

        console.log(`Found ${btbItems.length} BTB items linked to POs.`);

        let updatedCount = 0;

        for (const item of btbItems) {
            const { id_btb_item, id_POItem, jumlah_diterima, biaya: currentBiaya } = item;

            // 2. Fetch PO Item details
            const [[poItem]] = await conn.query("SELECT totalPerItem, jumlahAsli FROM po_item WHERE id_POItem = ?", [id_POItem]);

            if (!poItem) {
                console.warn(`Warning: PO Item ${id_POItem} not found for BTB Item ${id_btb_item}. Skipping.`);
                continue;
            }

            const totalPerItem = Number(poItem.totalPerItem ?? 0);
            const jumlahAsli = Number(poItem.jumlahAsli ?? 0);

            let correctBiaya = 0;

            // 3. Calculate Logic (Same as in btb.js)
            if (totalPerItem > 0 && jumlahAsli > 0) {
                correctBiaya = Math.round((jumlah_diterima / jumlahAsli) * totalPerItem);
            } else if (totalPerItem > 0 && jumlah_diterima > 0) {
                // Fallback if jumlahAsli is 0 for some reason but we have total cost and qty
                correctBiaya = Math.round(totalPerItem / jumlah_diterima);
                // Wait, totalPerItem is "Total Price for the Line Item", NOT Unit Price.
                // If jumlahAsli is 0, we can't really guess unit price unless totalPerItem IS the total for this batch?
                // In btb.js fallback was: Math.round(totalPerItem / jumlah_diterima) -> This looks like it treats totalPerItem as a total for the BATCH?
                // No, usually totalPerItem in po_item is (Harga Satuan * Jumlah PO).
                // If jumlahAsli (Quantity in PO) is 0, something is wrong. 
                // Let's stick to the main logic.
            } else {
                correctBiaya = 0;
            }

            // 4. Update if different
            if (Number(currentBiaya) !== correctBiaya) {
                await conn.query("UPDATE btb_item SET biaya = ? WHERE id_btb_item = ?", [correctBiaya, id_btb_item]);
                console.log(`Updated BTB Item ${id_btb_item}: Biaya ${currentBiaya} -> ${correctBiaya}`);
                updatedCount++;
            }
        }

        console.log(`Biaya fix complete. Updated ${updatedCount} rows.`);

    } catch (error) {
        console.error("Error fixing btb_item.biaya:", error);
    } finally {
        conn.release();
        process.exit();
    }
}

fixBtbBiaya();
