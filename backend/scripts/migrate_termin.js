import db from '../config/database.js';

const migrateTermin = async () => {
    try {
        console.log("Starting Termin Pembayaran Migration...");

        // 1. Create table `termin_pembayaran`
        await db.query(`
            CREATE TABLE IF NOT EXISTS termin_pembayaran (
                id_termin INT AUTO_INCREMENT PRIMARY KEY,
                termin VARCHAR(255) NOT NULL
            )
        `);
        console.log("Table 'termin_pembayaran' created/verified.");

        // 2. Add `id_termin` to `po` table
        try {
            await db.query(`
                ALTER TABLE po
                ADD COLUMN id_termin INT DEFAULT NULL
            `);
            console.log("Column 'id_termin' added to 'po' table.");
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log("Column 'id_termin' already exists in 'po' table.");
            } else {
                throw err;
            }
        }

        console.log("Migration successful.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrateTermin();
