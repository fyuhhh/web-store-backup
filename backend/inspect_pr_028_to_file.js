import db from "./config/database.js";
import fs from "fs";

async function queryData() {
  const prNo = 'PR/E-WALK/25/XII/028';
  let out = {};
  
  // 1. Get PR
  const [prRows] = await db.query("SELECT * FROM pr WHERE noPR = ?", [prNo]);
  if (prRows.length === 0) {
    fs.writeFileSync("inspect_pr.json", JSON.stringify({ error: "PR not found" }));
    process.exit(0);
  }
  const pr = prRows[0];
  out.pr = pr;
  
  // 2. Get PR Items
  const [prItems] = await db.query("SELECT * FROM pr_item WHERE id_PR = ?", [pr.id_PR]);
  out.prItems = prItems;
  
  out.poItems = [];
  out.btbItems = [];
  
  // 3. Get PO Items related to these PR Items
  for (const item of prItems) {
    const [poItems] = await db.query(`
      SELECT pi.*, po.noPO, po.tanggalPO 
      FROM po_item pi 
      JOIN po ON pi.id_PO = po.id_PO 
      WHERE pi.id_PRItem = ?
    `, [item.id_PRItem]);
    out.poItems.push({ prItemId: item.id_PRItem, poItems });
    
    // 4. Get BTBs for these PO Items
    for (const poItem of poItems) {
      const [btbItems] = await db.query(`
        SELECT bi.*, b.no_btb, b.tanggal_btb
        FROM btb_item bi
        JOIN btb b ON bi.id_btb = b.id_btb
        WHERE bi.id_POItem = ?
      `, [poItem.id_POItem]);
      out.btbItems.push({ poItemId: poItem.id_POItem, btbItems });
    }
  }
  
  fs.writeFileSync("inspect_pr.json", JSON.stringify(out, null, 2));
  process.exit(0);
}

queryData();
