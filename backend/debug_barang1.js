import db from "./config/database.js";

async function checkBarang1() {
    try {
        const keyword = "BARANG 1";
        console.log(`=== Inspecting '${keyword}' ===`);

        // 1. Check EXACT match in PR Items
        const [exactMatches] = await db.query(`
      SELECT id_PRItem, namaBarang, kodeBarang 
      FROM pr_item 
      WHERE namaBarang = ?
    `, [keyword]);
        console.log("\n--- Exact Name Match in PR Item ---");
        console.log(JSON.stringify(exactMatches, null, 2));

        // 2. Check LIKE match (fuzzy)
        const [fuzzyMatches] = await db.query(`
      SELECT id_PRItem, namaBarang, kodeBarang 
      FROM pr_item 
      WHERE namaBarang LIKE ?
    `, [`%${keyword}%`]);
        console.log("\n--- Fuzzy Name Match in PR Item ---");
        console.log(JSON.stringify(fuzzyMatches, null, 2));

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkBarang1();
