
import fs from 'fs';

// Native fetch in Node 18+

const BASE_URL = 'http://192.168.10.10:5000/api';
const TARGET_NO_PR = 'PR/E-WALK/25/XII/028';
const TARGET_ITEM_NAME_PART = 'HYDRAULIC';

const LOG_FILE = 'debug_output.txt';

function log(msg) {
    try {
        fs.appendFileSync(LOG_FILE, msg + '\n');
        console.log(msg);
    } catch (e) {
        console.error("Error writing to file", e);
    }
}

async function debugStatus() {
    try {
        fs.writeFileSync(LOG_FILE, ''); // Clear file
        log('Starting debug...');
        // 1. Fetch all PRs to find the ID
        const prRes = await fetch(`${BASE_URL}/pr`);
        const prs = await prRes.json();
        const targetPR = prs.find(p => p.noPR === TARGET_NO_PR);

        if (!targetPR) {
            log('Target PR not found');
            return;
        }

        log('--- TARGET PR ---');
        log(`ID: ${targetPR.id_PR}, No: ${targetPR.noPR}, Status: ${targetPR.status}, CreatedAt: ${targetPR.createdAt}`);

        // 2. Fetch PR Items
        const prItemsRes = await fetch(`${BASE_URL}/pr-item/pr/${targetPR.id_PR}`);
        const prItems = await prItemsRes.json();

        // 3. Fetch All PO Items (to find links)
        const poItemsRes = await fetch(`${BASE_URL}/po-item`);
        const allPoItems = await poItemsRes.json();

        // 4. Analyze Items
        log('\n--- PR ITEMS ANALYSIS ---');
        prItems.forEach(item => {
            if (item.namaBarang.includes(TARGET_ITEM_NAME_PART)) {
                log(`[MATCH] Item: ${item.namaBarang}`);
            } else {
                log(`Item: ${item.namaBarang}`);
            }
            log(`  ID: ${item.id_PRItem}, Qty: ${item.jumlah}, OriginalQty: ${item.originalJumlah}`);

            // Find linked PO Items
            const linkedPoItems = allPoItems.filter(poi => String(poi.id_PRItem) === String(item.id_PRItem));

            if (linkedPoItems.length === 0) {
                log('  -> No Linked PO Items found.');
            } else {
                linkedPoItems.forEach(poi => {
                    log(`  -> Linked PO Item ID: ${poi.id_POItem}, PO ID: ${poi.id_PO}`);
                    log(`     Qty PO: ${poi.jumlahPO}, StatusTerima: ${poi.statusTerima}`);
                });
            }
        });

    } catch (error) {
        log('Error: ' + error.message);
    }
}

debugStatus();
