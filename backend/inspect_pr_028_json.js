import db from "./config/database.js";

async function queryData() {
  const prNo = 'PR/E-WALK/25/XII/028';
  
  // 1. Get PR
  const [prRows] = await db.query("SELECT * FROM pr WHERE noPR = ?", [prNo]);
  if (prRows.length === 0) {
    console.log("PR not found");
    process.exit(0);
  }
  const pr = prRows[0];
  console.log("=== PR ===");
  console.log(JSON.stringify(pr, null, 2));
  
  // 2. Get PR Items
  const [prItems] = await db.query("SELECT * FROM pr_item WHERE id_PR = ?", [pr.id_PR]);
  console.log("\n=== PR ITEMS ===");
  console.log(JSON.stringify(prItems, null, 2));
  
  // 3. Get PO Items related to these PR Items
  for (const item of prItems) {
    console.log(`\n--- PO Items for PR Item: ${item.namaBarang} (id: ${item.id_PRItem}) ---`);
    const [poItems] = await db.query(`
      SELECT pi.*, po.noPO, po.tanggalPO 
      FROM po_item pi 
      JOIN po ON pi.id_PO = po.id_PO 
      WHERE pi.id_PRItem = ?
    `, [item.id_PRItem]);
    console.log(JSON.stringify(poItems, null, 2));
    
    // 4. Get BTBs for these PO Items
    for (const poItem of poItems) {
      console.log(`    --- BTB Items for PO Item id: ${poItem.id_POItem} ---`);
      const [btbItems] = await db.query(`
        SELECT bi.*, b.no_btb, b.tanggal_btb
        FROM btb_item bi
        JOIN btb b ON bi.id_btb = b.id_btb
        WHERE bi.id_POItem = ?
      `, [poItem.id_POItem]);
      console.log(JSON.stringify(btbItems, null, 2));
    }
  }
  
  process.exit(0);
}

queryData();
