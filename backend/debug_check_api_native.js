import http from 'http';

function checkApi() {
    http.get('http://localhost:5000/api/btb-item', (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                const items = jsonData.filter(i => i.nama_barang && i.nama_barang.includes("BARANG 1"));

                console.log(`Found ${items.length} items with 'BARANG 1'.`);
                if (items.length > 0) {
                    console.log("First item:", JSON.stringify(items[0], null, 2));
                }
            } catch (e) {
                console.error("Error parsing JSON:", e);
            }
        });

    }).on('error', (err) => {
        console.error("Error:", err);
    });
}

checkApi();
