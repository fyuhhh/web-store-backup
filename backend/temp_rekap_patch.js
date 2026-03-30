import db from "./config/database.js";
import fs from "fs";

async function run() {
    let out = "";
    try {
        const [prRows] = await db.query("SELECT * FROM pr WHERE noPR = 'PR/PRQ/26/II/00043'");
        if (prRows.length === 0) return console.log("PR not found");
        const id_PR = prRows[0].id_PR;

        const [prItemRows] = await db.query("SELECT * FROM pr_item WHERE id_PR = ?", [id_PR]);
        out += `PR Items: ${prItemRows.length}\n`;

        for (const prItem of prItemRows) {
            out += `\nPR Item: ${prItem.namaBarang} (id: ${prItem.id_PRItem})\n`;
            
            const [poItemRows] = await db.query("SELECT pi.*, p.noPO FROM po_item pi JOIN po p ON pi.id_PO = p.id_PO WHERE pi.id_PRItem = ?", [prItem.id_PRItem]);
            out += `  PO Items: ${poItemRows.length}\n`;

            for (const poItem of poItemRows) {
                out += `    PO Item: id_POItem=${poItem.id_POItem}, noPO=${poItem.noPO}, QTY=${poItem.jumlah_po || poItem.jumlahPO}\n`;

                const [btbItemRows] = await db.query("SELECT bi.*, b.no_btb FROM btb_item bi JOIN btb b ON bi.id_btb = b.id_btb WHERE bi.id_POItem = ?", [poItem.id_POItem]);
                out += `      BTB Items: ${btbItemRows.length}\n`;

                for (const btbItem of btbItemRows) {
                    out += `        BTB Item: id_btb_item=${btbItem.id_btb_item}, no_btb=${btbItem.no_btb}, qty=${btbItem.jumlah_diterima}\n`;
                }
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        fs.writeFileSync("temp_out_utf8.txt", out);
        process.exit();
    }
}

run();
