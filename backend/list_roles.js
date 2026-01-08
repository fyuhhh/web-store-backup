
import db from "./config/database.js";

async function listRoles() {
    try {
        const [rows] = await db.query("SELECT * FROM peran");
        console.log("Current Roles:", rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listRoles();
