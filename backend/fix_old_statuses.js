import { updatePOStatus } from "./utils/statusHelper.js";
import db from "./config/database.js";

async function runMigration() {
  console.log("Fetching all PO IDs to backfill statuses...");
  try {
    const [pos] = await db.query("SELECT id_PO FROM po");
    console.log(`Found ${pos.length} POs to re-sync.`);
    
    let successCount = 0;
    for (const po of pos) {
      await updatePOStatus(po.id_PO);
      successCount++;
      if (successCount % 50 === 0) {
        console.log(`Synced ${successCount}/${pos.length} POs...`);
      }
    }
    
    console.log(`\nSuccessfully re-synced all ${successCount} POs! Historic records should now display correctly.`);
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}

runMigration();
