
import db from '../config/database.js';
import { updatePOStatus } from '../utils/statusHelper.js';

const fixAllPOStatus = async () => {
    try {
        console.log("Starting PO Status Fix...");
        const [pos] = await db.query("SELECT id_PO FROM po");

        console.log(`Found ${pos.length} POs to check.`);

        for (const po of pos) {
            await updatePOStatus(po.id_PO);
            // process.stdout.write(".");
        }

        console.log("\nFinished updating all PO statuses.");
        process.exit(0);
    } catch (error) {
        console.error("Error fixing PO statuses:", error);
        process.exit(1);
    }
};

fixAllPOStatus();
