const db = require('../config/database.js').default;

async function fixTotals() {
    try {
        console.log("Starting DB Fix for PO Items...");
        const [rows] = await db.query("SELECT * FROM po_item WHERE totalPerItem = 0 OR totalPerItem IS NULL");

        console.log(`Found ${rows.length} items with 0 total.`);

        for (const row of rows) {
            // Logic from creation to parse/clean values
            // Assuming hargaSatuan in DB is already correct number or string number
            // If it's "2.750" it might need cleaning, but earlier analysis suggests it might be 2750 or correct.
            // Let's safe-parse.

            const cleanNum = (val) => {
                if (!val) return 0;
                if (typeof val === 'number') return val;
                // If it contains dots as thousand separators (Indonesian format often abused in DB)
                // Check if it has dots and NO commas, or dots and commas.
                // Simple heuristic: Remove dots, replace comma with dot.
                // But if it's "254.595" (meaning 254595), removing dots -> 254595. Correct.
                // If it "2.5" (meaning 2.5), removing dots -> 25. Incorrect.
                // However, usually prices are integers.
                return parseFloat(String(val).replace(/\./g, "").replace(",", ".")) || 0;
            };

            // HOWEVER, if the DB value is ALREADY 254595 (int), cleanNum("254595") -> 254595. Correct.
            // What if DB value is "254.595" (string)? cleanNum -> 254595. Correct.

            const harga = cleanNum(row.hargaSatuan);
            const qty = cleanNum(row.jumlahPO) || cleanNum(row.jumlahAsli);

            if (harga === 0) {
                console.log(`Skipping item ${row.id_POItem} (${row.namaBarang || 'Unknown'}) - Price is 0`);
                continue;
            }

            // Calculate base
            const subtotal = harga * qty;

            // Discount
            // diskonPersen might be "10%" string or number
            let diskonPrsn = 0;
            if (typeof row.diskonPersen === 'string') {
                const match = row.diskonPersen.match(/(\d+(\.\d+)?)/);
                diskonPrsn = match ? parseFloat(match[1].replace(",", ".")) : 0;
            } else {
                diskonPrsn = Number(row.diskonPersen) || 0;
            }

            // diskonRupiah
            const diskonRp = cleanNum(row.diskonRupiah);

            let discountAmount = diskonRp;
            if (diskonPrsn > 0) {
                discountAmount += subtotal * (diskonPrsn / 100);
            }

            const afterDiskon = Math.max(0, subtotal - discountAmount);

            // PPN
            // ppnPersen
            let ppnPrsn = 0;
            if (typeof row.ppnPersen === 'string') {
                const match = row.ppnPersen.match(/(\d+(\.\d+)?)/);
                ppnPrsn = match ? parseFloat(match[1].replace(",", ".")) : 0;
            } else {
                ppnPrsn = Number(row.ppnPersen) || 0;
            }

            // Calculate PPN Amount
            let ppnAmount = cleanNum(row.ppnRupiah);
            // Correction: If ppnRupiah is 0 but percent is > 0, calc it
            if (ppnAmount === 0 && ppnPrsn > 0) {
                ppnAmount = afterDiskon * (ppnPrsn / 100);
            }

            const finalTotal = afterDiskon + ppnAmount;

            console.log(`Fixing Item ${row.id_POItem}: Price=${harga}, Qty=${qty}, Disc=${discountAmount}, PPN=${ppnAmount} -> Total=${finalTotal}`);

            // Update DB
            await db.query(
                "UPDATE po_item SET totalPerItem = ?, ppnRupiah = ? WHERE id_POItem = ?",
                [finalTotal, ppnAmount, row.id_POItem]
            );
        }

        console.log("Done.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixTotals();
