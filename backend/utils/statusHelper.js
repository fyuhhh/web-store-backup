import db from '../config/database.js';

// Update status PR dan Item PR
export const updatePRStatus = async (id_pr) => {
    try {
        // Ambil semua item di PR ini
        const [items] = await db.query(
            "SELECT id_PRItem, jumlah, originalJumlah FROM pr_item WHERE id_pr = ?",
            [id_pr]
        );

        if (items.length === 0) {
            return;
        }

        let allFull = true;
        let allEmpty = true;
        let anyPartial = false;

        // NEW: Update Item Statuses first
        for (const item of items) {
            const current = parseFloat(item.jumlah || 0);
            const original = parseFloat(item.originalJumlah || 0);
            let itemStatus = 'WAITING PO';

            // Cek apakah item ini full (utuh belum diproses)
            if (Math.abs(current - original) > 0.001) {
                allFull = false;
            }

            // Cek apakah item ini kosong (habis diproses)
            if (current > 0.001) {
                allEmpty = false;
            }

            if (current > 0.001 && current < original - 0.001) {
                anyPartial = true;
            }

            // Determine Item Status
            if (Math.abs(current - original) < 0.001) {
                itemStatus = 'WAITING PO';
            } else if (current < 0.001) {
                itemStatus = 'WAITING PART'; // Item is done in PR context, moving to PO/Part stage
            } else {
                itemStatus = 'PARTIAL PO';
            }

            // Update individual item status
            await db.query("UPDATE pr_item SET status = ? WHERE id_PRItem = ?", [itemStatus, item.id_PRItem]);
        }

        // Determine Header Status
        let newStatus = 'WAITING PO';

        if (allFull) {
            newStatus = 'WAITING PO';
        } else if (allEmpty) {
            newStatus = 'WAITING PART';
        } else {
            newStatus = 'PARTIAL PO';
        }

        // Update status PR Header
        await db.query("UPDATE pr SET status = ? WHERE id_PR = ?", [newStatus, id_pr]);
        console.log(`Updated PR ${id_pr} status to ${newStatus} (and updated items)`);

    } catch (error) {
        console.error("Error updating PR status:", error);
    }
};

// Update status PO dan Item PO berdasarkan sisa quantity
export const updatePOStatus = async (id_po) => {
    try {
        const [items] = await db.query(
            "SELECT id_POItem, jumlahPO, jumlahAsli FROM po_item WHERE id_PO = ?",
            [id_po]
        );

        // Jika tidak ada item, anggap "WAITING PART"
        if (items.length === 0) {
            await db.query("UPDATE po SET status = 'WAITING PART' WHERE id_PO = ?", [id_po]);
            return;
        }

        let allComplete = true; // semua jumlahPO == 0
        let allWaiting = true;  // semua jumlahPO == jumlahAsli

        // NEW: Update Item Statuses first
        for (const item of items) {
            const current = parseFloat(item.jumlahPO || 0);
            const original = parseFloat(item.jumlahAsli || 0);
            let itemStatus = 'WAITING PART';

            // Jika ada satu pun item yang > 0, maka tidak COMPLETE semua
            if (current > 0.001) {
                allComplete = false;
            }

            // Jika ada satu pun item yang sisa != asli (berarti sudah ada BTB), maka tidak WAITING full
            if (Math.abs(current - original) > 0.001) {
                allWaiting = false;
            }

            // Determine Item Status based on remaining (jumlahPO) vs original (jumlahAsli)
            // jumlahPO decrements as BTB is created.
            if (current <= 0.001) {
                itemStatus = 'PART COMPLETE';
            } else if (Math.abs(current - original) < 0.001) {
                itemStatus = 'WAITING PART';
            } else {
                itemStatus = 'PARTIAL PART';
            }

            // Update individual item status
            await db.query("UPDATE po_item SET status = ? WHERE id_POItem = ?", [itemStatus, item.id_POItem]);

            // NEW: Sync PR Item Status
            // Find the linked PR Item and update its status to match the PO Item Status
            // BUT ONLY IF the PR Item is fully processed (jumlah == 0).
            // If jumlah > 0, it means it's still PARTIAL PO, regardless of downstream status.
            const [rows] = await db.query("SELECT id_PRItem, jumlah FROM pr_item WHERE id_PRItem = (SELECT id_PRItem FROM po_item WHERE id_POItem = ?)", [item.id_POItem]);

            if (rows.length > 0) {
                const prItem = rows[0];
                const cleanJumlah = parseFloat(prItem.jumlah || 0);

                // Only sync if fully fully consumed (approx 0)
                if (cleanJumlah < 0.001) {
                    await db.query("UPDATE pr_item SET status = ? WHERE id_PRItem = ?", [itemStatus, prItem.id_PRItem]);
                    console.log(`Synced PR Item ${prItem.id_PRItem} status to ${itemStatus} (from PO Item ${item.id_POItem})`);
                } else {
                    console.log(`Skipped syncing PR Item ${prItem.id_PRItem}: Still has remaining qty ${cleanJumlah} (Status stays PARTIAL PO)`);
                }
            }
        }

        let newStatus = 'PARTIAL PART';

        if (allComplete) {
            newStatus = 'PART COMPLETE';
        } else if (allWaiting) {
            newStatus = 'WAITING PART';
        } else {
            newStatus = 'PARTIAL PART';
        }

        // Update status PO Header
        await db.query("UPDATE po SET status = ? WHERE id_PO = ?", [newStatus, id_po]);
        console.log(`Updated PO ${id_po} status to ${newStatus} (and updated items)`);

        // Jika PO COMPLETE, cek apakah PR terkait juga perlu diupdate
        if (newStatus === 'PART COMPLETE') {
            // Cari PR ID terkait PO ini
            const [poItems] = await db.query("SELECT DISTINCT id_PRItem FROM po_item WHERE id_PO = ?", [id_po]);
            const prItemIds = poItems.filter(i => i.id_PRItem).map(i => i.id_PRItem);

            if (prItemIds.length > 0) {
                const [prRows] = await db.query(`SELECT DISTINCT id_PR FROM pr_item WHERE id_PRItem IN (?)`, [prItemIds]);
                for (const row of prRows) {
                    // Trigger PR update logic again just in case, though PR status "WAITING PART" is usually set when PO is Created (qty moved).
                    // But if "PART COMPLETE" means PR is effectively done-done, maybe? 
                    // PR Status "WAITING PART" means "Waiting for Parts from Supplier". 
                    // So when PO is "PART COMPLETE", the Parts have Arrived.
                    // So PR should be "SELESAI"? 
                    // The user said: "PR Status: Selesai" -> "WAITING PART".
                    // So "WAITING PART" is the final state for PR *in the PR table context* (it has left PR domain).
                    // If we want to track "Did the user get the item?", that's PO status.
                    // So I will NOT change PR status here to avoid confusion, unless requested.
                    // The existing code set it to 'PART COMPLETE'.
                    // I will keep it consistent with request: "PR status WAITING PART" is where it ends for PR stage.
                    // The previous code: await db.query("UPDATE pr SET status = 'PART COMPLETE'...");
                    // This creates a status 'PART COMPLETE' in PR.
                    // User's new mapping didn't explicitly mention 'PART COMPLETE' for PR, only 'WAITING PART'.
                    // But if I strictly follow "PR Statuses per item", PR item becomes "WAITING PART" when full PO is created.
                    // Does PR item ever become "DONE"? Likely "WAITING PART" is the end of PR lifecycle (handed over to PO).

                    // I will COMMENT OUT the cross-update for now to avoid introducing statuses not in the User's list, 
                    // OR I will leave it be if it's legacy.
                    // Actually, let's just trigger `updatePRStatus` safely.
                    // await updatePRStatus(row.id_PR);
                }
            }
        }
    } catch (error) {
        console.error("Error updating PO status:", error);
    }
};
