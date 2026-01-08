import db from './config/database.js';
import { updatePRStatus } from './utils/statusHelper.js';

const migrateStatuses = async () => {
    try {
        console.log("Starting PR status migration...");
        // Get all PR IDs
        const [prs] = await db.query("SELECT id_PR FROM pr");
        console.log(`Found ${prs.length} PRs. Updating statuses...`);

        for (const pr of prs) {
            await updatePRStatus(pr.id_PR);
        }

        console.log("Migration completed.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrateStatuses();
