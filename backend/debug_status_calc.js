
import db from './config/database.js';
import { updatePRStatus } from './utils/statusHelper.js';

const debugPR = async (id_pr) => {
    try {
        console.log(`Checking PR ${id_pr}...`);

        // 1. Get current items
        const [items] = await db.query(
            "SELECT id_PRItem, jumlah, originalJumlah FROM pr_item WHERE id_pr = ?",
            [id_pr]
        );
        console.log("Current Items:");
        console.log(JSON.stringify(items, null, 2));

        // 2. Run status update logic manually (dry run mostly, but we call the function)
        await updatePRStatus(id_pr);

        // 3. Check new status
        const [[pr]] = await db.query("SELECT id_PR, status FROM pr WHERE id_PR = ?", [id_pr]);
        console.log("Final PR Status:", JSON.stringify(pr, null, 2));

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

debugPR(349); // ID from screenshot
