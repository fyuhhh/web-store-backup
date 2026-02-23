
import db from "../config/database.js";

async function runMigration() {
  try {
    const connection = await db.getConnection();
    console.log("Connected to database...");

    // Check if column exists
    const [columns] = await connection.query(`SHOW COLUMNS FROM mr LIKE 'id_skema'`);
    if (columns.length === 0) {
      console.log("Adding id_skema column to mr table...");
      await connection.query(`ALTER TABLE mr ADD COLUMN id_skema INT DEFAULT NULL AFTER id_divisi`);
      console.log("Column added successfully.");
    } else {
      console.log("Column id_skema already exists.");
    }

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
