
import db from "./config/database.js";
import fs from 'fs';
import path from 'path';

// Log to backend folder to be safe, or just CWD
const LOG_FILE = 'debug_log_broad.txt';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\r\n');
}

async function debugPOStatus() {
    try {
        log("Starting Broad Debug PO Status...");

        // 1. Check specific case: items with 10/10 qty
        log("\n--- Checking for Items with 10/10 Qty ---");
        const [items10] = await db.query(`
            SELECT pi.id_POItem, pi.id_PO, pi.jumlahPO, pi.jumlahAsli, p.status, p.noPO
            FROM po_item pi
            JOIN po p ON pi.id_PO = p.id_PO
            WHERE pi.jumlahPO = 10 AND pi.jumlahAsli = 10
            LIMIT 5
        `);
        log(`Found ${items10.length} items with 10/10 qty.`);
        items10.forEach(i => {
            log(`- PO ${i.noPO} (ID ${i.id_PO}): Status '${i.status}' | Item ${i.id_POItem} 10/10`);
        });

        // 2. Check for ANY 'PART COMPLETE' PO that has ANY item > 0
        log("\n--- Checking for 'PART COMPLETE' POs with items > 0 ---");
        const [suspicious] = await db.query(`
            SELECT p.id_PO, p.noPO, p.status, pi.id_POItem, pi.jumlahPO, pi.jumlahAsli
            FROM po p
            JOIN po_item pi ON p.id_PO = pi.id_PO
            WHERE p.status = 'PART COMPLETE'
            AND pi.jumlahPO > 0.001
        `);
        log(`Found ${suspicious.length} suspicious items in PART COMPLETE POs.`);
        suspicious.forEach(i => {
            log(`- PO ${i.noPO} (ID ${i.id_PO}) Status '${i.status}' | Item ${i.id_POItem}: Qty ${i.jumlahPO}/${i.jumlahAsli}`);
        });

        // 3. Just dump one PART COMPLETE PO to see what it looks like
        log("\n--- Sample PART COMPLETE PO ---");
        const [sample] = await db.query("SELECT * FROM po WHERE status = 'PART COMPLETE' LIMIT 1");
        if (sample.length > 0) {
            const po = sample[0];
            log(`PO ${po.noPO} (ID ${po.id_PO}) Status: '${po.status}'`);
            const [items] = await db.query("SELECT * FROM po_item WHERE id_PO = ?", [po.id_PO]);
            items.forEach(i => {
                log(`  Item ${i.id_POItem}: ${i.jumlahPO}/${i.jumlahAsli}`);
            });
        }

        process.exit(0);
    } catch (error) {
        log(`Debug Error: ${error.message}`);
        process.exit(1);
    }
}

if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);
debugPOStatus();
