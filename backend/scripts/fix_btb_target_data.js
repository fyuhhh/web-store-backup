const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load env relative to script location (assuming script is in backend/scripts)
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'web_store_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Helper: hitung delay (sama dengan di route)
function hitungDelayTanggal(estimasi, aktual) {
    if (!estimasi || !aktual) return null;

    function toDateObj(t) {
        let d;
        if (/^\d{2}-\d{2}-\d{4}$/.test(t)) {
            const [day, month, year] = t.split("-");
            d = new Date(`${year}-${month}-${day}`);
        } else {
            d = new Date(t);
        }
        d.setHours(12, 0, 0, 0); // Noon
        return d;
    }

    const dateEstimasi = toDateObj(estimasi);
    const dateAktual = toDateObj(aktual);

    if (isNaN(dateEstimasi.getTime()) || isNaN(dateAktual.getTime())) return null;

    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((dateAktual.getTime() - dateEstimasi.getTime()) / msPerDay);
}

async function fixBtbData() {
    console.log('Connecting to database...');
    const conn = await mysql.createConnection(dbConfig);

    try {
        console.log('Fetching BTB data with PO Est Date...');

        // Fetch all BTB joined with PO to get Est Date
        const [rows] = await conn.query(`
            SELECT 
                btb.id_btb, 
                btb.no_btb, 
                btb.tanggal_btb, 
                btb.delay as old_delay,
                btb.targetPencapaianPo as old_target,
                po.estimasiTanggalTerima
            FROM btb
            LEFT JOIN po ON btb.id_po = po.id_PO
        `);

        console.log(`Found ${rows.length} records. Processing...`);

        let countUpdated = 0;

        for (const row of rows) {
            const { id_btb, tanggal_btb, estimasiTanggalTerima } = row;

            if (!estimasiTanggalTerima) {
                console.log(`BTB ${row.no_btb} skipped: No PO Estimate Date`);
                continue;
            }

            if (!tanggal_btb) {
                console.log(`BTB ${row.no_btb} skipped: No BTB Date`);
                continue;
            }

            const delay = hitungDelayTanggal(estimasiTanggalTerima, tanggal_btb);

            if (delay === null) {
                console.log(`BTB ${row.no_btb} skipped: Invalid Dates (Est: ${estimasiTanggalTerima}, Act: ${tanggal_btb})`);
                continue;
            }

            let finalTarget = "Tidak Tercapai";
            if (delay <= 0) {
                finalTarget = "Tercapai";
            }

            // Log changes
            if (row.old_delay !== delay || row.old_target !== finalTarget) {
                // console.log(`Updating BTB ${row.no_btb}: Delay ${row.old_delay} -> ${delay}, Target ${row.old_target} -> ${finalTarget}`);

                await conn.query(`
                    UPDATE btb 
                    SET delay = ?, targetPencapaianPo = ? 
                    WHERE id_btb = ?
                `, [delay, finalTarget, id_btb]);

                countUpdated++;
            }
        }

        console.log(`Done. Updated ${countUpdated} records out of ${rows.length}.`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await conn.end();
    }
}

fixBtbData();
