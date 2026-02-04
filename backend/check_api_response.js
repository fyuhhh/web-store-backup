
import axios from 'axios';

async function checkApi() {
    try {
        // Assuming backend runs on port 5000 based on standard setup (checking server.js would confirm, but let's try 5000)
        // Actually, I can use the existing backend code to simulate the route response without running axios if I import the router?? 
        // No, running axios against localhost is better integration test.
        // User metadata says: node server.js (in c:\web-store\web-store-backup\backend)

        const id_btb = 193; // Found in previous step
        const url = `http://localhost:5000/api/btb-item?id_btb=${id_btb}`;
        console.log(`Fetching ${url}...`);

        const res = await axios.get(url);
        console.log("Response Data:", JSON.stringify(res.data, null, 2));
    } catch (error) {
        console.error(error.message);
        if (error.response) console.error(error.response.data);
    }
}

checkApi();
