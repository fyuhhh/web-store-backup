import db from '../config/database.js';
import { updatePRStatus, updatePOStatus } from '../utils/statusHelper.js';

async function verify() {
    try {
        console.log("Starting verification...");

        // 1. Get a random PR with items
        const [prRows] = await db.query("SELECT id_PR FROM pr_item LIMIT 1");
        if (prRows.length > 0) {
            const id_pr = prRows[0].id_PR;
            console.log(`Testing updatePRStatus for PR ${id_pr}...`);
            await updatePRStatus(id_pr);
            const [items] = await db.query("SELECT status FROM pr_item WHERE id_PR = ?", [id_pr]);
            console.log("PR Item Statuses:", items.map(i => i.status));
        }

        // 2. Get a random PO with items
        const [poRows] = await db.query("SELECT id_PO FROM po_item LIMIT 1");
        if (poRows.length > 0) {
            const id_po = poRows[0].id_PO;
            console.log(`Testing updatePOStatus for PO ${id_po}...`);
            await updatePOStatus(id_po);
            const [items] = await db.query("SELECT status FROM po_item WHERE id_PO = ?", [id_po]);
            console.log("PO Item Statuses:", items.map(i => i.status));
        }

        console.log("Verification finished.");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
