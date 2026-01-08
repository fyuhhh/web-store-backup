
async function run() {
    try {
        const res = await fetch('http://localhost:5000/api/po');
        const json = await res.json();
        // find PO 314
        const po314 = json.find(p => p.id_PO === 314);
        console.log("PO 314 from API:", JSON.stringify(po314 || "Not Found", null, 2));

        // Also check first PO
        if (json.length > 0) {
            console.log("First PO from API:", JSON.stringify(json[0], null, 2));
        }
    } catch (err) {
        console.error(err);
    }
}

run();
