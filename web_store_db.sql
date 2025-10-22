-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 22, 2025 at 11:00 AM
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
  `keterangan` text DEFAULT NULL,
  `dibuat_oleh` int(11) DEFAULT NULL,
  `dikeluarkan_oleh` int(11) DEFAULT NULL,
  `skema` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `id_skema` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `bkb`
--

INSERT INTO `bkb` (`id_bkb`, `no_bkb`, `tanggal_bkb`, `keterangan`, `dibuat_oleh`, `dikeluarkan_oleh`, `skema`, `created_at`, `id_skema`) VALUES
(7, 'BKB1', '2025-10-21', '', 85, 85, NULL, '2025-10-21 16:18:24', 1),
(8, 'BKB2', '2025-10-21', 'aaaaa', 85, 85, NULL, '2025-10-21 16:18:54', 1);

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

--
-- Dumping data for table `bkb_item`
--

INSERT INTO `bkb_item` (`id_bkb_item`, `id_bkb`, `id_btb_item`, `nama_barang`, `jumlah_keluar`, `satuan`, `id_satuan`, `sisa_btb`, `keterangan`, `created_at`) VALUES
(7, 7, 44, 'LAPTOP SI UNYIL', 10.00, NULL, 2, 40.00, '', '2025-10-21 16:18:24'),
(8, 8, 44, 'LAPTOP SI UNYIL', 15.00, NULL, 2, 25.00, 'aaaaa', '2025-10-21 16:18:54');

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
(42, 'BTB/123456789111', '2025-10-21', 'Juni 2023', 48, 2, 'Harapan Indah', 85, 1, 1887000.00, '85', NULL, '2025-10-21 16:01:54', 'draft'),
(43, 'BTB2', '2025-10-21', 'Juni 2023', 48, 2, 'Harapan Indah', 85, 1, 1887000.00, '85', NULL, '2025-10-21 16:02:11', 'draft'),
(44, 'BTB2', '2025-10-21', 'Juni 2023', 48, 2, 'Harapan Indah', 85, 1, 1887000.00, '85', NULL, '2025-10-21 16:12:18', 'draft'),
(45, 'BTB5', '2025-10-23', 'Juni 2023', 48, 2, 'Harapan Indah', 85, 1, 1887000.00, '85', NULL, '2025-10-21 16:19:37', 'draft'),
(46, 'BTB5', '2025-10-21', 'Juni 2023', 48, 2, 'Harapan Indah', 85, 1, 1887000.00, '85', NULL, '2025-10-21 17:02:00', 'draft'),
(47, 'BTB10', '2025-10-20', 'Juni 2023', 48, 2, 'Harapan Indah', 85, 1, 1887000.00, '85', NULL, '2025-10-21 17:02:19', 'draft'),
(48, 'BTB/Coba', '2025-10-21', 'Juni 2023', 48, 2, 'Harapan Indah', 85, 1, 20000.00, '85', NULL, '2025-10-21 17:50:26', 'draft'),
(49, 'BTB/Cobaaaaaaaa', '2025-10-21', 'Juni 2023', 48, 2, 'Harapan Indah', 85, 1, 200000.00, '85', NULL, '2025-10-21 17:53:39', 'draft'),
(50, 'BTB10', '2025-10-22', 'Juni 2023', 49, 2, 'Harapan Indah', 89, 2, 500000.00, '89', NULL, '2025-10-22 10:20:44', 'draft');

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
(44, 42, 57, 'LAPTOP SI UNYIL', 50.00, 2, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 25.00, '2025-10-21 16:01:54'),
(45, 42, 56, 'BOLANG', 50.00, 1, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 50.00, '2025-10-21 16:01:54'),
(46, 43, 57, 'LAPTOP SI UNYIL', 20.00, 2, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 20.00, '2025-10-21 16:02:11'),
(47, 43, 56, 'BOLANG', 20.00, 1, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 20.00, '2025-10-21 16:02:11'),
(48, 44, 56, 'BOLANG', 10.00, 1, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 10.00, '2025-10-21 16:12:18'),
(49, 45, 57, 'LAPTOP SI UNYIL', 10.00, 2, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 10.00, '2025-10-21 16:19:37'),
(50, 45, 56, 'BOLANG', 10.00, 1, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 10.00, '2025-10-21 16:19:37'),
(51, 46, 57, 'LAPTOP SI UNYIL', 10.00, 2, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 10.00, '2025-10-21 17:02:00'),
(52, 46, 56, 'BOLANG', 5.00, 1, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 5.00, '2025-10-21 17:02:00'),
(53, 47, 57, 'LAPTOP SI UNYIL', 5.00, 2, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 5.00, '2025-10-21 17:02:20'),
(54, 47, 56, 'BOLANG', 1.00, 1, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 1.00, '2025-10-21 17:02:20'),
(55, 48, 57, 'LAPTOP SI UNYIL', 1.00, 2, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 1.00, '2025-10-21 17:50:26'),
(56, 48, 56, 'BOLANG', 1.00, 1, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 1.00, '2025-10-21 17:50:26'),
(57, 49, 57, 'LAPTOP SI UNYIL', 1.00, 2, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 1.00, '2025-10-21 17:53:39'),
(58, 49, 56, 'BOLANG', 1.00, 1, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 1.00, '2025-10-21 17:53:39'),
(59, 50, 58, 'Kamera', 5.00, 2, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 5.00, '2025-10-22 10:20:44');

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
(2, 'Civil'),
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
(47, 'PO1', '2025-10-15', 2, 15.00, 300000.00, 11.00, 187000.00, 1887000.00, 85, '2025-10-20', 1, 1, 'Menunggu', '2025-10-21 07:55:48', 1),
(48, 'PO2', '2025-10-16', 2, 15.00, 300000.00, 11.00, 187000.00, 1887000.00, 85, '2025-10-20', 1, 2, 'Menunggu', '2025-10-21 07:56:51', 1),
(49, 'PO/2024/001', '2025-09-29', 2, 15.00, 15000.00, 11.00, 9350.00, 94350.00, 89, '2025-10-22', 3, 1, 'Menunggu', '2025-10-22 02:18:31', 2);

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
  `diskonItem` decimal(12,2) DEFAULT 0.00,
  `keterangan` varchar(255) DEFAULT NULL,
  `id_satuan` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `po_item`
--

INSERT INTO `po_item` (`id_POItem`, `id_PO`, `id_PRItem`, `hargaSatuan`, `jumlahPO`, `jumlahAsli`, `diskonItem`, `keterangan`, `id_satuan`) VALUES
(54, 47, 93, 10000.00, 100, 500, 15.00, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 1),
(55, 47, 94, 10000.00, 100, 300, 15.00, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 2),
(56, 48, 93, 10000.00, 2, 400, 15.00, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 1),
(57, 48, 94, 10000.00, 3, 200, 15.00, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 2),
(58, 49, 95, 10000.00, 5, 50, 15.00, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN', 2);

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
(121, 'PR1', '2025-10-06', 1, 2, 'Gantung', 'admin', 1, '2025-10-20 07:53:38'),
(122, 'PR/testing', '2025-10-05', 1, 2, 'Gantung', 'admin', 2, '2025-10-20 10:14:14'),
(123, 'PR-Ewalk', '2025-10-08', 1, 2, 'Menunggu', 'ewalk', 2, '2025-10-21 17:50:28');

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
(93, 121, 'BOLANG', 300.00, 500.00, 500.00, 1, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN'),
(94, 121, 'LAPTOP SI UNYIL', 100.00, 300.00, 300.00, 2, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN'),
(95, 122, 'Kamera', 40.00, 100.00, 100.00, 2, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN'),
(96, 123, 'Kamera', 1000.00, 1000.00, 1000.00, 1, 'MR/CVL/EWALK/25/IX/073 - 04/09/2025 U/N MATERIAL PARTISI LADIES MARKET LG MALL EWALK - URGENT DIMINTA OLEH : ACHMAD JAKFAR - DIBUAT OLEH : MARDIAN');

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
(1, 'Fabrikasi'),
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
(1, 'Tanjung Jaya'),
(2, 'Harapan Indah');

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
(90, 'ewalk', '$2b$10$zYPg3yomnAvIHPXjfycGW.quZFDI42TaZkJOQ6giXxo0L/Fvnjp1W', 1, NULL, 2, '2025-10-21 10:10:36');

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
  ADD KEY `fk_btb_id_skema` (`id_skema`);

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
  MODIFY `id_bkb` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `bkb_item`
--
ALTER TABLE `bkb_item`
  MODIFY `id_bkb_item` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `btb`
--
ALTER TABLE `btb`
  MODIFY `id_btb` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `btb_item`
--
ALTER TABLE `btb_item`
  MODIFY `id_btb_item` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

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
  MODIFY `id_PO` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `po_item`
--
ALTER TABLE `po_item`
  MODIFY `id_POItem` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

--
-- AUTO_INCREMENT for table `pr`
--
ALTER TABLE `pr`
  MODIFY `id_PR` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=124;

--
-- AUTO_INCREMENT for table `pr_item`
--
ALTER TABLE `pr_item`
  MODIFY `id_PRItem` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=97;

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
  MODIFY `id_user` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

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
  ADD CONSTRAINT `fk_btb_id_skema` FOREIGN KEY (`id_skema`) REFERENCES `skema` (`id_skema`) ON DELETE SET NULL ON UPDATE CASCADE;

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
