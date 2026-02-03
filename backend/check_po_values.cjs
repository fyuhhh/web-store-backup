const mysql = require('mysql2/promise');
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web_store_db'
};

async function checkValues() {
    const conn = await mysql.createConnection(dbConfig);

    const poNos = ['PO/E-WALK/WBL/25/XII/00012', 'PO/E-WALK/WBL/25/XII/00035'];

    for (const noPO of poNos) {
        console.log(`\n--- Checking ${noPO} ---`);
        const [pos] = await conn.query("SELECT * FROM po WHERE noPO = ?", [noPO]);
        if (pos.length === 0) { console.log("Not found"); continue; }
        const po = pos[0];
        // console.log(`PO ID: ${po.id_PO}, Status: ${po.status}`);

        const [items] = await conn.query("SELECT * FROM po_item WHERE id_PO = ?", [po.id_PO]);

        // Fetch BTBs for items
        const enrichedItems = [];
        for (const item of items) {
            const [btbItems] = await conn.query("SELECT * FROM btb_item WHERE id_POItem = ?", [item.id_POItem]);
            enrichedItems.push({
                ...item,
                btbItems
            });
        }

        console.log({
            po: { id: po.id_PO, noPO: po.noPO, status: po.status },
            items: enrichedItems
        });
    }

    await conn.end();
}

checkValues();
