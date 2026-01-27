import db from "./config/database.js";

async function traceItem() {
    const keyword = "KUAS";
    try {
        console.log(`=== Tracing item with keyword: ${keyword} ===`);

        // 1. Check in PR ITEM
        const [prItems] = await db.query(`SELECT id_PRItem, namaBarang, kodeBarang FROM pr_item WHERE namaBarang LIKE ? LIMIT 5`, [`%${keyword}%`]);
        console.log("\n--- PR Items ---");
        console.table(prItems);

        if (prItems.length > 0) {
            const id_PRItem = prItems[0].id_PRItem;

            // 2. Check in PO ITEM
            const [poItems] = await db.query(`SELECT id_POItem, id_PRItem, namaBarang FROM po_item WHERE id_PRItem = ?`, [id_PRItem]);
            console.log(`\n--- PO Items (linked to PRItem ${id_PRItem}) ---`);
            console.table(poItems);

            if (poItems.length > 0) {
                const id_POItem = poItems[0].id_POItem;

                // 3. Check in BTB ITEM
                const [btbItems] = await db.query(`SELECT id_btb_item, id_POItem, nama_barang FROM btb_item WHERE id_POItem = ?`, [id_POItem]);
                console.log(`\n--- BTB Items (linked to POItem ${id_POItem}) ---`);
                console.table(btbItems);

                // 4. Verify the JOIN query used in route
                const [joinResult] = await db.query(`
           SELECT 
            btb_item.id_btb_item,
            pr_item.kodeBarang
          FROM btb_item
          LEFT JOIN po_item ON btb_item.id_POItem = po_item.id_POItem
          LEFT JOIN pr_item ON po_item.id_PRItem = pr_item.id_PRItem
          WHERE btb_item.id_POItem = ?
        `, [id_POItem]);
                console.log(`\n--- JOIN Result for BTB Item ---`);
                console.table(joinResult);

            } else {
                console.log("No PO Item found for this PR Item.");
            }
        } else {
            console.log("No PR Item found.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

traceItem();
