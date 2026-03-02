import db from './config/database.js';

async function updateDB() {
  try {
    const [result] = await db.query("UPDATE pr SET estimasipo = DATE_ADD(tanggalPR, INTERVAL 2 DAY) WHERE tanggalPR IS NOT NULL");
    console.log(`Successfully updated ${result.affectedRows} PR records to new 2-day estimasipo logic.`);
  } catch (err) {
    console.error("Error updating DB:", err);
  } finally {
    process.exit(0);
  }
}

updateDB();
