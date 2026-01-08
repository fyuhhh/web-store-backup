
import db from "./config/database.js";
import fs from "fs";

const debugPOStatus = async () => {
    try {
        const id_po = 275;
        console.log(`\n\n========== DEBUG PO ${id_po} ==========\n\n`);

        const [poRow] = await db.query("SELECT status FROM po WHERE id_PO = ?", [id_po]);
        const status = poRow[0]?.status;
        console.log(`>>> ACTUAL DB STATUS: '${status}' <<<\n`);
        fs.writeFileSync('status_check.txt', `PO_STATUS:${status}`);

        const [items] = await db.query(
            "SELECT id_POItem, jumlahPO, jumlahAsli FROM po_item WHERE id_PO = ?",
            [id_po]
        );

        console.log("Raw items:", items);

        if (items.length === 0) {
            console.log("No items found.");
            fs.appendFileSync('status_check.txt', '\nNO ITEMS');
            process.exit(0);
        }

        let allComplete = true; // jumlahPO == 0
        let allWaiting = true;  // jumlahPO == jumlahAsli

        for (const item of items) {
            const current = parseFloat(item.jumlahPO || 0);
            const original = parseFloat(item.jumlahAsli || 0);

            if (current > 0.0001) {
                allComplete = false;
            }

            if (Math.abs(current - original) > 0.0001) {
                allWaiting = false;
            }
        }

        let newStatus = 'PARTIAL PART';

        if (allComplete) {
            newStatus = 'PART COMPLETE';
        } else if (allWaiting) {
            newStatus = 'WAITING PART';
        }

        console.log(`Calculated Status: ${newStatus}`);
        fs.appendFileSync('status_check.txt', `\nCALCULATED:${newStatus}`);
        process.exit(0);

    } catch (error) {
        console.error("Debug failed:", error);
        process.exit(1);
    }
};

debugPOStatus();
