const fetch = require('node-fetch');

async function test() {
    const baseUrl = "http://localhost:5000/api/pr/next-number";

    // Test 1: PRQ (Pentacity) for Jan 2026 (Existing seq ~38)
    try {
        const res1 = await fetch(`${baseUrl}?id_skema=1&tanggalPR=2026-01-15`);
        const data1 = await res1.json();
        console.log("Test 1 (PRQ Jan 26):", data1);
    } catch (e) { console.error(e); }

    // Test 2: E-WALK for Jan 2026 (Likely new/001)
    try {
        const res2 = await fetch(`${baseUrl}?id_skema=2&tanggalPR=2026-01-15`);
        const data2 = await res2.json();
        console.log("Test 2 (E-WALK Jan 26):", data2);
    } catch (e) { console.error(e); }

    // Test 3: PRQ for Feb 2026 (Should be II/001)
    try {
        const res3 = await fetch(`${baseUrl}?id_skema=1&tanggalPR=2026-02-15`);
        const data3 = await res3.json();
        console.log("Test 3 (PRQ Feb 26):", data3);
    } catch (e) { console.error(e); }
}

test();
