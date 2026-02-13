
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web_store_db'
};


async function fixData() {
    console.log("Connecting to DB...");
    const conn = await mysql.createConnection(dbConfig);

    try {
        console.log("Fetching all BTBs...");
        // Re-calculate based on saved 'delay' field if available, or re-calculate delay if needed?
        // BTB table has 'delay' column.
        // User logic: Delay <= 0 -> Tercapai, Delay > 0 -> Tidak Tercapai.

        const [rows] = await conn.query("SELECT id_btb, delay, targetPencapaianPo FROM btb");

        console.log(`Found ${rows.length} BTBs.`);

        let updatedCount = 0;

        for (const row of rows) {
            let newTarget = "Tidak Tercapai";
            // Check if delay is valid number
            const delay = Number(row.delay);
            if (!isNaN(delay) && row.delay !== null) {
                if (delay <= 0) {
                    newTarget = "Tercapai";
                } else {
                    newTarget = "Tidak Tercapai";
                }
            } else {
                // If delay is null, maybe 'Tidak Tercapai' or keep as is?
                // If delay is null, usually means no PO or no estimate.
                continue;
            }

            if (row.targetPencapaianPo !== newTarget) {
                await conn.query("UPDATE btb SET targetPencapaianPo = ? WHERE id_btb = ?", [newTarget, row.id_btb]);
                updatedCount++;
            }
        }

        console.log(`Updated ${updatedCount} rows.`);

    } catch (err) {
        console.error(err);
    } finally {
        await conn.end();
    }
}

fixData();
