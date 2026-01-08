
import http from 'http';

function getValidJSON(data) {
    try {
        return JSON.parse(data);
    } catch (e) {
        return null;
    }
}

const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/po',
    method: 'GET'
}, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const pos = getValidJSON(data);
        if (!pos || !Array.isArray(pos)) {
            console.log("Failed to get PO list or not array:", data && data.slice(0, 100));
            return;
        }

        console.log(`Fetched ${pos.length} POs from API.`);

        // Find PO 281 (or any PO with items 10/10)
        // Note: /api/po includes poItems nested? Yes, based on monitoring logic.

        // Check looking for a PO with "PART COMPLETE" status
        const partCompletePOs = pos.filter(p => p.status === 'PART COMPLETE');
        console.log(`Found ${partCompletePOs.length} POs with status 'PART COMPLETE' in API response.`);
        partCompletePOs.forEach(p => {
            console.log(`- PO ${p.noPO} (ID ${p.id}): Items:`);
            p.poItems.forEach(pi => { // p.poItems structure depends on backend query mapping
                // Frontend maps po.poItems -> items.
                // Backend /api/po returns po with items? Let's check po.js get.
                // Usually it returns joined rows, frontend groups them?
                // Actually monitoring page does complex mapping.
                // Let's just dump the raw PO status from API.
            });
        });

        // Check specific PO 281
        const p281 = pos.find(p => p.id === 281 || p.id_PO === 281);
        if (p281) {
            console.log(`PO 281 Status in API: '${p281.status}'`);
        } else {
            console.log("PO 281 not found in API list.");
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
