import db from "./config/database.js";
import fs from "fs";

async function run() {
    let out = "";
    try {
        const [prRows] = await db.query("SELECT * FROM pr WHERE noPR = 'PR/PRQ/26/II/00043'");
        if (prRows.length === 0) return console.log("PR not found");
        const id_PR = prRows[0].id_PR;

        const [prItemRows] = await db.query("SELECT * FROM pr_item WHERE id_PR = ?", [id_PR]);
        out += `PR Items for ${prRows[0].noPR}:\n`;
        for (const row of prItemRows) {
            out += `id: ${row.id_PRItem}, name: ${row.namaBarang}, qty: ${row.jumlah}\n`;
        }

    } catch (err) {
        console.error(err);
    } finally {
        fs.writeFileSync("pr_output_utf8.txt", out);
        process.exit();
    }
}

run();
