
import db from "../config/database.js";

async function fixBtbQtySisa() {
    const conn = await db.getConnection();
    try {
        console.log("Starting fix for btb_item.qty_sisa...");

        // Query to update qty_sisa
        // qty_sisa should be: jumlah_diterima (Initial Stock) - Total Issued in BKB
        const sql = `
      UPDATE btb_item
      SET qty_sisa = jumlah_diterima - (
        SELECT COALESCE(SUM(jumlah_keluar), 0)
        FROM bkb_item 
        WHERE bkb_item.id_btb_item = btb_item.id_btb_item
      )
    `;

        const [result] = await conn.query(sql);
        console.log(`Updated ${result.affectedRows} rows in btb_item.`);
        console.log("Fix complete.");

    } catch (error) {
        console.error("Error fixing btb_item:", error);
    } finally {
        conn.release();
        process.exit();
    }
}

fixBtbQtySisa();
