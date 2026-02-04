const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web_store_db'
};

async function checkSchema() {
    const conn = await mysql.createConnection(dbConfig);

    const poNos = ['PO/E-WALK/WBL/25/XII/00012', 'PO/E-WALK/WBL/25/XII/00035'];

    for (const noPO of poNos) {
        const [rows] = await conn.query("SELECT id_PO, noPO, id_skema FROM po WHERE noPO = ?", [noPO]);
        console.log(JSON.stringify(rows, null, 2));
    }

    await conn.end();
}

checkSchema();
