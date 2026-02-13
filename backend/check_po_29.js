
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web_store_db'
};

async function checkPOData() {
    const conn = await mysql.createConnection(dbConfig);

    console.log("Searching for PO-PSV/WBL/26/I/00029...");

    try {
        // 1. Get PO
        const [pos] = await conn.query("SELECT * FROM po WHERE noPO LIKE '%/00029%'");
        if (pos.length === 0) {
            console.log("PO not found!");
            return;
        }
        const po = pos[0];
        console.log(`FOUND PO: ID ${po.id_PO}, No: ${po.noPO}`);

        // 2. Get PO Items
        const [poItems] = await conn.query("SELECT * FROM po_item WHERE id_PO = ?", [po.id_PO]);
        console.log(`PO Items Count: ${poItems.length}`);

        // 3. For each PO Item, get BTB Items
        for (const poi of poItems) {
            console.log(`\n--- PO Item ${poi.id_POItem} (Qty: ${poi.jumlahPO}) ---`);

            const [btbItems] = await conn.query("SELECT * FROM btb_item WHERE id_POItem = ?", [poi.id_POItem]);
            console.log(`Linked BTB Items: ${btbItems.length}`);

            if (btbItems.length > 0) {
                let totalRec = 0;
                for (const bi of btbItems) {
                    const [btb] = await conn.query("SELECT * FROM btb WHERE id_btb = ?", [bi.id_btb]);
                    console.log(`   > BTB Item ${bi.id_btb_item}: Qty Received ${bi.jumlah_diterima} (BTB No: ${btb[0]?.no_btb})`);
                    totalRec += Number(bi.jumlah_diterima);
                }
                console.log(`   > TOTAL RECEIVED: ${totalRec}`);

                if (btbItems.length > 1) {
                    console.log("   > [VERIFIED] Multiple BTBs exist. Before fix, this would show multiple rows.");
                    console.log("   > [EXPECTED] After fix, this checks as 1 Row with Qty = " + totalRec);
                }
            } else {
                console.log("   > No BTB Items found.");
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await conn.end();
    }
}

checkPOData();
