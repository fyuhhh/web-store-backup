
async function checkApi() {
    try {
        const id_btb = 193;
        const url = `http://localhost:5000/api/btb-item?id_btb=${id_btb}`;
        console.log(`Fetching ${url}...`);

        const res = await fetch(url);
        const data = await res.json();
        console.log("Response Data:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(error.message);
    }
}

checkApi();
