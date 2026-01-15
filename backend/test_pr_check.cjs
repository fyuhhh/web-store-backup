const http = require('http');

function getPRs() {
    return new Promise((resolve, reject) => {
        http.get('http://192.168.10.10:5000/api/pr', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

function createPR(payload) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(payload);
        const options = {
            hostname: '192.168.10.10',
            port: 5000,
            path: '/api/pr',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function run() {
    try {
        const prs = await getPRs();
        if (prs.length === 0) {
            console.log('No PRs found to test duplicate.');
            return;
        }
        const existing = prs[0];
        console.log(`Found existing PR: ${existing.noPR} (ID: ${existing.id_PR})`);

        const payload = {
            noPR: existing.noPR,
            tanggalPR: '2024-01-01',
            status: 'Draft',
            // minimal fields
            dibuatOleh: 'Tester'
        };

        console.log('Attempting to create duplicate PR...');
        const res = await createPR(payload);
        console.log(`Response Status: ${res.statusCode}`);
        console.log(`Response Body: ${res.body}`);
    } catch (err) {
        console.error(err);
    }
}

run();
