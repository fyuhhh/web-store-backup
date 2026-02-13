
import db from "./config/database.js";

async function createMrTables() {
    try {
        const connection = await db.getConnection();
        console.log("Connected to database.");

        // Create MR table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS mr (
        id_mr INT AUTO_INCREMENT PRIMARY KEY,
        no_mr VARCHAR(255) NOT NULL UNIQUE,
        tanggal_mr DATE NOT NULL,
        id_divisi INT,
        nama_supplier VARCHAR(255),
        tanggal_pembelian DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
        console.log("Table 'mr' created or already exists.");

        // Create MR Item table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS mr_item (
        id_mr_item INT AUTO_INCREMENT PRIMARY KEY,
        id_mr INT NOT NULL,
        nama_barang VARCHAR(255) NOT NULL,
        quantity DECIMAL(10, 2) DEFAULT 0,
        satuan VARCHAR(50),
        keterangan TEXT,
        harga_satuan DECIMAL(15, 2) DEFAULT 0,
        diskon_persen VARCHAR(50),
        diskon_rp DECIMAL(15, 2) DEFAULT 0,
        ppn_persen DECIMAL(5, 2) DEFAULT 0,
        ppn_rp DECIMAL(15, 2) DEFAULT 0,
        total DECIMAL(15, 2) DEFAULT 0,
        FOREIGN KEY (id_mr) REFERENCES mr(id_mr) ON DELETE CASCADE
      )
    `);
        console.log("Table 'mr_item' created or already exists.");

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error("Error creating tables:", error);
        process.exit(1);
    }
}

createMrTables();
