
// Mock Data (Same as before)
const prData = [
    { id_PR: 1, noPR: "PR001", tanggalPR: "2024-01-01" }
];
const prItemData = [
    { id_PRItem: 101, id_PR: 1, namaBarang: "Barang A", quantityAwalPR: 10 }
];
const poData = [
    { id_PO: 201, noPO: "PO001", tanggalPO: "2024-01-05", totalHarga: 1000000 }
];
const poItemData = [
    { id_POItem: 301, id_PO: 201, id_PRItem: 101, jumlahPO: 10, totalPerItem: 100000 }
];
const btbData = [
    { id_btb: 401, no_btb: "BTB001", tanggal_btb: "2024-01-10" },
    { id_btb: 402, no_btb: "BTB002", tanggal_btb: "2024-01-11" }
];
const btbItemData = [
    { id_btb_item: 501, id_btb: 401, id_POItem: 301, jumlah_diterima: 5 },
    { id_btb_item: 502, id_btb: 402, id_POItem: 301, jumlah_diterima: 5 }
];
const bkbData = [];
const bkbItemData = [];

console.log("Starting Simulation with Aggregation Logic...");

const rekapRows = [];

prData.forEach((pr) => {
    const items = prItemData.filter((item) => item.id_PR === pr.id_PR);

    items.forEach((item, idx) => {
        const poItems = poItemData.filter((poi) => String(poi.id_PRItem) === String(item.id_PRItem));

        if (poItems.length === 0) {
            rekapRows.push({ id: "PR-Only", status: "No PO" });
        } else {
            poItems.forEach((poItem) => {
                const po = poData.find((p) => String(p.id_PO) === String(poItem.id_PO));

                // --- AGGREGATION LOGIC ---
                const btbItems = btbItemData.filter((bi) => String(bi.id_POItem) === String(poItem.id_POItem));

                if (btbItems.length === 0) {
                    rekapRows.push({ id: "PO-Only", noPO: po.noPO });
                } else {
                    let totalQtyBTB = 0;
                    const noBTBSet = new Set();
                    const tanggalBTBSet = new Set();

                    btbItems.forEach((btbItem) => {
                        const btb = btbData.find((b) => String(b.id_btb) === String(btbItem.id_btb));
                        if (btb) {
                            if (btb.no_btb) noBTBSet.add(btb.no_btb);
                            if (btb.tanggal_btb) tanggalBTBSet.add(btb.tanggal_btb);
                        }
                        totalQtyBTB += btbItem.jumlah_diterima;
                    });

                    const noBTBStr = Array.from(noBTBSet).join(", ");
                    const tanggalBTBStr = Array.from(tanggalBTBSet).join(", ");

                    rekapRows.push({
                        id: `Row-Aggregated`,
                        noPR: pr.noPR,
                        namaBarang: item.namaBarang,
                        noPO: po.noPO,
                        quantityPO: poItem.jumlahPO,
                        noBTB: noBTBStr,
                        quantityBTB: totalQtyBTB,
                        tanggalBTB: tanggalBTBStr
                    });
                }
            });
        }
    });
});

console.log("\nResulting Rows:");
console.table(rekapRows);

if (rekapRows.length === 1) {
    console.log("\n[SUCCESS] Aggregation working. 1 row generated for 2 BTBs.");
    console.log(`PO Quantity: ${rekapRows[0].quantityPO}`);
    console.log(`BTB Quantity: ${rekapRows[0].quantityBTB} (Should be 10)`);
    console.log(`No BTB: ${rekapRows[0].noBTB}`);
} else {
    console.log(`\n[FAILED] Aggregation failed. Generated ${rekapRows.length} rows.`);
}
