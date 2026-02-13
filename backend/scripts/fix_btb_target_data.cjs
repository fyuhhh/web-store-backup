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
        d.setHours(12, 0, 0, 0);
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
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);

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

        console.log(`Found ${rows.length} records.`);

        let countUpdated = 0;
        let countRecalculated = 0;

        for (const row of rows) {
            const { id_btb, no_btb, tanggal_btb, estimasiTanggalTerima, old_delay, old_target } = row;

            let delay = null;

            // Try to calculate clean delay
            if (estimasiTanggalTerima && tanggal_btb) {
                const calculated = hitungDelayTanggal(estimasiTanggalTerima, tanggal_btb);
                if (calculated !== null) {
                    delay = calculated;
                    countRecalculated++;
                }
            }

            // Fallback: Use existing valid delay if regex failed or date missing
            if (delay === null && old_delay !== null && old_delay !== undefined && old_delay !== '') {
                // Trust the old delay if we can't recalculate (historical data assumption)
                // But check if it's a number
                const d = Number(old_delay);
                if (!isNaN(d)) {
                    delay = d;
                }
            }

            // If still null, we can't determine status (unless we assume default)
            // Just skip to avoid overwriting valid manual data with nulls?
            if (delay === null) {
                // console.log(`Skipping ${no_btb} - No Date & No valid existing delay`);
                // If old_target is set but delay is null, do we clear it? Maybe not.
                continue;
            }

            let finalTarget = "Tidak Tercapai";
            if (delay <= 0) {
                finalTarget = "Tercapai";
            }

            // Determine if update needed
            // Logic: Update if delay value changed (recalculation) OR target mismatch

            const delayChanged = (old_delay !== null && Number(old_delay) !== delay) || (old_delay === null);
            const targetChanged = old_target !== finalTarget;

            if (delayChanged || targetChanged) {
                // console.log(`Updating ${no_btb}: Delay ${old_delay}->${delay}, Target ${old_target}->${finalTarget}`);
                await conn.query(`
                    UPDATE btb 
                    SET delay = ?, targetPencapaianPo = ? 
                    WHERE id_btb = ?
                `, [delay, finalTarget, id_btb]);
                countUpdated++;
            }
        }

        console.log(`Done. Updated ${countUpdated} records. Recalculated Valid Dates for ${countRecalculated}.`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (conn) await conn.end();
    }
}

fixBtbData();
