
import db from './config/database.js';
import { updatePRStatus } from './utils/statusHelper.js';

async function checkPR356() {
    try {
        console.log("Checking PR 356 Items:");
        const [items] = await db.query("SELECT * FROM pr_item WHERE id_PR = 356");
        console.table(items);

        for (const item of items) {
            const current = parseFloat(item.jumlah || 0);
            const original = parseFloat(item.originalJumlah || 0);
            const diff = Math.abs(current - original);
            console.log(`Item ${item.id_PRItem}: current=${current}, original=${original}, diff=${diff}, isFull=${diff < 0.0001}`);
        }

        console.log("Running updatePRStatus(356)...");
        await updatePRStatus(356);

        const [[pr]] = await db.query("SELECT * FROM pr WHERE id_PR = 356");
        console.log("Final PR 356 Status:", pr.status);

    } catch (error) {
        console.error(error);
    }
}

checkPR356();
