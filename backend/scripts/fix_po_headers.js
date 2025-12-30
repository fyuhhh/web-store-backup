const db = require('../config/database.js').default;

async function fixPoHeaders() {
    try {
        console.log("Starting PO Header Fix...");

        // Get all POs that have items
        const [pos] = await db.query("SELECT DISTINCT id_PO FROM po_item");

        console.log(`Checking ${pos.length} POs...`);

        for (const { id_PO } of pos) {
            if (!id_PO) continue;

            const [items] = await db.query("SELECT totalPerItem, ppnRupiah, diskonRupiah FROM po_item WHERE id_PO = ?", [id_PO]);

            let totalPembayaran = 0;
            let totalPPN = 0;
            let totalDiskon = 0;

            for (const item of items) {
                totalPembayaran += Number(item.totalPerItem) || 0;
                totalPPN += Number(item.ppnRupiah) || 0;
                totalDiskon += Number(item.diskonRupiah) || 0;
            }

            // Update PO - using originalDiskon column
            await db.query(
                "UPDATE po SET totalPembayaran = ?, ppnAmount = ?, originalDiskon = ? WHERE id_PO = ?",
                [totalPembayaran, totalPPN, totalDiskon, id_PO]
            );

            // console.log(`PO ${id_PO}: Updated Total=${totalPembayaran}`);
        }

        console.log("Done fixing PO Headers.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixPoHeaders();
