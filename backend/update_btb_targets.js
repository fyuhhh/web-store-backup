import db from './config/database.js';
import { updateTargetPencapaianPoByBTB } from './routes/btb.js';

async function main() {
  const conn = await db.getConnection();
  try {
    console.log("Fetching all BTBs...");
    const [btbs] = await conn.query("SELECT id_btb FROM btb");
    console.log(`Found ${btbs.length} BTBs. Updating targets...`);
    
    let updatedCount = 0;
    for (const row of btbs) {
      await updateTargetPencapaianPoByBTB(conn, row.id_btb);
      updatedCount++;
    }
    
    console.log(`Successfully updated ${updatedCount} BTBs.`);
  } catch (err) {
    console.error("Error updating BTB targets:", err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

main();
