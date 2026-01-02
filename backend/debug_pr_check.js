
// Native fetch in Node 18+

async function runDebug() {
    try {
        console.log("1. Fetching first PR...");
        const resList = await fetch('http://localhost:5000/api/pr');
        const list = await resList.json();

        if (list.length === 0) {
            console.log("No PRs found to test.");
            return;
        }

        const prId = list[0].id_PR;
        console.log(`Testing with PR ID: ${prId} (${list[0].noPR})`);

        // Fetch valid satuan
        const resSatuan = await fetch('http://localhost:5000/api/satuan');
        const satuanList = await resSatuan.json();
        if (satuanList.length === 0) {
            console.log("No Satuan found, cannot add item.");
            return;
        }
        const validSatuanId = satuanList[0].id_satuan;
        console.log("Using valid id_satuan:", validSatuanId);

        console.log("Fetching all items to find PR items...");
        const resItems = await fetch("http://localhost:5000/api/pr-item");
        const allItems = await resItems.json();
        const myItems = allItems.filter(it => String(it.id_PR) === String(prId));
        console.log("Found PR items (Before):", myItems.length);

        // Prepare Payload
        const payload = {
            noPR: list[0].noPR,
            tanggalPR: list[0].tanggalPR,
            id_divisi: list[0].id_divisi,
            id_urgensi: list[0].id_urgensi,
            status: list[0].status,
            id_skema: list[0].id_skema,
            items: myItems.map(it => ({
                id_PRItem: it.id_PRItem,
                namaBarang: it.namaBarang,
                jumlah: it.jumlah,
                id_satuan: it.id_satuan,
                keterangan: it.keterangan || ""
            }))
        };

        // ADD NEW ITEM
        const newItem = {
            id_PRItem: null,
            namaBarang: "DEBUG ITEM " + Date.now(),
            jumlah: 99,
            id_satuan: validSatuanId,
            keterangan: "Added by debug script"
        };
        payload.items.push(newItem);

        console.log("Sending PUT payload with items count:", payload.items.length);

        const resPut = await fetch(`http://localhost:5000/api/pr/${prId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!resPut.ok) {
            console.log("PUT failed:", resPut.status, resPut.statusText);
            const text = await resPut.text();
            console.log("Response:", text);
            return;
        }

        const putResult = await resPut.json();
        console.log("PUT success. Result HEAD:", putResult);

        // Verify
        console.log("Verifying items...");
        const resItems2 = await fetch("http://localhost:5000/api/pr-item");
        const allItems2 = await resItems2.json();
        const myItems2 = allItems2.filter(it => String(it.id_PR) === String(prId));
        console.log("New PR items count:", myItems2.length);

        const foundNew = myItems2.find(it => it.namaBarang === newItem.namaBarang);
        if (foundNew) {
            console.log("SUCCESS: New item found in DB!", foundNew);
        } else {
            console.log("FAILURE: New item NOT found in DB.");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

runDebug();
