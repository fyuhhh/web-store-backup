
import db from "./config/database.js";

async function migrateRoles() {
    try {
        console.log("Migrating Roles...");

        // Rename Pengurus 1 -> Purchasing
        const [res1] = await db.query("UPDATE peran SET peran = 'Purchasing' WHERE peran = 'Pengurus 1'");
        console.log(`Updated Pengurus 1 -> Purchasing: ${res1.affectedRows} rows`);

        // Rename Pengurus 2 -> Store
        const [res2] = await db.query("UPDATE peran SET peran = 'Store' WHERE peran = 'Pengurus 2'");
        console.log(`Updated Pengurus 2 -> Store: ${res2.affectedRows} rows`);

        // Verify
        const [rows] = await db.query("SELECT * FROM peran");
        console.log("Current Roles:", rows);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

migrateRoles();
