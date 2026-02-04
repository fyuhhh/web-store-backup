import http from 'http';

const postData = JSON.stringify({
    noPR: `PR/DEBUG/${Date.now()}`,
    noMR: `MR-DEBUG-${Date.now()}`,
    tanggalPR: '2026-02-02',
    id_divisi: 1,
    id_urgensi: 1,
    id_skema: 1,
    status: 'Draft',
    dibuatOleh: 'DebugScript',
    plan: 'Plan'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/pr',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        console.log('BODY: ' + rawData);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
