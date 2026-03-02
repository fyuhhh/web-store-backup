import { updatePOStatus } from "./utils/statusHelper.js";
import db from "./config/database.js";

async function testSync() {
  const id_po = 334;
  console.log("Triggering updatePOStatus for id_po = 334...");
  await updatePOStatus(id_po);
  console.log("Done");
  
  const [items] = await db.query("SELECT id_PRItem, status from pr_item WHERE id_PRItem IN (658, 659)");
  console.log("PR Items status after sync:");
  console.log(items);
  
  process.exit();
}

testSync();
