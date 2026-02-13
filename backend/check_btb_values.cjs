
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web_store_db'
};


const fs = require('fs');

async function checkData() {
    console.log("Connecting to DB...");
    const conn = await mysql.createConnection(dbConfig);
    let output = "";

    try {
        output += "\n--- Checking PR Item Status Values ---\n";
        const [rows] = await conn.query("SELECT DISTINCT status FROM pr_item");
        rows.forEach(r => output += `Status: "${r.status}"\n`);

        fs.writeFileSync('pr_item_status.txt', output, 'utf8');
        console.log("Written to pr_item_status.txt");

    } catch (err) {
        console.error(err);
    } finally {
        await conn.end();
    }
}

checkData();
