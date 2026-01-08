import db from '../config/database.js';

const fixPRStatuses = async () => {
    try {
        console.log("Starting PR Status Fix...");

        // Get all PR Items
        const [items] = await db.query("SELECT id_PRItem, jumlah, originalJumlah, status FROM pr_item");

        let updatedCount = 0;

        for (const item of items) {
            const current = parseFloat(item.jumlah || 0);
            const original = parseFloat(item.originalJumlah || 0);

            let correctStatus = null;

            // Logic:
            // 1. If quantities match (full remaining) -> WAITING PO
            // 2. If remaining > 0 but < original -> PARTIAL PO
            // 3. If remaining == 0 -> Leave as is (managed by PO sync) OR ensure it's not WAITING PO/PARTIAL PO

            if (Math.abs(current - original) < 0.001) {
                // Full Remaining
                if (item.status !== 'WAITING PO') {
                    correctStatus = 'WAITING PO';
                }
            } else if (current > 0.001) {
                // Partial Remaining
                // This is the critical fix for the user's issue
                if (item.status !== 'PARTIAL PO') {
                    correctStatus = 'PARTIAL PO';
                }
            } else {
                // Zero Remaining (Fully PO-ed)
                // If it's zero remaining, it shouldn't be WAITING PO.
                // It should be determined by PO status. 
                // Currently, we assume existing status is likely correct (synced from PO), 
                // UNLESS it's inexplicably 'WAITING PO' or 'PARTIAL PO' (though PARTIAL PO is technically ok if used loosely, but better specific).
                // For now, we mainly want to fix the "Partial Remaining" case shown in screenshot.
            }

            if (correctStatus) {
                await db.query("UPDATE pr_item SET status = ? WHERE id_PRItem = ?", [correctStatus, item.id_PRItem]);
                console.log(`Fixed PR Item ${item.id_PRItem}: ${item.status} -> ${correctStatus} (Qty: ${current}/${original})`);
                updatedCount++;
            }
        }

        console.log(`Fixed ${updatedCount} PR items.`);
        process.exit(0);
    } catch (error) {
        console.error("Fix failed:", error);
        process.exit(1);
    }
};

fixPRStatuses();
