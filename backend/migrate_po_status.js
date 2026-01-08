
import db from "./config/database.js";
import { updatePOStatus } from "./utils/statusHelper.js";

const migratePOStatus = async () => {
    try {
        console.log("Starting PO Status Migration...");

        // Get all PO IDs
        const [rows] = await db.query("SELECT id_PO FROM po");
        console.log(`Found ${rows.length} POs to check.`);

        for (const row of rows) {
            await updatePOStatus(row.id_PO);
        }

        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migratePOStatus();
