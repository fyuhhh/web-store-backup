import db from "./config/database.js";

async function checkNameMatch() {
    try {
        // Try to find a code for "KUAS ROOL DURI ( SPIKE ROLLER ) BESAR 9 INCH" using ANY PR item with that name
        const targetName = "KUAS ROOL DURI ( SPIKE ROLLER ) BESAR 9 INCH";

        const [rows] = await db.query(`
      SELECT DISTINCT namaBarang, kodeBarang 
      FROM pr_item 
      WHERE namaBarang LIKE ? AND kodeBarang IS NOT NULL AND kodeBarang != ''
    `, [`%KUAS%`]); // strict match first? user said "KUAS ROOL..." might try exact or like

        console.log("Found codes via Name Match:", JSON.stringify(rows, null, 2));

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkNameMatch();
