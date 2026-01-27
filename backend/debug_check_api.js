import fetch from 'node-fetch';

async function checkApi() {
    try {
        const response = await fetch('http://localhost:5000/api/btb-item');
        const data = await response.json();

        // Find items with "BARANG 1"
        const items = data.filter(i => i.nama_barang && i.nama_barang.includes("BARANG 1"));

        console.log(`Found ${items.length} items with 'BARANG 1'.`);
        if (items.length > 0) {
            console.log("First item:", JSON.stringify(items[0], null, 2));
        }

        // Also check "KUAS" just in case
        const kuas = data.filter(i => i.nama_barang && i.nama_barang.includes("KUAS"));
        if (kuas.length > 0) {
            console.log("First KUAS item:", JSON.stringify(kuas[0], null, 2));
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

checkApi();
