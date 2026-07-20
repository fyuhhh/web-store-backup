import mysql from 'mysql2/promise';

async function main() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root', // update if necessary
        password: '', // update if necessary
        database: 'web_store_db' // update if necessary
    });

    try {
        const noPO = 'PO/E-WALK/WBL/26/I/00033';
        console.log(`Checking data for PO: ${noPO}`);

        const [pos] = await db.query('SELECT id_PO, noPO, status FROM po WHERE noPO = ?', [noPO]);
        if (pos.length === 0) {
            console.log('PO not found in database.');
            return;
        }
        const po = pos[0];
        console.log(`PO ID: ${po.id_PO}, Status: ${po.status}`);

        const [items] = await db.query(`
            SELECT pi.id_POItem, pi.jumlahPO, pi.jumlahAsli, pri.namaBarang, pri.jumlah as pr_jumlah
            FROM po_item pi
            LEFT JOIN pr_item pri ON pi.id_PRItem = pri.id_PRItem
            WHERE pi.id_PO = ?
        `, [po.id_PO]);

        console.log(`\nItems in PO:`);
        for (const item of items) {
            console.log(`- Item ID: ${item.id_POItem}, Name: ${item.namaBarang}, jumlahAsli: ${item.jumlahAsli}, jumlahPO: ${item.jumlahPO}, PR jumlah: ${item.pr_jumlah}`);
            
            // Check BTB history
            const [btbs] = await db.query(`
                SELECT b.no_btb, bi.jumlah_diterima, bi.qty_sisa
                FROM btb_item bi
                JOIN btb b ON bi.id_btb = b.id_btb
                WHERE bi.id_POItem = ?
            `, [item.id_POItem]);

            if (btbs.length > 0) {
                console.log(`  BTB History:`);
                for (const btb of btbs) {
                    console.log(`    * ${btb.no_btb}: Received ${btb.jumlah_diterima}, Sisa was ${btb.qty_sisa}`);
                }
            } else {
                console.log(`  No BTB records found for this item.`);
            }
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await db.end();
    }
}

main();
