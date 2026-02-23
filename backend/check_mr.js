import db from './config/database.js';

async function check() {
    try {
        const [rows] = await db.query('SELECT * FROM mr WHERE no_mr = "MR/2026/02/0004"');
        console.log('--- MR HEADER ---');
        console.log(JSON.stringify(rows, null, 2));

        if (rows.length > 0) {
            const [items] = await db.query('SELECT * FROM mr_item WHERE id_mr = ?', [rows[0].id_mr]);
            console.log('--- MR ITEMS ---');
            console.log(JSON.stringify(items, null, 2));
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

check();
