const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web_store_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function inspect() {
    console.log('Connecting to database...');
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);

        console.log('--- Inspecting PO ---');
        const [pos] = await conn.query("SELECT id_PO, noPO, estimasiTanggalTerima FROM po ORDER BY id_PO DESC LIMIT 10");
        console.table(pos);

        console.log('--- Inspecting BTB ---');
        const [btbs] = await conn.query("SELECT id_btb, no_btb, tanggal_btb, id_po, delay, targetPencapaianPo FROM btb ORDER BY id_btb DESC LIMIT 10");
        console.table(btbs);

        console.log('--- Inspecting Join ---');
        const [joined] = await conn.query(`
            SELECT 
                btb.no_btb, 
                btb.tanggal_btb, 
                po.noPO,
                po.estimasiTanggalTerima,
                btb.delay
            FROM btb
            LEFT JOIN po ON btb.id_po = po.id_PO
            ORDER BY btb.id_btb DESC
            LIMIT 10
        `);
        console.table(joined);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (conn) await conn.end();
    }
}

inspect();
