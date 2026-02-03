const mysql = require('mysql2/promise');
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web_store_db'
};

async function checkData() {
    const conn = await mysql.createConnection(dbConfig);

    const btbNums = ['BTB/E-WALK/26/I/026'];

    for (const no_btb of btbNums) {
        console.log(`\n--- Checking ${no_btb} ---`);
        const [rows] = await conn.query(
            "SELECT b.id_btb, b.no_btb, bi.id_btb_item, bi.id_POItem, bi.jumlah_diterima, bi.biaya, p.noPO, p.id_PO FROM btb b JOIN btb_item bi ON b.id_btb = bi.id_btb JOIN po_item pi ON bi.id_POItem = pi.id_POItem JOIN po p ON pi.id_PO = p.id_PO WHERE b.no_btb = ?",
            [no_btb]
        );
        console.log(JSON.stringify(rows, null, 2));
    }

    await conn.end();
}

checkData();
