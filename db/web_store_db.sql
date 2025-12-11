-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 09, 2025 at 07:33 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `web_store_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `bkb`
--

CREATE TABLE `bkb` (
  `id_bkb` int(11) NOT NULL,
  `no_bkb` varchar(50) NOT NULL,
  `tanggal_bkb` date NOT NULL,
  `id_btb` int(11) DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `dibuat_oleh` int(11) DEFAULT NULL,
  `dikeluarkan_oleh` int(11) DEFAULT NULL,
  `skema` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `id_skema` int(11) DEFAULT NULL,
  `refrensiNoPr` varchar(255) DEFAULT NULL,
  `diterima_oleh` varchar(255) DEFAULT NULL,
  `divisi` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bkb`
--

INSERT INTO `bkb` (`id_bkb`, `no_bkb`, `tanggal_bkb`, `id_btb`, `keterangan`, `dibuat_oleh`, `dikeluarkan_oleh`, `skema`, `created_at`, `id_skema`, `refrensiNoPr`, `diterima_oleh`, `divisi`) VALUES
(56, 'aa', '2025-12-18', 130, '', 89, 89, NULL, '2025-12-05 17:45:43', 2, 'PR-1234', 'aaa', '4'),
(57, '123', '2025-12-18', 130, 'bismillah', 89, 89, NULL, '2025-12-08 09:29:39', 2, 'PR-1234', 'wahyu', '4'),
(58, '123', '2025-12-18', 130, 'bismillah', 89, 89, NULL, '2025-12-08 09:34:53', 2, 'PR-1234', 'wahyu', 'Customer Service'),
(59, 'aaa', '2025-12-18', 130, 'bismillah', 89, 89, NULL, '2025-12-08 10:21:56', 2, 'PR-1234', 'wahyu', 'Customer Service');

-- --------------------------------------------------------

--
-- Table structure for table `bkb_item`
--

CREATE TABLE `bkb_item` (
  `id_bkb_item` int(11) NOT NULL,
  `id_bkb` int(11) NOT NULL,
  `id_btb_item` int(11) DEFAULT NULL,
  `nama_barang` varchar(255) NOT NULL,
  `jumlah_keluar` decimal(18,2) NOT NULL,
  `satuan` int(11) DEFAULT NULL,
  `id_satuan` int(11) DEFAULT NULL,
  `sisa_btb` decimal(18,2) DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `btb`
--

CREATE TABLE `btb` (
  `id_btb` int(11) NOT NULL,
  `no_btb` varchar(50) NOT NULL,
  `tanggal_btb` date NOT NULL,
  `periode` varchar(20) DEFAULT NULL,
  `id_po` int(11) NOT NULL,
  `id_supplier` int(11) DEFAULT NULL,
  `nama_supplier` varchar(255) DEFAULT NULL,
  `id_user` int(11) DEFAULT NULL,
  `id_skema` int(11) DEFAULT NULL,
  `biaya` decimal(15,2) DEFAULT 0.00,
  `diterima_oleh` varchar(100) DEFAULT NULL,
  `tanggal_diterima` date DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `status` enum('draft','final','batal') DEFAULT 'draft'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `btb`
--

INSERT INTO `btb` (`id_btb`, `no_btb`, `tanggal_btb`, `periode`, `id_po`, `id_supplier`, `nama_supplier`, `id_user`, `id_skema`, `biaya`, `diterima_oleh`, `tanggal_diterima`, `created_at`, `status`) VALUES
(130, 'BTB/123456789111', '2025-10-21', NULL, 214, 1, 'Tanjung Jaya', 89, 2, 350000.00, '89', NULL, '2025-12-05 17:18:41', 'draft');

-- --------------------------------------------------------

--
-- Table structure for table `btb_item`
--

CREATE TABLE `btb_item` (
  `id_btb_item` int(11) NOT NULL,
  `id_btb` int(11) NOT NULL,
  `id_POItem` int(11) DEFAULT NULL,
  `nama_barang` varchar(255) NOT NULL,
  `jumlah_diterima` decimal(15,2) NOT NULL DEFAULT 0.00,
  `id_satuan` int(11) DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `qty_sisa` decimal(15,2) DEFAULT 0.00,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `btb_item`
--

INSERT INTO `btb_item` (`id_btb_item`, `id_btb`, `id_POItem`, `nama_barang`, `jumlah_diterima`, `id_satuan`, `keterangan`, `qty_sisa`, `created_at`) VALUES
(166, 130, 322, 'Barang 1', 100.00, 1, 'Ini adalah barang ke 1', 100.00, '2025-12-05 17:18:41'),
(167, 130, 323, 'Barang 2', 150.00, 1, 'Ini adalah barang ke 2', 150.00, '2025-12-05 17:18:41'),
(168, 130, 324, 'Barang 3', 100.00, 2, 'Ini adalah barang ke 3', 100.00, '2025-12-05 17:18:41');

-- --------------------------------------------------------

--
-- Table structure for table `divisi`
--

CREATE TABLE `divisi` (
  `id_divisi` int(11) NOT NULL,
  `divisi` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `divisi`
--

INSERT INTO `divisi` (`id_divisi`, `divisi`) VALUES
(1, 'IT'),
(3, 'Command Center'),
(4, 'Customer Service'),
(5, 'DGM_Desain Grafis'),
(6, 'Eng'),
(7, 'FAD'),
(8, 'GAD'),
(9, 'GAD-Civil'),
(10, 'GAD-OPS'),
(11, 'General Affair'),
(12, 'HRD'),
(13, 'HR-GA'),
(14, 'Human Resource'),
(15, 'ITD/EDP'),
(16, 'K3'),
(17, 'Legal'),
(18, 'Marketing'),
(19, 'MKT'),
(20, 'Operasional'),
(21, 'OPS'),
(22, 'PRM-EVN'),
(23, 'Promo'),
(24, 'Promosi'),
(25, 'Purchasing & Store'),
(26, 'STR_LOG'),
(27, 'Tenant Relation'),
(28, 'TRD'),
(29, 'Umum'),
(30, 'Visual Merchandise'),
(31, 'VM');

-- --------------------------------------------------------

--
-- Table structure for table `peran`
--

CREATE TABLE `peran` (
  `id_peran` int(11) NOT NULL,
  `peran` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `peran`
--

INSERT INTO `peran` (`id_peran`, `peran`) VALUES
(1, 'Admin'),
(2, 'Divisi'),
(3, 'Pengurus 1'),
(4, 'Pengurus 2'),
(5, 'Superadmin');

-- --------------------------------------------------------

--
-- Table structure for table `po`
--

CREATE TABLE `po` (
  `id_PO` int(11) NOT NULL,
  `noPO` varchar(50) NOT NULL,
  `tanggalPO` date NOT NULL,
  `id_supplier` int(11) DEFAULT NULL,
  `diskon` decimal(12,2) DEFAULT 0.00,
  `originalDiskon` decimal(12,2) DEFAULT 0.00,
  `ppn` decimal(5,2) DEFAULT 0.00,
  `ppnAmount` decimal(12,2) DEFAULT 0.00,
  `totalPembayaran` decimal(15,2) DEFAULT 0.00,
  `orderedBy` int(11) DEFAULT NULL,
  `estimasiTanggalTerima` date DEFAULT NULL,
  `id_statusPengiriman` int(11) DEFAULT NULL,
  `id_statusPermintaan` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Draft',
  `createdAt` datetime DEFAULT current_timestamp(),
  `id_skema` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `po`
--

INSERT INTO `po` (`id_PO`, `noPO`, `tanggalPO`, `id_supplier`, `diskon`, `originalDiskon`, `ppn`, `ppnAmount`, `totalPembayaran`, `orderedBy`, `estimasiTanggalTerima`, `id_statusPengiriman`, `id_statusPermintaan`, `status`, `createdAt`, `id_skema`) VALUES
(214, 'PO/2024/001', '2025-12-04', 1, 0.00, 0.00, 0.00, 0.00, 350000.00, 89, '2025-09-29', 1, NULL, 'Menunggu', '2025-12-05 09:18:29', 2);

-- --------------------------------------------------------

--
-- Table structure for table `po_item`
--

CREATE TABLE `po_item` (
  `id_POItem` int(11) NOT NULL,
  `id_PO` int(11) NOT NULL,
  `id_PRItem` int(11) DEFAULT NULL,
  `hargaSatuan` decimal(15,2) DEFAULT 0.00,
  `jumlahPO` int(11) DEFAULT 0,
  `jumlahAsli` int(11) DEFAULT 0,
  `diskonPersen` decimal(10,2) NOT NULL DEFAULT 0.00,
  `diskonRupiah` decimal(15,2) NOT NULL DEFAULT 0.00,
  `ppnPersen` decimal(5,2) NOT NULL DEFAULT 0.00,
  `ppnRupiah` decimal(15,2) NOT NULL DEFAULT 0.00,
  `totalPerItem` decimal(15,2) DEFAULT NULL,
  `namaPembeli` varchar(255) DEFAULT NULL,
  `keterangan` varchar(255) DEFAULT NULL,
  `id_satuan` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `po_item`
--

INSERT INTO `po_item` (`id_POItem`, `id_PO`, `id_PRItem`, `hargaSatuan`, `jumlahPO`, `jumlahAsli`, `diskonPersen`, `diskonRupiah`, `ppnPersen`, `ppnRupiah`, `totalPerItem`, `namaPembeli`, `keterangan`, `id_satuan`) VALUES
(322, 214, 347, 1000.00, 0, 100, 0.00, 0.00, 0.00, 0.00, 100000.00, 'Dimas', 'Ini adalah barang ke 1', NULL),
(323, 214, 348, 1000.00, 0, 150, 0.00, 0.00, 0.00, 0.00, 150000.00, 'Dimas', 'Ini adalah barang ke 2', NULL),
(324, 214, 349, 1000.00, 0, 100, 0.00, 0.00, 0.00, 0.00, 100000.00, 'Dimas', 'Ini adalah barang ke 3', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `pr`
--

CREATE TABLE `pr` (
  `id_PR` int(11) NOT NULL,
  `noPR` varchar(100) NOT NULL,
  `tanggalPR` date NOT NULL,
  `id_divisi` int(11) DEFAULT NULL,
  `id_urgensi` int(11) DEFAULT NULL,
  `status` enum('Draft','Menunggu','Gantung','Diproses') DEFAULT 'Draft',
  `dibuatOleh` varchar(100) DEFAULT NULL,
  `id_skema` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pr`
--

INSERT INTO `pr` (`id_PR`, `noPR`, `tanggalPR`, `id_divisi`, `id_urgensi`, `status`, `dibuatOleh`, `id_skema`, `createdAt`) VALUES
(262, 'PR-1234', '2025-12-01', 4, 2, 'Menunggu', 'ewalk', 2, '2025-12-04 17:17:55'),
(263, 'PR-1234', '2025-12-01', 5, 3, 'Menunggu', 'ewalk', 2, '2025-12-07 18:32:51');

-- --------------------------------------------------------

--
-- Table structure for table `pr_item`
--

CREATE TABLE `pr_item` (
  `id_PRItem` int(11) NOT NULL,
  `id_PR` int(11) DEFAULT NULL,
  `namaBarang` varchar(255) NOT NULL,
  `jumlah` decimal(10,2) NOT NULL,
  `originalJumlah` decimal(10,2) DEFAULT NULL,
  `quantityAwalPR` decimal(10,2) DEFAULT NULL,
  `id_satuan` int(11) DEFAULT NULL,
  `keterangan` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pr_item`
--

INSERT INTO `pr_item` (`id_PRItem`, `id_PR`, `namaBarang`, `jumlah`, `originalJumlah`, `quantityAwalPR`, `id_satuan`, `keterangan`) VALUES
(347, 262, 'Barang 1', 0.00, 100.00, 100.00, 1, 'Ini adalah barang ke 1'),
(348, 262, 'Barang 2', 0.00, 150.00, 150.00, 1, 'Ini adalah barang ke 2'),
(349, 262, 'Barang 3', 0.00, 100.00, 100.00, 2, 'Ini adalah barang ke 3'),
(350, 263, 'Barang 1', 100.00, 100.00, 100.00, 1, 'Ini adalah barang ke 1'),
(351, 263, 'Barang 2', 150.00, 150.00, 150.00, 1, 'Ini adalah barang ke 2');

-- --------------------------------------------------------

--
-- Table structure for table `satuan`
--

CREATE TABLE `satuan` (
  `id_satuan` int(11) NOT NULL,
  `satuan` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `satuan`
--

INSERT INTO `satuan` (`id_satuan`, `satuan`) VALUES
(1, 'Ball'),
(2, 'Batang'),
(3, 'BK'),
(4, 'BKS'),
(5, 'BLEK'),
(6, 'Botol'),
(7, 'Box'),
(8, 'BTG'),
(9, 'BTL'),
(10, 'Buku'),
(11, 'Bungkus'),
(12, 'Colli'),
(13, 'Drum'),
(14, 'Dus'),
(15, 'Galon'),
(16, 'Jerigen'),
(17, 'Kaleng'),
(18, 'Karung'),
(19, 'Kg'),
(20, 'Kontainer'),
(21, 'Kotak'),
(22, 'Kubik'),
(23, 'Lembar'),
(24, 'Liter'),
(25, 'Lusin'),
(26, 'Meter'),
(27, 'Pack'),
(28, 'Pasang'),
(29, 'Pick Up'),
(30, 'Pohon'),
(31, 'PSG'),
(32, 'RIM'),
(33, 'Roll'),
(34, 'Sak'),
(35, 'Set'),
(36, 'Tabung'),
(37, 'Tube'),
(38, 'Unit');

-- --------------------------------------------------------

--
-- Table structure for table `skema`
--

CREATE TABLE `skema` (
  `id_skema` int(11) NOT NULL,
  `skema` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `skema`
--

INSERT INTO `skema` (`id_skema`, `skema`) VALUES
(1, 'Pentacity'),
(2, 'Ewalk');

-- --------------------------------------------------------

--
-- Table structure for table `status_pengiriman`
--

CREATE TABLE `status_pengiriman` (
  `id_statusPengiriman` int(11) NOT NULL,
  `status_pengiriman` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `status_pengiriman`
--

INSERT INTO `status_pengiriman` (`id_statusPengiriman`, `status_pengiriman`) VALUES
(1, 'Fabrikasii'),
(2, 'Indent Part'),
(3, 'Schedule'),
(4, 'W/Payment'),
(5, 'W/Delivery');

-- --------------------------------------------------------

--
-- Table structure for table `status_permintaan`
--

CREATE TABLE `status_permintaan` (
  `id_statusPermintaan` int(11) NOT NULL,
  `status_permintaan` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `status_permintaan`
--

INSERT INTO `status_permintaan` (`id_statusPermintaan`, `status_permintaan`) VALUES
(1, 'FAB'),
(2, 'IND'),
(3, 'SC'),
(4, 'WDL'),
(5, 'WPY');

-- --------------------------------------------------------

--
-- Table structure for table `supplier`
--

CREATE TABLE `supplier` (
  `id_supplier` int(11) NOT NULL,
  `namaSupplier` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `supplier`
--

INSERT INTO `supplier` (`id_supplier`, `namaSupplier`) VALUES
(1, 'Tanjung Jaya');

-- --------------------------------------------------------

--
-- Table structure for table `urgensi`
--

CREATE TABLE `urgensi` (
  `id_urgensi` int(11) NOT NULL,
  `urgensi` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `urgensi`
--

INSERT INTO `urgensi` (`id_urgensi`, `urgensi`) VALUES
(1, 'Low'),
(2, 'Medium'),
(3, 'High');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id_user` int(11) NOT NULL,
  `nama_pengguna` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `id_peran` int(11) DEFAULT NULL,
  `id_divisi` int(11) DEFAULT NULL,
  `id_skema` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id_user`, `nama_pengguna`, `password`, `id_peran`, `id_divisi`, `id_skema`, `created_at`) VALUES
(84, 'super', '$2b$10$4zEZz.OE2l1qYPDYUPoml./oI4bRyabgVh8f40ASlkCPSYkzhqyJ2', 5, NULL, NULL, '2025-10-14 08:42:29'),
(85, 'admin', '$2b$10$2809jzM9Ywk489uMMb/UKeYt8smdXFk1bG4a8gglaZ9h04EbM/rD6', 1, NULL, 1, '2025-10-14 08:42:57'),
(86, 'superadmin', '$2b$10$E8a1UVrXXRAKL.yH2GorWOmAjsmsrwznNDMplT07PhT4bgffMubDe', 5, NULL, 1, '2025-10-14 09:34:51'),
(87, 'admin', '$2b$10$B0lyqjIAnTgtXCWas5R4yuAfcDA5u8mGQ48yDnTm/NGzfRlw/lJA.', 1, NULL, 1, '2025-10-14 09:35:49'),
(88, 'admin', '$2b$10$mkHBDEV.V7o3xb5e0u/iwuAhQefKBxid6Ur3yoUwkrNi8Yb7aDA4e', 1, NULL, 1, '2025-10-16 01:22:53'),
(89, 'ewalk', '$2b$10$/4Xk2/PNMVkqAJBX1YtfweHGKuGNA0ZhzY6wViCA6EqnQyxUQJC7m', 1, NULL, 2, '2025-10-17 05:56:02'),
(90, 'ewalk', '$2b$10$zYPg3yomnAvIHPXjfycGW.quZFDI42TaZkJOQ6giXxo0L/Fvnjp1W', 1, NULL, 2, '2025-10-21 10:10:36'),
(92, 'it', '$2b$10$4rlDBQfx709k9H4DOdwtiu7Z0LJziKKRrXKmGfjYFGSRRNCtridsy', 2, 1, 1, '2025-10-24 08:02:09');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bkb`
--
ALTER TABLE `bkb`
  ADD PRIMARY KEY (`id_bkb`),
  ADD KEY `fk_bkb_dibuat_oleh` (`dibuat_oleh`),
  ADD KEY `fk_bkb_dikeluarkan_oleh` (`dikeluarkan_oleh`),
  ADD KEY `fk_bkb_skema` (`skema`),
  ADD KEY `fk_btb_id_skema` (`id_skema`),
  ADD KEY `fk_id_btb` (`id_btb`);

--
-- Indexes for table `bkb_item`
--
ALTER TABLE `bkb_item`
  ADD PRIMARY KEY (`id_bkb_item`),
  ADD KEY `fk_bkb_item_bkb` (`id_bkb`),
  ADD KEY `fk_bkb_item_btb_item` (`id_btb_item`),
  ADD KEY `fk_bkb_item_satuan` (`satuan`),
  ADD KEY `fk_bkb_item_id_satuan` (`id_satuan`);

--
-- Indexes for table `btb`
--
ALTER TABLE `btb`
  ADD PRIMARY KEY (`id_btb`),
  ADD KEY `fk_btb_po` (`id_po`),
  ADD KEY `fk_btb_supplier` (`id_supplier`),
  ADD KEY `fk_btb_user` (`id_user`),
  ADD KEY `fk_btb_skema` (`id_skema`);

--
-- Indexes for table `btb_item`
--
ALTER TABLE `btb_item`
  ADD PRIMARY KEY (`id_btb_item`),
  ADD KEY `fk_btb_item_btb` (`id_btb`),
  ADD KEY `fk_btb_item_po_item` (`id_POItem`),
  ADD KEY `fk_btb_item_satuan` (`id_satuan`);

--
-- Indexes for table `divisi`
--
ALTER TABLE `divisi`
  ADD PRIMARY KEY (`id_divisi`);

--
-- Indexes for table `peran`
--
ALTER TABLE `peran`
  ADD PRIMARY KEY (`id_peran`);

--
-- Indexes for table `po`
--
ALTER TABLE `po`
  ADD PRIMARY KEY (`id_PO`),
  ADD KEY `fk_po_supplier` (`id_supplier`),
  ADD KEY `fk_po_status_pengiriman` (`id_statusPengiriman`),
  ADD KEY `fk_po_status_permintaan` (`id_statusPermintaan`);

--
-- Indexes for table `po_item`
--
ALTER TABLE `po_item`
  ADD PRIMARY KEY (`id_POItem`),
  ADD KEY `fk_poitem_po` (`id_PO`),
  ADD KEY `fk_poitem_pritem` (`id_PRItem`),
  ADD KEY `fk_po_item_satuan` (`id_satuan`);

--
-- Indexes for table `pr`
--
ALTER TABLE `pr`
  ADD PRIMARY KEY (`id_PR`),
  ADD KEY `fk_pr_divisi` (`id_divisi`),
  ADD KEY `fk_pr_urgensi` (`id_urgensi`),
  ADD KEY `fk_pr_skema` (`id_skema`);

--
-- Indexes for table `pr_item`
--
ALTER TABLE `pr_item`
  ADD PRIMARY KEY (`id_PRItem`),
  ADD KEY `fk_pritem_pr` (`id_PR`),
  ADD KEY `fk_pritem_satuan` (`id_satuan`);

--
-- Indexes for table `satuan`
--
ALTER TABLE `satuan`
  ADD PRIMARY KEY (`id_satuan`);

--
-- Indexes for table `skema`
--
ALTER TABLE `skema`
  ADD PRIMARY KEY (`id_skema`);

--
-- Indexes for table `status_pengiriman`
--
ALTER TABLE `status_pengiriman`
  ADD PRIMARY KEY (`id_statusPengiriman`);

--
-- Indexes for table `status_permintaan`
--
ALTER TABLE `status_permintaan`
  ADD PRIMARY KEY (`id_statusPermintaan`);

--
-- Indexes for table `supplier`
--
ALTER TABLE `supplier`
  ADD PRIMARY KEY (`id_supplier`);

--
-- Indexes for table `urgensi`
--
ALTER TABLE `urgensi`
  ADD PRIMARY KEY (`id_urgensi`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id_user`),
  ADD KEY `id_peran` (`id_peran`),
  ADD KEY `id_divisi` (`id_divisi`),
  ADD KEY `id_skema` (`id_skema`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bkb`
--
ALTER TABLE `bkb`
  MODIFY `id_bkb` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `bkb_item`
--
ALTER TABLE `bkb_item`
  MODIFY `id_bkb_item` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=84;

--
-- AUTO_INCREMENT for table `btb`
--
ALTER TABLE `btb`
  MODIFY `id_btb` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=131;

--
-- AUTO_INCREMENT for table `btb_item`
--
ALTER TABLE `btb_item`
  MODIFY `id_btb_item` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=169;

--
-- AUTO_INCREMENT for table `divisi`
--
ALTER TABLE `divisi`
  MODIFY `id_divisi` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `peran`
--
ALTER TABLE `peran`
  MODIFY `id_peran` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `po`
--
ALTER TABLE `po`
  MODIFY `id_PO` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=215;

--
-- AUTO_INCREMENT for table `po_item`
--
ALTER TABLE `po_item`
  MODIFY `id_POItem` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=325;

--
-- AUTO_INCREMENT for table `pr`
--
ALTER TABLE `pr`
  MODIFY `id_PR` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=264;

--
-- AUTO_INCREMENT for table `pr_item`
--
ALTER TABLE `pr_item`
  MODIFY `id_PRItem` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=352;

--
-- AUTO_INCREMENT for table `satuan`
--
ALTER TABLE `satuan`
  MODIFY `id_satuan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `skema`
--
ALTER TABLE `skema`
  MODIFY `id_skema` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `status_pengiriman`
--
ALTER TABLE `status_pengiriman`
  MODIFY `id_statusPengiriman` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `status_permintaan`
--
ALTER TABLE `status_permintaan`
  MODIFY `id_statusPermintaan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `supplier`
--
ALTER TABLE `supplier`
  MODIFY `id_supplier` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `urgensi`
--
ALTER TABLE `urgensi`
  MODIFY `id_urgensi` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id_user` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=93;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bkb`
--
ALTER TABLE `bkb`
  ADD CONSTRAINT `fk_bkb_dibuat_oleh` FOREIGN KEY (`dibuat_oleh`) REFERENCES `user` (`id_user`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_bkb_dikeluarkan_oleh` FOREIGN KEY (`dikeluarkan_oleh`) REFERENCES `user` (`id_user`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_bkb_skema` FOREIGN KEY (`skema`) REFERENCES `skema` (`id_skema`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_btb_id_skema` FOREIGN KEY (`id_skema`) REFERENCES `skema` (`id_skema`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_id_btb` FOREIGN KEY (`id_btb`) REFERENCES `btb` (`id_btb`);

--
-- Constraints for table `bkb_item`
--
ALTER TABLE `bkb_item`
  ADD CONSTRAINT `fk_bkb_item_bkb` FOREIGN KEY (`id_bkb`) REFERENCES `bkb` (`id_bkb`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_bkb_item_btb_item` FOREIGN KEY (`id_btb_item`) REFERENCES `btb_item` (`id_btb_item`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_bkb_item_id_satuan` FOREIGN KEY (`id_satuan`) REFERENCES `satuan` (`id_satuan`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_bkb_item_satuan` FOREIGN KEY (`satuan`) REFERENCES `satuan` (`id_satuan`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `btb`
--
ALTER TABLE `btb`
  ADD CONSTRAINT `fk_btb_po` FOREIGN KEY (`id_po`) REFERENCES `po` (`id_PO`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_btb_skema` FOREIGN KEY (`id_skema`) REFERENCES `skema` (`id_skema`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_btb_supplier` FOREIGN KEY (`id_supplier`) REFERENCES `supplier` (`id_supplier`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_btb_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `btb_item`
--
ALTER TABLE `btb_item`
  ADD CONSTRAINT `fk_btb_item_btb` FOREIGN KEY (`id_btb`) REFERENCES `btb` (`id_btb`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_btb_item_po_item` FOREIGN KEY (`id_POItem`) REFERENCES `po_item` (`id_POItem`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_btb_item_satuan` FOREIGN KEY (`id_satuan`) REFERENCES `satuan` (`id_satuan`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `po`
--
ALTER TABLE `po`
  ADD CONSTRAINT `fk_po_status_pengiriman` FOREIGN KEY (`id_statusPengiriman`) REFERENCES `status_pengiriman` (`id_statusPengiriman`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_po_status_permintaan` FOREIGN KEY (`id_statusPermintaan`) REFERENCES `status_permintaan` (`id_statusPermintaan`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_po_supplier` FOREIGN KEY (`id_supplier`) REFERENCES `supplier` (`id_supplier`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `po_item`
--
ALTER TABLE `po_item`
  ADD CONSTRAINT `fk_po_item_satuan` FOREIGN KEY (`id_satuan`) REFERENCES `satuan` (`id_satuan`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_poitem_po` FOREIGN KEY (`id_PO`) REFERENCES `po` (`id_PO`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_poitem_pritem` FOREIGN KEY (`id_PRItem`) REFERENCES `pr_item` (`id_PRItem`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `pr`
--
ALTER TABLE `pr`
  ADD CONSTRAINT `fk_pr_divisi` FOREIGN KEY (`id_divisi`) REFERENCES `divisi` (`id_divisi`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pr_skema` FOREIGN KEY (`id_skema`) REFERENCES `skema` (`id_skema`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pr_urgensi` FOREIGN KEY (`id_urgensi`) REFERENCES `urgensi` (`id_urgensi`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `pr_item`
--
ALTER TABLE `pr_item`
  ADD CONSTRAINT `fk_pritem_pr` FOREIGN KEY (`id_PR`) REFERENCES `pr` (`id_PR`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pritem_satuan` FOREIGN KEY (`id_satuan`) REFERENCES `satuan` (`id_satuan`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `user_ibfk_1` FOREIGN KEY (`id_peran`) REFERENCES `peran` (`id_peran`),
  ADD CONSTRAINT `user_ibfk_2` FOREIGN KEY (`id_divisi`) REFERENCES `divisi` (`id_divisi`),
  ADD CONSTRAINT `user_ibfk_3` FOREIGN KEY (`id_skema`) REFERENCES `skema` (`id_skema`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
