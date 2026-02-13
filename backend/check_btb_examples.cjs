
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web_store_db'
};

async function checkBTBData() {
    console.log("Connecting to DB...");
    const conn = await mysql.createConnection(dbConfig);

    // Check BTB 00037 and 00070
    // Try to find them by no_btb partial match
    const btbNumbers = ['00037', '00070'];

    try {
        for (const num of btbNumbers) {
            console.log(`\nSearching for BTB *${num}*...`);
            const [btbs] = await conn.query("SELECT * FROM btb WHERE no_btb LIKE ?", [`%${num}%`]);

            if (btbs.length === 0) {
                console.log("Not found.");
                continue;
            }

            const btb = btbs[0];
            console.log(`FOUND BTB: ID ${btb.id_btb}, No: ${btb.no_btb}, Date: ${btb.tanggal_btb}`);

            // Get Items
            const [items] = await conn.query("SELECT * FROM btb_item WHERE id_btb = ?", [btb.id_btb]);
            console.log(`Items count: ${items.length}`);

            for (const item of items) {
                console.log(`  - BTB Item ID: ${item.id_btb_item}, PO Item ID: ${item.id_POItem}, Qty: ${item.jumlah_diterima}`);

                // Get PO Info
                const [pos] = await conn.query("SELECT p.noPO, pi.id_PRItem FROM po_item pi JOIN po p ON pi.id_PO = p.id_PO WHERE pi.id_POItem = ?", [item.id_POItem]);
                if (pos.length > 0) {
                    const po = pos[0];
                    console.log(`    -> Linked to PO: ${po.noPO}`);
                    console.log(`    -> Linked to PR Item ID: ${po.id_PRItem}`);

                    if (po.id_PRItem) {
                        const [prs] = await conn.query("SELECT pr.noPR FROM pr_item pi JOIN pr ON pi.id_PR = pr.id_PR WHERE id_PRItem = ?", [po.id_PRItem]);
                        if (prs.length > 0) {
                            console.log(`    -> Linked to PR: ${prs[0].noPR}`);
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await conn.end();
    }
}

checkBTBData();
