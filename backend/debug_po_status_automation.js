import db from './config/database.js';
import { updatePOStatus } from './utils/statusHelper.js';
import fs from 'fs';

const LOG_FILE = 'debug_po_log.txt';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\r\n');
}

async function runTest() {
    let poId, prId, prItemId, poItemId;
    try {
        fs.writeFileSync(LOG_FILE, ''); // Clear log
        log("=== STARTING PO STATUS AUTOMATION TEST ===");

        // 1. Create Dummy PR
        const [prRes] = await db.query("INSERT INTO pr (noPR, tanggalPR, status) VALUES ('TEST-PR-AUTO', NOW(), 'Diproses')");
        prId = prRes.insertId;
        log(`Created PR ${prId}`);

        // 2. Create Dummy PR Item
        const [prItemRes] = await db.query("INSERT INTO pr_item (id_PR, namaBarang, jumlah, originalJumlah, id_satuan) VALUES (?, 'Test Item', 10, 10, 1)", [prId]);
        prItemId = prItemRes.insertId;
        log(`Created PR Item ${prItemId}`);

        // 3. Create PO (should default to WAITING PART)
        const [poRes] = await db.query("INSERT INTO po (noPO, tanggalPO, status) VALUES ('TEST-PO-AUTO', NOW(), 'WAITING PART')");
        poId = poRes.insertId;
        log(`Created PO ${poId} with status WAITING PART`);

        // 4. Add PO Item (Full)
        const [poItemRes] = await db.query(
            "INSERT INTO po_item (id_PO, id_PRItem, jumlahPO, jumlahAsli) VALUES (?, ?, ?, ?)",
            [poId, prItemId, 10, 10]
        );
        poItemId = poItemRes.insertId;
        log(`Created PO Item ${poItemId} (10/10)`);

        // Trigger Update
        await updatePOStatus(poId);
        let [[po]] = await db.query("SELECT status FROM po WHERE id_PO = ?", [poId]);
        log(`[TEST 1] Full Item (10/10) -> Expect WAITING PART. Result: ${po.status}`);
        if (po.status !== 'WAITING PART') log("FAILED TEST 1");

        // 5. Update PO Item (Partial)
        await db.query("UPDATE po_item SET jumlahPO = 5 WHERE id_POItem = ?", [poItemId]);
        log(`Updated PO Item to 5/10`);

        // Trigger Update
        await updatePOStatus(poId);
        [[po]] = await db.query("SELECT status FROM po WHERE id_PO = ?", [poId]);
        log(`[TEST 2] Partial Item (5/10) -> Expect PARTIAL PART. Result: ${po.status}`);
        if (po.status !== 'PARTIAL PART') log("FAILED TEST 2");

        // 6. Update PO Item (Zero) -> Complete
        await db.query("UPDATE po_item SET jumlahPO = 0 WHERE id_POItem = ?", [poItemId]);
        log(`Updated PO Item to 0/10`);

        // Trigger Update
        await updatePOStatus(poId);
        [[po]] = await db.query("SELECT status FROM po WHERE id_PO = ?", [poId]);
        log(`[TEST 3] Zero Item (0/10) -> Expect PART COMPLETE. Result: ${po.status}`);
        if (po.status !== 'PART COMPLETE') log("FAILED TEST 3");

        // 7. Check PR Status (Should be updated to PART COMPLETE)
        let [[pr]] = await db.query("SELECT status FROM pr WHERE id_PR = ?", [prId]);
        log(`[TEST 4] PR Status -> Expect PART COMPLETE. Result: ${pr.status}`);
        if (pr.status !== 'PART COMPLETE') log("FAILED TEST 4");

        // 8. Delete PO Item -> Expect WAITING PART (Empty PO)
        await db.query("DELETE FROM po_item WHERE id_POItem = ?", [poItemId]);
        log(`Deleted PO Item`);

        // Trigger Update
        await updatePOStatus(poId);
        [[po]] = await db.query("SELECT status FROM po WHERE id_PO = ?", [poId]);
        log(`[TEST 5] Empty PO -> Expect WAITING PART. Result: ${po.status}`);
        if (po.status !== 'WAITING PART') log("FAILED TEST 5");

    } catch (err) {
        log("TEST ERROR: " + err.message);
    } finally {
        // Cleanup
        if (poItemId) await db.query("DELETE FROM po_item WHERE id_POItem = ?", [poItemId]);
        if (poId) await db.query("DELETE FROM po WHERE id_PO = ?", [poId]);
        if (prItemId) await db.query("DELETE FROM pr_item WHERE id_PRItem = ?", [prItemId]);
        if (prId) await db.query("DELETE FROM pr WHERE id_PR = ?", [prId]);
        log("Cleanup done.");
        process.exit();
    }
}

runTest();
