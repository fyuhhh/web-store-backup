
import db from "./config/database.js";
import { updatePOStatus } from "./utils/statusHelper.js";
import fs from 'fs';

const LOG_FILE = 'debug_log.txt';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\r\n');
}

async function debugPOStatus() {
    try {
        log("Starting Debug PO Status...");

        // Find a PO that is 'PART COMPLETE' but has items with jumlahPO > 0
        const [rows] = await db.query(`
            SELECT p.id_PO, p.noPO, p.status, pi.id_POItem, pi.jumlahPO, pi.jumlahAsli
            FROM po p
            JOIN po_item pi ON p.id_PO = pi.id_PO
            WHERE p.status = 'PART COMPLETE'
            AND pi.jumlahPO > 0.01
            LIMIT 1;
        `);

        if (rows.length > 0) {
            const po = rows[0];
            log(`Found problematic PO: ID ${po.id_PO} (${po.noPO})`);
            log(`Current Status in DB: ${po.status}`);
            log(`Item Trigger: POItem ${po.id_POItem} | jumlahPO: ${po.jumlahPO} | jumlahAsli: ${po.jumlahAsli}`);

            // Inspect ALL items for this PO
            const [allItems] = await db.query("SELECT * FROM po_item WHERE id_PO = ?", [po.id_PO]);
            log(`Total Items in PO: ${allItems.length}`);

            let allComplete = true;
            let allWaiting = true;

            allItems.forEach((item, idx) => {
                const current = parseFloat(item.jumlahPO || 0);
                const original = parseFloat(item.jumlahAsli || 0);
                log(`Item ${idx}: jumlahPO=${item.jumlahPO} (${current}), jumlahAsli=${item.jumlahAsli} (${original})`);

                if (current > 0.0001) allComplete = false;
                if (Math.abs(current - original) > 0.0001) allWaiting = false;
            });

            log(`Logic Trace: allComplete=${allComplete}, allWaiting=${allWaiting}`);

            let expectedStatus = 'PARTIAL PART';
            if (allComplete) expectedStatus = 'PART COMPLETE';
            else if (allWaiting) expectedStatus = 'WAITING PART';

            log(`Expected Status: ${expectedStatus}`);

            log(`Running updatePOStatus(${po.id_PO})...`);
            await updatePOStatus(po.id_PO);

            const [[check]] = await db.query("SELECT status FROM po WHERE id_PO = ?", [po.id_PO]);
            log(`New Status in DB: ${check.status}`);

        } else {
            log("No problematic POs found matching critera (PART COMPLETE and jumlahPO > 0).");

            // Check if maybe status is 'PARTIAL PART' but user thinks it's wrong?
            // Or maybe create a test case?
        }

        process.exit(0);
    } catch (error) {
        log(`Debug Error: ${error.message}`);
        process.exit(1);
    }
}

// Clear log file
if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);

debugPOStatus();
