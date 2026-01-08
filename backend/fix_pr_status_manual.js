import db from "./config/database.js";

async function fixStatuses() {
    try {
        console.log("Starting PR Status Manual Fix...");

        // 1. Get all PRs
        const [prs] = await db.query("SELECT id_PR FROM pr");
        console.log(`Found ${prs.length} PRs.`);

        let updatedCount = 0;

        for (const pr of prs) {
            const prId = pr.id_PR;

            // 2. Get items for this PR
            const [items] = await db.query("SELECT jumlah, originalJumlah FROM pr_item WHERE id_PR = ?", [prId]);

            let status = "WAITING PART"; // Default

            if (items.length === 0) {
                status = "WAITING PART"; // Default to WAITING PART
            } else {
                const allZero = items.every(item => item.jumlah === 0);
                const anyTouched = items.some(item => item.jumlah !== item.originalJumlah);

                if (allZero) {
                    status = "PART COMPLETE";
                } else if (anyTouched) {
                    status = "PARTIAL PART";
                } else {
                    status = "WAITING PART";
                }
            }

            // 3. Update PR
            await db.query("UPDATE pr SET status = ? WHERE id_PR = ?", [status, prId]);
            updatedCount++;
        }

        console.log(`Successfully updated ${updatedCount} PRs.`);
        process.exit(0);
    } catch (error) {
        console.error("Error fixing statuses:", error);
        process.exit(1);
    }
}

fixStatuses();
