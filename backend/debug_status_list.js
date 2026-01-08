
import db from "./config/database.js";
import fs from 'fs';

const LOG_FILE = 'debug_status_list.txt';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\r\n');
}

async function checkStatuses() {
    try {
        log("Checking Distinct Statuses in PO table...");
        const [rows] = await db.query("SELECT DISTINCT status FROM po");
        log(`Found ${rows.length} distinct statuses:`);
        rows.forEach(r => {
            log(`- '${r.status}'`);
        });

        // Also check if there's any PO with 'PART COMPLETE' in any casing using LIKE
        const [likeRows] = await db.query("SELECT id_PO, noPO, status FROM po WHERE status LIKE '%COMPLETE%'");
        if (likeRows.length > 0) {
            log(`\nFound ${likeRows.length} POs match '%COMPLETE%':`);
            likeRows.forEach(r => {
                log(`PO ${r.noPO}: '${r.status}'`);
            });
        }

        process.exit(0);
    } catch (error) {
        log(`Error: ${error.message}`);
        process.exit(1);
    }
}

if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
checkStatuses();
