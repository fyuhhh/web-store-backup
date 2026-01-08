import db from '../config/database.js';

async function migrate() {
    let conn;
    try {
        conn = await db.getConnection();
        console.log("Connected to database...");

        // 1. Add status column to pr_item
        try {
            await conn.query("ALTER TABLE pr_item ADD COLUMN status VARCHAR(50) DEFAULT 'WAITING PO'");
            console.log("Added status column to pr_item");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("Column status already exists in pr_item");
            } else {
                throw err;
            }
        }

        // 2. Add status column to po_item
        try {
            await conn.query("ALTER TABLE po_item ADD COLUMN status VARCHAR(50) DEFAULT 'WAITING PART'");
            console.log("Added status column to po_item");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("Column status already exists in po_item");
            } else {
                throw err;
            }
        }

        // 3. Populate PR Item Status
        console.log("Populating PR Item statuses...");
        const [prItems] = await conn.query("SELECT * FROM pr_item");
        for (const item of prItems) {
            let status = 'WAITING PO';
            const current = parseFloat(item.jumlah || 0);
            const original = parseFloat(item.originalJumlah || 0);

            // Logic:
            // If current == original -> WAITING PO
            // If current == 0 -> WAITING PART (Fully processed to PO)
            // If 0 < current < original -> PARTIAL PO

            // Note: "WAITING PART" for PR means it's done being a PR and is now waiting for parts (PO stage).
            // Or matches user request "Selesai" -> "WAITING PART".

            if (Math.abs(current - original) < 0.001) {
                status = 'WAITING PO';
            } else if (current < 0.001) {
                status = 'WAITING PART';
            } else {
                status = 'PARTIAL PO';
            }

            await conn.query("UPDATE pr_item SET status = ? WHERE id_PRItem = ?", [status, item.id_PRItem]);
        }
        console.log(`Updated ${prItems.length} PR items.`);

        // 4. Populate PO Item Status
        console.log("Populating PO Item statuses...");
        await conn.query("UPDATE po_item SET status = statusTerima");
        // Wait, statusTerima is "SCHEDULE", "TIDAK TERCAPAI" etc. 
        // User wants "WAITING PART", "PARTIAL PART", "PART COMPLETE".
        // "statusTerima" logic was about DATE.
        // We need logic about QUANTITY for the new status.
        // But wait, the user request says "status itu di itemnya aja".
        // I should populate based on QUANTITY logic similar to how PO header was calculated.

        // Check PO Item quantity logic
        // But PO Item doesn't track "received" quantity in `po_item` table directly? 
        // It tracks "jumlahPO" vs "jumlahAsli"? No, `po_item` usually has `jumlahPO` as what was ordered.
        // Where is the "received" amount?
        // BTB Item tracks received amount.
        // So to know if a PO Item is "PART COMPLETE", we must check BTB Items linked to it.

        const [poItems] = await conn.query("SELECT * FROM po_item");
        for (const item of poItems) {
            // Find total received for this PO Item
            const [btbItems] = await conn.query("SELECT SUM(jumlah_diterima) as totalReceived FROM btb_item WHERE id_POItem = ?", [item.id_POItem]);
            const received = parseFloat(btbItems[0].totalReceived || 0);
            const ordered = parseFloat(item.jumlahPO || item.jumlahAsli || 0); // content of PO

            let newStatus = 'WAITING PART';
            if (received >= ordered - 0.001) {
                newStatus = 'PART COMPLETE';
            } else if (received > 0) {
                newStatus = 'PARTIAL PART';
            } else {
                newStatus = 'WAITING PART';
            }

            await conn.query("UPDATE po_item SET status = ? WHERE id_POItem = ?", [newStatus, item.id_POItem]);
        }
        console.log(`Updated ${poItems.length} PO items.`);

        console.log("Migration complete.");

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

migrate();
