import db from "./config/database.js";

async function checkAny() {
    try {
        const [rows] = await db.query(`
      SELECT count(*) as count, kodeBarang FROM pr_item 
      WHERE kodeBarang IS NOT NULL AND kodeBarang != ''
      GROUP BY kodeBarang
      LIMIT 5
    `);
        console.log("Items with kodeBarang:", JSON.stringify(rows));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkAny();
