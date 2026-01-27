
import db from "../config/database.js";

async function addGenericPasswordColumn() {
    try {
        console.log("Checking if plain_password column exists...");

        // Check if column exists
        const [rows] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'user' 
      AND COLUMN_NAME = 'plain_password';
    `);

        if (rows.length > 0) {
            console.log("Column 'plain_password' already exists.");
        } else {
            console.log("Column 'plain_password' does not exist. Adding it...");
            await db.query(`
        ALTER TABLE user 
        ADD COLUMN plain_password VARCHAR(255) NULL AFTER password;
      `);
            console.log("Column 'plain_password' added successfully.");
        }

        process.exit(0);
    } catch (err) {
        console.error("Error adding column:", err);
        process.exit(1);
    }
}

addGenericPasswordColumn();
