
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'web_store_db'
};


const fs = require('fs');

async function checkColumns() {
    console.log("Connecting to DB...");
    const conn = await mysql.createConnection(dbConfig);
    let output = "";

    try {
        output += "Checking 'btb' columns:\n";
        const [btbCols] = await conn.query("SHOW COLUMNS FROM btb");
        btbCols.forEach(c => output += ` - ${c.Field} (${c.Type})\n`);

        output += "\nChecking 'po_item' columns:\n";
        const [poItemCols] = await conn.query("SHOW COLUMNS FROM po_item");
        poItemCols.forEach(c => output += ` - ${c.Field} (${c.Type})\n`);

        fs.writeFileSync('db_columns_utf8.txt', output, 'utf8');
        console.log("Output written to db_columns_utf8.txt");

    } catch (err) {
        console.error(err);
    } finally {
        await conn.end();
    }
}


checkColumns();
