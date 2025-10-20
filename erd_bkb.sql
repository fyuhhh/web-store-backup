-- Tabel utama untuk BKB (Bukti Keluar Barang)
CREATE TABLE bkb (
  id_bkb INT AUTO_INCREMENT PRIMARY KEY,
  no_bkb VARCHAR(50) NOT NULL,
  tanggal_bkb DATE NOT NULL,
  keterangan TEXT,
  dibuat_oleh INT, -- FK ke user
  dikeluarkan_oleh INT, -- FK ke user
  skema INT, -- FK ke skema
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- FK
  FOREIGN KEY (dibuat_oleh) REFERENCES user(id_user),
  FOREIGN KEY (dikeluarkan_oleh) REFERENCES user(id_user),
  FOREIGN KEY (skema) REFERENCES skema(id_skema)
);

-- Tabel detail barang yang keluar pada BKB
CREATE TABLE bkb_item (
  id_bkb_item INT AUTO_INCREMENT PRIMARY KEY,
  id_bkb INT NOT NULL, -- FK ke bkb
  id_btb_item INT,     -- FK ke btb_item (asal barang dari BTB)
  nama_barang VARCHAR(255) NOT NULL,
  jumlah_keluar DECIMAL(18,2) NOT NULL,
  satuan INT,          -- FK ke satuan
  sisa_btb DECIMAL(18,2), -- sisa stok di BTB setelah keluar
  keterangan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- FK
  FOREIGN KEY (id_bkb) REFERENCES bkb(id_bkb),
  FOREIGN KEY (id_btb_item) REFERENCES btb_item(id_btb_item),
  FOREIGN KEY (satuan) REFERENCES satuan(id_satuan)
);

-- Relasi utama:
-- bkb (header) -> bkb_item (detail)
-- bkb_item -> btb_item (asal barang)
-- bkb.dibuat_oleh, bkb.dikeluarkan_oleh -> user
-- bkb.skema -> skema
-- bkb_item.satuan -> satuan

-- Tabel lain yang sudah ada dan direferensikan:
-- user (id_user)
-- skema (id_skema)
-- satuan (id_satuan)
-- btb_item (id_btb_item)
