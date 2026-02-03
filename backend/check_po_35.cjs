const mysql = require('mysql2/promise');
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web_store_db'
};

async function checkPO() {
    const conn = await mysql.createConnection(dbConfig);

    const noPO = 'PO/E-WALK/WBL/25/XII/00035';
    console.log(`Checking ${noPO}`);

    // Get PO ID
    const [pos] = await conn.query("SELECT * FROM po WHERE noPO = ?", [noPO]);
    if (pos.length === 0) {
        console.log("PO not found");
        return;
    }
    const po = pos[0];
    console.log("PO Found:", po.id_PO);

    // Get Items
    const [items] = await conn.query("SELECT * FROM po_item WHERE id_PO = ?", [po.id_PO]);
    console.log(JSON.stringify(items, null, 2));

    await conn.end();
}

checkPO();
