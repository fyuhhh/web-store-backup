const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web_store_db'
};

async function checkMismatch() {
    console.log('Connecting...');
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);

        const [rows] = await conn.query(`
            SELECT id_btb, no_btb, delay, targetPencapaianPo 
            FROM btb 
            WHERE 
                (delay <= 0 AND targetPencapaianPo != 'Tercapai') 
                OR 
                (delay > 0 AND targetPencapaianPo != 'Tidak Tercapai')
        `);

        console.log(`Found ${rows.length} mismatched records.`);
        if (rows.length > 0) {
            console.table(rows.slice(0, 10));
        }

        const [nullTargets] = await conn.query(`
            SELECT count(*) as count FROM btb WHERE targetPencapaianPo IS NULL
        `);
        console.log(`Records with NULL target: ${nullTargets[0].count}`);

    } catch (err) {
        console.error(err);
    } finally {
        if (conn) await conn.end();
    }
}

checkMismatch();
