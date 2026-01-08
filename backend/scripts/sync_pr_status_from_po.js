import db from '../config/database.js';

const syncStatuses = async () => {
    try {
        console.log("Starting PR-PO Status Sync...");

        // 1. Get all PO Items that have a linked PR Item
        const [poItems] = await db.query(`
            SELECT id_POItem, id_PRItem, status 
            FROM po_item 
            WHERE id_PRItem IS NOT NULL
        `);

        console.log(`Found ${poItems.length} PO items linked to PR items.`);

        let updatedCount = 0;

        // 2. Iterate and update PR Item status
        for (const item of poItems) {
            // Only update if status is valid/meaningful
            if (item.status) {
                // Check current PR status to avoid unnecessary writes? 
                // Alternatively, just overwrite to ensure consistency.
                await db.query(
                    "UPDATE pr_item SET status = ? WHERE id_PRItem = ?",
                    [item.status, item.id_PRItem]
                );
                updatedCount++;
            }
        }

        console.log(`Successfully synced ${updatedCount} PR items.`);
        process.exit(0);
    } catch (error) {
        console.error("Sync failed:", error);
        process.exit(1);
    }
};

syncStatuses();
