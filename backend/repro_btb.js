
// using native fetch

const BASE_URL = 'http://192.168.10.10:5000/api';

async function run() {
    try {
        console.log("0. Fetching valid User and Skema...");
        const usersRes = await fetch(`${BASE_URL}/user`);
        const users = await usersRes.json();
        const validUser = users[0];
        console.log(`Using User ID: ${validUser.id_user}`);

        const skemaRes = await fetch(`${BASE_URL}/skema`);
        const skemas = await skemaRes.json();
        const validSkema = skemas[0];
        console.log(`Using Skema ID: ${validSkema.id_skema}`);

        console.log("1. Fetching POs to find a candidate...");
        const poRes = await fetch(`${BASE_URL}/po?limit=5`);
        const pos = await poRes.json();

        if (!pos || pos.length === 0) {
            console.error("No POs found!");
            return;
        }

        const candidatePO = pos[0];
        console.log(`Using PO ID: ${candidatePO.id_PO}, No: ${candidatePO.noPO}, Supplier: ${candidatePO.id_supplier}`);

        console.log("2. Fetching PO items for this PO...");
        const poItemsRes = await fetch(`${BASE_URL}/po-item?po=${candidatePO.id_PO}`);
        const allPoItems = await poItemsRes.json();

        const poItems = allPoItems.filter(p => p.id_PO === candidatePO.id_PO);

        if (poItems.length === 0) {
            console.error("No items found for this PO");
            return;
        }

        const candidateItem = poItems[0];
        console.log(`Using PO Item ID: ${candidateItem.id_POItem}, Name: ${candidateItem.namaBarang ?? 'Unknown'}`);

        // 3. Create BTB Header
        console.log("3. Creating BTB Header...");
        const headerPayload = {
            no_btb: `TEST-BTB-${Date.now()}`,
            tanggal_btb: "2025-01-09",
            periode: "Januari 2025",
            id_po: candidatePO.id_PO,
            id_supplier: candidatePO.id_supplier,
            nama_supplier: "Test Supplier",
            id_user: validUser.id_user,
            id_skema: validSkema.id_skema,
            biaya: 1000,
            diterima_oleh: validUser.id_user,
            tanggal_diterima: "2025-01-09"
        };

        const headerRes = await fetch(`${BASE_URL}/btb`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(headerPayload)
        });

        if (!headerRes.ok) {
            console.error("Failed to create BTB Header:", await headerRes.text());
            return;
        }

        const headerData = await headerRes.json();
        console.log("BTB Header Created! ID:", headerData.id);
        const btbId = headerData.id;

        // 4. Create BTB Item
        console.log("4. Creating BTB Item...");
        const itemPayload = {
            id_btb: btbId,
            id_POItem: candidateItem.id_POItem,
            nama_barang: candidateItem.namaBarang || "Barang Test",
            jumlah_diterima: 1,
            id_satuan: candidateItem.id_satuan || 1,
            keterangan: "Test input",
            qty_sisa: 1,
            biaya: 1000
        };

        const itemRes = await fetch(`${BASE_URL}/btb-item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemPayload)
        });

        if (!itemRes.ok) {
            console.error("Failed to create BTB Item:", await itemRes.text());
        } else {
            console.log("BTB Item Created!", await itemRes.json());
        }

        // Cleanup (Delete BTB)
        console.log("5. Cleaning up (Deleting BTB)...");
        const deleteRes = await fetch(`${BASE_URL}/btb/${btbId}`, { method: 'DELETE' });
        console.log("Delete result:", await deleteRes.json());

    } catch (e) {
        console.error("Error:", e);
    }
}

run();
