
import db from './config/database.js';

async function updateData() {
    try {
        const id = 860; // Use one of the IDs found
        await db.query("UPDATE btb_item SET biaya = 100000.55 WHERE id_btb_item = ?", [id]);
        console.log(`Updated btb_item ${id} to 100000.55`);

        const [rows] = await db.query("SELECT id_btb_item, biaya FROM btb_item WHERE id_btb_item = ?", [id]);
        console.log("Updated Row:", rows[0]);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

updateData();
