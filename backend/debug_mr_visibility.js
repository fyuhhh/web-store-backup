
import db from './config/database.js';

async function debug() {
    try {
        console.log("=== USER TABLE COLUMNS (First Row) ===");
        const [users] = await db.query("SELECT * FROM user LIMIT 1");
        console.log(JSON.stringify(users, null, 2));

        console.log("\n=== USERS in DIVISI 44 ===");
        const [divUsers] = await db.query("SELECT * FROM user WHERE id_divisi = 44");
        console.log(JSON.stringify(divUsers, null, 2));
        
        console.log("\n=== MR (id=5) ===");
        const [mrs] = await db.query("SELECT id_mr, no_mr, id_divisi, id_skema FROM mr WHERE id_mr = 5");
        console.log(JSON.stringify(mrs, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

debug();
