const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web_store_db'
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

async function verifySpecific() {
    console.log('Connecting...');
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);

        // Find a BTB with negative delay
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
            WHERE btb.delay < 0
            LIMIT 1
        `);

        if (rows.length === 0) {
            console.log('No BTB with negative delay found.');
            return;
        }

        const row = rows[0];
        console.log('--- Record Found ---');
        console.log(row);

        const { estimasiTanggalTerima, tanggal_btb, old_delay, old_target } = row;

        console.log(`Est Date Raw: ${estimasiTanggalTerima} (${typeof estimasiTanggalTerima})`);
        console.log(`Act Date Raw: ${tanggal_btb} (${typeof tanggal_btb})`);

        const delay = hitungDelayTanggal(estimasiTanggalTerima, tanggal_btb);
        console.log(`Calculated Delay: ${delay}`);

        let finalTarget = "Tidak Tercapai";
        if (delay <= 0) {
            finalTarget = "Tercapai";
        }
        console.log(`Calculated Target: ${finalTarget}`);

        console.log(`Old Target: '${old_target}'`);
        console.log(`Old Delay: ${old_delay}`);

        const delayMatch = String(old_delay) === String(delay);
        const targetMatch = old_target === finalTarget;

        console.log(`Delay Match? ${delayMatch}`);
        console.log(`Target Match? ${targetMatch}`);

        if (!delayMatch || !targetMatch) {
            console.log('UPDATE NEEDED!');
        } else {
            console.log('NO UPDATE NEEDED (Data is already correct)');
        }

    } catch (err) {
        console.error(err);
    } finally {
        if (conn) await conn.end();
    }
}

verifySpecific();
