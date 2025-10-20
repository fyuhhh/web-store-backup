/*
-- ================================
-- TABEL: BKB (Bukti Keluar Barang)
-- ================================
CREATE TABLE bkb (
  id_bkb INT AUTO_INCREMENT PRIMARY KEY,
  no_bkb VARCHAR(50) NOT NULL,
  tanggal_bkb DATE NOT NULL,
  keterangan TEXT,
  dibuat_oleh INT,
  dikeluarkan_oleh INT,
  skema INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bkb_dibuat_oleh FOREIGN KEY (dibuat_oleh) REFERENCES user(id_user)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_bkb_dikeluarkan_oleh FOREIGN KEY (dikeluarkan_oleh) REFERENCES user(id_user)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_bkb_skema FOREIGN KEY (skema) REFERENCES skema(id_skema)
    ON UPDATE CASCADE ON DELETE SET NULL
);

-- ======================================
-- TABEL: BKB_ITEM (Detail Barang Keluar)
-- ======================================
CREATE TABLE bkb_item (
  id_bkb_item INT AUTO_INCREMENT PRIMARY KEY,
  id_bkb INT NOT NULL,
  id_btb_item INT,
  nama_barang VARCHAR(255) NOT NULL,
  jumlah_keluar DECIMAL(18,2) NOT NULL,
  satuan INT,
  sisa_btb DECIMAL(18,2),
  keterangan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bkb_item_bkb FOREIGN KEY (id_bkb) REFERENCES bkb(id_bkb)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_bkb_item_btb_item FOREIGN KEY (id_btb_item) REFERENCES btb_item(id_btb_item)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_bkb_item_satuan FOREIGN KEY (satuan) REFERENCES satuan(id_satuan)
    ON UPDATE CASCADE ON DELETE SET NULL
);
*/

import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "localhost", // alamat server MySQL
  user: "root", // ganti dengan user MySQL Anda
  password: "", // isi password MySQL Anda
  database: "web_store_db", // nama database Anda
  connectionLimit: 10, // Tambahkan connectionLimit jika perlu
});

export default db;
