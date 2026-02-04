import db from './config/database.js';

async function checkSkema() {
    try {
        const [rows] = await db.query("SELECT * FROM skema");
        console.log("Skema:", rows);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkSkema();
