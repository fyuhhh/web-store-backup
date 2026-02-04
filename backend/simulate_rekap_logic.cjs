const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web_store_db'
};

async function simulate() {
    const conn = await mysql.createConnection(dbConfig);

    // 1. Fetch Data
    const [prData] = await conn.query("SELECT * FROM pr WHERE noPR LIKE '%/005'"); // Target PR 005
    if (prData.length === 0) { console.log("PR not found"); return; }
    const pr = prData[0];
    console.log(`PR: ${pr.noPR}, ID: ${pr.id_PR}`);

    const [prItems] = await conn.query("SELECT * FROM pr_item WHERE id_PR = ?", [pr.id_PR]);
    console.log(`PR Items: ${prItems.length}`);

    const [poItemsAll] = await conn.query("SELECT * FROM po_item");
    const [posAll] = await conn.query("SELECT * FROM po");

    const rekapRows = [];

    // 2. Logic MImic
    prItems.forEach((item, idx) => {
        console.log(`\nProcessing PR Item ${item.id_PRItem} (${item.namaBarang})`);

        const linkedPOItems = poItemsAll.filter(poi => String(poi.id_PRItem) === String(item.id_PRItem));
        console.log(`-> Linked PO Items: ${linkedPOItems.length}`);

        linkedPOItems.forEach(poi => {
            const po = posAll.find(p => String(p.id_PO) === String(poi.id_PO));
            console.log(`   -> Found PO Item ${poi.id_POItem} (PO ID: ${poi.id_PO}, No: ${po ? po.noPO : 'N/A'})`);
            if (po && po.noPO.includes("00035")) {
                console.log("      *** FOUND TARGET PO 035 ***");
            }
        });
    });

    await conn.end();
}

simulate();
