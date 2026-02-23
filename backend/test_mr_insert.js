import db from './config/database.js';

async function test() {
    try {
        const no_mr = 'MR/2026/02/0004';
        const tanggal_mr = '2026-02-19';
        const id_divisi = 13; // HR-GA
        const nama_supplier = 'ANDALAS CELLULER BALIKPAPAN, CV';
        const tanggal_pembelian = '2026-02-19';
        const id_skema = 2; 

        console.log('Attempting to insert MR Header...');
        const [result] = await db.query(
            `INSERT INTO mr (no_mr, tanggal_mr, id_divisi, nama_supplier, tanggal_pembelian, id_skema)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [no_mr, tanggal_mr, id_divisi, nama_supplier, tanggal_pembelian, id_skema]
        );
        console.log('Success! ID:', result.insertId);
    } catch (err) {
        console.error('FAILED:', err.message);
    } finally {
        process.exit(0);
    }
}

test();
