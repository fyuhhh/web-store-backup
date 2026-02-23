import fs from 'fs';

const API_BASE_URL = 'http://localhost:5000';
const LOG_FILE = 'debug_output.txt';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, (typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg) + '\n');
}

async function check() {
    try {
        fs.writeFileSync(LOG_FILE, ''); // file bersih
    } catch (e) { }

    try {
        log("Checking PO Items...");
        const poRes = await fetch(`${API_BASE_URL}/api/po-item`);
        const poItems = await poRes.json();
        const poWithBTB = poItems.filter(i => i.hasBTB);
        log(`Total PO Items: ${poItems.length}`);
        log(`PO Items with hasBTB (truthy): ${poWithBTB.length}`);
        if (poWithBTB.length > 0) {
            log("Sample locked PO Item:");
            log(poWithBTB[0]);
        } else {
            log("WARNING: No PO Items have hasBTB=true.");

            // Cross check
            log("\nCross checking PO-BTB link...");
            const btbItemsAll = await (await fetch(`${API_BASE_URL}/api/btb-item`)).json();
            const poItemIdsInBTB = new Set(btbItemsAll.map(b => b.id_POItem));
            log(`PO Item IDs referenced in BTB: ${poItemIdsInBTB.size}`);
            const matchingPO = poItems.filter(p => poItemIdsInBTB.has(p.id_POItem));
            log(`PO Items that SHOULD have hasBTB=true (based on id_POItem match): ${matchingPO.length}`);
            if (matchingPO.length > 0) {
                log("Sample PO Item that should be locked:");
                log(matchingPO[0]);
            }
        }

        log("\nChecking BTB Items...");
        const btbRes = await fetch(`${API_BASE_URL}/api/btb-item`);
        const btbItems = await btbRes.json();
        const btbWithBKB = btbItems.filter(i => i.hasBKB);
        log(`Total BTB Items: ${btbItems.length}`);
        log(`BTB Items with hasBKB (truthy): ${btbWithBKB.length}`);
        if (btbWithBKB.length > 0) {
            log("Sample locked BTB Item:");
            log(btbWithBKB[0]);
        } else {
            log("WARNING: No BTB Items have hasBKB=true.");
        }
    } catch (err) {
        log(`Error: ${err.message}`);
    }
}

check();
