import db from "./config/database.js";

async function checkData() {
    try {
        const [rows] = await db.query(`
      SELECT id_PRItem, namaBarang, kodeBarang 
      FROM pr_item 
      WHERE namaBarang LIKE '%KUAS%' OR namaBarang LIKE '%GRENDEL%'
      LIMIT 10
    `);
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkData();
