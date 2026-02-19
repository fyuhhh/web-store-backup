-- MR Table
CREATE TABLE IF NOT EXISTS `mr` (
  `id_mr` int(11) NOT NULL AUTO_INCREMENT,
  `no_mr` varchar(255) NOT NULL,
  `tanggal_mr` date NOT NULL,
  `id_divisi` int(11) DEFAULT NULL,
  `nama_supplier` varchar(255) DEFAULT NULL,
  `tanggal_pembelian` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_mr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- MR Item Table
CREATE TABLE IF NOT EXISTS `mr_item` (
  `id_mr_item` int(11) NOT NULL AUTO_INCREMENT,
  `id_mr` int(11) NOT NULL,
  `nama_barang` varchar(255) NOT NULL,
  `quantity` decimal(10,2) DEFAULT 0.00,
  `satuan` varchar(50) DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `harga_satuan` decimal(15,2) DEFAULT 0.00,
  `diskon_persen` varchar(50) DEFAULT NULL,
  `diskon_rp` decimal(15,2) DEFAULT 0.00,
  `ppn_persen` decimal(5,2) DEFAULT 0.00,
  `ppn_rp` decimal(15,2) DEFAULT 0.00,
  `total` decimal(15,2) DEFAULT 0.00,
  PRIMARY KEY (`id_mr_item`),
  KEY `id_mr` (`id_mr`),
  CONSTRAINT `mr_item_ibfk_1` FOREIGN KEY (`id_mr`) REFERENCES `mr` (`id_mr`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
