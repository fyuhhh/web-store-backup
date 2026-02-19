import db from './config/database.js';
import fs from 'fs';

const expectedMR = {
    'id_mr': 'int',
    'no_mr': 'varchar',
    'tanggal_mr': 'date',
    'id_divisi': 'int',
    'nama_supplier': 'varchar',
    'tanggal_pembelian': 'date',
    'created_at': 'timestamp'
};

const expectedMRItem = {
    'id_mr_item': 'int',
    'id_mr': 'int',
    'nama_barang': 'varchar',
    'quantity': ['decimal', 'int', 'double'],
    'satuan': 'varchar',
    'keterangan': ['text', 'varchar'],
    'harga_satuan': ['decimal', 'double', 'int'],
    'diskon_persen': ['varchar', 'decimal', 'double', 'int'],
    'diskon_rp': ['decimal', 'double', 'int'],
    'ppn_persen': ['decimal', 'double', 'int'],
    'ppn_rp': ['decimal', 'double', 'int'],
    'total': ['decimal', 'double', 'int']
};

const logBuffer = [];
function log(msg) {
    console.log(msg);
    logBuffer.push(msg);
}

async function verify() {
    try {
        log("Verifying MR schema...");
        const [mrCols] = await db.query("DESCRIBE mr");
        checkTable('mr', mrCols, expectedMR);

        log("\nVerifying MR_ITEM schema...");
        const [mrItemCols] = await db.query("DESCRIBE mr_item");
        checkTable('mr_item', mrItemCols, expectedMRItem);

        fs.writeFileSync('schema_report.txt', logBuffer.join('\n'));

    } catch (err) {
        log("Error: " + err.message);
        fs.writeFileSync('schema_report.txt', logBuffer.join('\n'));
    } finally {
        process.exit();
    }
}

function checkTable(tableName, columns, expected) {
    const existing = {};
    columns.forEach(c => {
        // Extract base type (e.g. 'int(11)' -> 'int')
        const type = c.Type.split('(')[0];
        existing[c.Field] = type;
    });

    for (const [field, type] of Object.entries(expected)) {
        if (!existing[field]) { // Use !existing[field] to check if undefined
            log(`[MISSING] Table '${tableName}' column '${field}' is MISSING.`);
        } else {
            const allowed = Array.isArray(type) ? type : [type];
            if (!allowed.includes(existing[field])) {
                log(`[TYPE MISMATCH] Table '${tableName}' column '${field}' has type '${existing[field]}', expected '${allowed.join('|')}'`);
            } else {
                log(`[OK] ${tableName}.${field}`);
            }
        }
    }
}

verify();
