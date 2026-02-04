const mysql = require('mysql2/promise');
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web_store_db'
};

async function fixPO() {
    const conn = await mysql.createConnection(dbConfig);

    // Target POs
    const targetPOs = ['PO/E-WALK/WBL/25/XII/00012', 'PO/E-WALK/WBL/25/XII/00035'];

    try {
        await conn.beginTransaction();

        for (const noPO of targetPOs) {
            console.log(`\nProcessing ${noPO}...`);
            const [[po]] = await conn.query("SELECT id_PO FROM po WHERE noPO = ?", [noPO]);
            if (!po) { console.log("PO not found"); continue; }

            const [items] = await conn.query("SELECT * FROM po_item WHERE id_PO = ?", [po.id_PO]);

            let allItemsFull = true;

            for (const item of items) {
                // Get Total Received from BTB
                const [btbItems] = await conn.query("SELECT jumlah_diterima FROM btb_item WHERE id_POItem = ?", [item.id_POItem]);
                const totalReceived = btbItems.reduce((sum, b) => sum + parseFloat(b.jumlah_diterima), 0);

                // Get Total Ordered (jumlahAsli preferred)
                // If jumlahAsli is 0/null, assume jumlahPO was the original if no BTB existed? 
                // Checks showed jumlahAsli: 5000. So we rely on it.
                // Fallback: if jumlahAsli is 0, maybe use (jumlahPO + totalReceived)?
                let ordered = parseFloat(item.jumlahAsli);
                if (!ordered) {
                    // Try to infer
                    ordered = parseFloat(item.jumlahPO) + totalReceived;
                }

                const newRemaining = Math.max(0, ordered - totalReceived);

                console.log(`  Item ${item.id_POItem}: Ordered ${ordered}, Received ${totalReceived}. New Remaining: ${newRemaining}`);

                await conn.query("UPDATE po_item SET jumlahPO = ? WHERE id_POItem = ?", [newRemaining, item.id_POItem]);

                if (newRemaining > 0) allItemsFull = false;
            }

            // Force Status Update
            // User requested "PART COMPLETE".
            // If all items full, it fits "PART COMPLETE" (or FULL).
            // Logic in system might be "PART COMPLETE".
            if (allItemsFull) {
                await conn.query("UPDATE po SET status = 'PART COMPLETE' WHERE id_PO = ?", [po.id_PO]);
                console.log(`  Updated Status to PART COMPLETE`);
            } else {
                // Should be PARTIAL PO if some received?
                // Checking current behavior: if not all full, but some received -> "WAITING PART" or "PARTIAL"?
                // User specifically wanted "PART COMPLETE" for these.
                // Assuming they are full.
                console.log(`  Not all full? (Should be full for these specific POs). Status not forced.`);
            }
        }

        await conn.commit();
        console.log("\nSuccess. Updates committed.");

    } catch (err) {
        await conn.rollback();
        console.error("Error:", err);
    } finally {
        await conn.end();
    }
}

fixPO();
