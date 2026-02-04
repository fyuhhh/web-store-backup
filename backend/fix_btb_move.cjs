const mysql = require('mysql2/promise');
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web_store_db'
};

async function fixData() {
    const conn = await mysql.createConnection(dbConfig);

    const btbNo = 'BTB/E-WALK/26/I/026';
    const targetPONo = 'PO/E-WALK/WBL/25/XII/00035';

    console.log(`Attempting to move ${btbNo} to ${targetPONo}`);

    try {
        await conn.beginTransaction();

        // 1. Get BTB Item Info
        const [btbItems] = await conn.query(
            "SELECT bi.*, b.no_btb FROM btb_item bi JOIN btb b ON bi.id_btb = b.id_btb WHERE b.no_btb = ?",
            [btbNo]
        );

        if (btbItems.length !== 1) {
            throw new Error("BTB not found or has multiple items (logic only handles 1 for safety)");
        }

        const btbItem = btbItems[0];
        const sourcePOItemId = btbItem.id_POItem;
        const qty = parseFloat(btbItem.jumlah_diterima);

        console.log(`Found BTB Item. Qty: ${qty}, Current PO Item ID: ${sourcePOItemId}`);

        // 2. Get Source PO Item Info (to check PR Item ID)
        const [[sourcePOItem]] = await conn.query("SELECT * FROM po_item WHERE id_POItem = ?", [sourcePOItemId]);
        if (!sourcePOItem) throw new Error("Source PO Item not found");

        const prItemId = sourcePOItem.id_PRItem;
        console.log(`Source PO Item linked to PR Item ID: ${prItemId}`);

        // 3. Get Target PO ID
        const [[targetPO]] = await conn.query("SELECT id_PO FROM po WHERE noPO = ?", [targetPONo]);
        if (!targetPO) throw new Error("Target PO not found");

        // 4. Find Matching Target PO Item (Same PR Item)
        const [targetPOItems] = await conn.query(
            "SELECT * FROM po_item WHERE id_PO = ? AND id_PRItem = ?",
            [targetPO.id_PO, prItemId]
        );

        if (targetPOItems.length !== 1) {
            throw new Error("Target PO does not have exactly one matching item for this PR Item.");
        }

        const targetPOItem = targetPOItems[0];
        console.log(`Found Matching Target PO Item ID: ${targetPOItem.id_POItem}. Current Remaining: ${targetPOItem.jumlahPO}`);

        if (parseFloat(targetPOItem.jumlahPO) < qty) {
            console.warn("Warning: Moving this BTB will result in negative remaining quantity on Target PO. Proceeding anyway as it likely fixes an error.");
        }

        // 5. Execute Updates

        // A. Update BTB Item to point to Target
        await conn.query("UPDATE btb_item SET id_POItem = ? WHERE id_btb_item = ?", [targetPOItem.id_POItem, btbItem.id_btb_item]);
        console.log("Updated BTB Item FK.");

        // B. Restore Source PO Item Qty (Add back)
        await conn.query("UPDATE po_item SET jumlahPO = jumlahPO + ? WHERE id_POItem = ?", [qty, sourcePOItemId]);
        console.log("Restored Source PO Item Qty.");

        // C. Consume Target PO Item Qty (Subtract)
        // Ensure not negative? `GREATEST(0, ...)` ?
        // If pending is 5000 and we receive 5000, it becomes 0.
        await conn.query("UPDATE po_item SET jumlahPO = GREATEST(0, jumlahPO - ?) WHERE id_POItem = ?", [qty, targetPOItem.id_POItem]);
        console.log("Consumed Target PO Item Qty.");

        // D. Update Statuses
        // Need to import helper? No, we can just run a query or assume 'PARTIAL'/'FULL'.
        // Or update timestamps?
        // Let's manually set status for safety if we can't import helper easily in this script.
        // Actually, let's just commit data. The Status Helper logic runs on app usage.
        // Or we can simple set status based on `jumlahPO`.

        // Check Source Qty
        const [[newSource]] = await conn.query("SELECT jumlahPO, jumlahAsli FROM po_item WHERE id_POItem = ?", [sourcePOItemId]);
        // If remaining > 0 -> WAITING PART (or PARTIAL). 
        // If we restored it, it might be full again.

        // Check Target Qty
        const [[newTarget]] = await conn.query("SELECT jumlahPO FROM po_item WHERE id_POItem = ?", [targetPOItem.id_POItem]);
        // If 0, likely COMPLETE.

        await conn.commit();
        console.log("Transaction Committed. Fix Applied.");

    } catch (err) {
        await conn.rollback();
        console.error("Error applying fix:", err.message);
    } finally {
        await conn.end();
    }
}

fixData();
