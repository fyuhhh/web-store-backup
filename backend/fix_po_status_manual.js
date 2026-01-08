
import db from "./config/database.js";
import { updatePOStatus } from "./utils/statusHelper.js";

async function fixAllPOStatuses() {
    try {
        console.log("Starting PO Status Manual Fix...");

        // 1. Get all POs
        const [pos] = await db.query("SELECT id_PO FROM po");
        console.log(`Found ${pos.length} POs.`);

        let updatedCount = 0;

        for (const po of pos) {
            await updatePOStatus(po.id_PO);
            updatedCount++;
            if (updatedCount % 10 === 0) {
                process.stdout.write(`.`);
            }
        }

        console.log(`\nSuccessfully processed ${updatedCount} POs.`);
        process.exit(0);
    } catch (error) {
        console.error("Error fixing PO statuses:", error);
        process.exit(1);
    }
}

fixAllPOStatuses();
