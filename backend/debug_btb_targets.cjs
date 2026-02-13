
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web_store_db'
};

async function checkDiscrepancies() {
    console.log("Connecting to DB...");
    const conn = await mysql.createConnection(dbConfig);

    try {
        console.log("--- Checking for Logic Discrepancies ---");

        const [rows] = await conn.query("SELECT id_btb, no_btb, delay, targetPencapaianPo FROM btb");

        let badPositives = 0; // Delay > 0 but Tercapai
        let badNegatives = 0; // Delay <= 0 but Tidak Tercapai

        for (const r of rows) {
            const delayNum = Number(r.delay);
            const target = (r.targetPencapaianPo || "").trim().toUpperCase();

            // Debug the bad rows
            if (!isNaN(delayNum)) {
                if (delayNum > 0 && target === "TERCAPAI") {
                    console.log(`[BAD POSITIVE] ID: ${r.id_btb}, Delay: '${r.delay}', Target: '${r.targetPencapaianPo}'`);
                    badPositives++;
                }
                if (delayNum <= 0 && target === "TIDAK TERCAPAI") {
                    console.log(`[BAD NEGATIVE] ID: ${r.id_btb}, Delay: '${r.delay}', Target: '${r.targetPencapaianPo}'`);
                    badNegatives++;
                }
            } else {
                console.log(`[NaN DELAY] ID: ${r.id_btb}, Delay: '${r.delay}'`);
            }
        }

        console.log(`Found ${badPositives} Bad Positives (Late but Tercapai).`);
        console.log(`Found ${badNegatives} Bad Negatives (On Time but Tidak Tercapai).`);

    } catch (err) {
        console.error(err);
    } finally {
        await conn.end();
    }
}

checkDiscrepancies();
