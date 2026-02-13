const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web_store_db'
};

async function diagnose() {
    console.log('Connecting...');
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);

        const [poCount] = await conn.query("SELECT COUNT(*) as total, COUNT(estimasiTanggalTerima) as with_est FROM po");
        console.log('PO Counts:', poCount[0]);

        const [btbCount] = await conn.query("SELECT COUNT(*) as total, COUNT(delay) as with_delay FROM btb");
        console.log('BTB Counts:', btbCount[0]);

        const [joinCount] = await conn.query(`
            SELECT COUNT(*) as total_joined, COUNT(po.estimasiTanggalTerima) as with_est_joined
            FROM btb
            LEFT JOIN po ON btb.id_po = po.id_PO
        `);
        console.log('Join Counts:', joinCount[0]);

        // Check a few BTBs with delay but NO joined estimate
        const [weird] = await conn.query(`
            SELECT btb.no_btb, btb.delay, po.id_PO, po.estimasiTanggalTerima
            FROM btb
            LEFT JOIN po ON btb.id_po = po.id_PO
            WHERE btb.delay IS NOT NULL AND po.estimasiTanggalTerima IS NULL
            LIMIT 5
        `);
        if (weird.length > 0) {
            console.log('Weird BTBs (Has Delay but No Est in PO):');
            console.table(weird);
        }

        // Check formats of dates
        const [dates] = await conn.query(`SELECT estimasiTanggalTerima FROM po WHERE estimasiTanggalTerima IS NOT NULL LIMIT 3`);
        console.log('Sample Est Dates:', dates);

    } catch (err) {
        console.error(err);
    } finally {
        if (conn) await conn.end();
    }
}

diagnose();
