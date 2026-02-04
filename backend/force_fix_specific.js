
import db from './config/database.js';

async function forceFix() {
    try {
        // Hardcoded fix for the user's specific complaint
        // PO/E-WALK/WBL/25/XII/00009 -> ID PO 291
        // Item: TISSUE LIVI...
        // We saw in previous logs: BTB Item [364]

        // Let's verify and update
        const id_btb_item = 364;
        const correctBiaya = 7065000.15;

        console.log(`Force updating BTB Item ${id_btb_item} to ${correctBiaya}...`);

        await db.query("UPDATE btb_item SET biaya = ? WHERE id_btb_item = ?", [correctBiaya, id_btb_item]);

        // Also need to update the BTB Header total!
        // Get id_btb from item
        const [[item]] = await db.query("SELECT id_btb FROM btb_item WHERE id_btb_item = ?", [id_btb_item]);
        if (item) {
            const id_btb = item.id_btb;
            console.log(`Updating BTB Header ${id_btb} total...`);
            const [[sum]] = await db.query("SELECT SUM(biaya) as total FROM btb_item WHERE id_btb = ?", [id_btb]);
            await db.query("UPDATE btb SET biaya = ? WHERE id_btb = ?", [Number(sum.total), id_btb]);
        }

        console.log("Done.");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

forceFix();
