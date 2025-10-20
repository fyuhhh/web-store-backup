"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ChevronDown, Edit, Trash2 } from "lucide-react";

import { Label } from "@/components/ui/label";
// halo disini saya cooba coba
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import ExcelJS from "exceljs";

// Kolom sesuai urutan permintaan, tambahkan skema di samping masing-masing kolom
const columns = [
  { key: "tahunPR", label: "Tahun PR" },
  { key: "bulanPR", label: "Bulan PR" },
  { key: "noPR", label: "No. PR" },
  { key: "tanggalPR", label: "Tanggal PR" },
  { key: "hariPR", label: "Hari PR" },
  { key: "daftarBarangPR", label: "Daftar Barang PR" },
  { key: "quantityAwalPR", label: "Quantity Awal PR" },
  { key: "quantityPR", label: "Sisa Quantity PR" },
  { key: "satuanPR", label: "Satuan PR" },
  { key: "keteranganPR", label: "Keterangan PR" },
  { key: "divisi", label: "Divisi" },
  { key: "dibuatOleh", label: "Dibuat Oleh" },
  { key: "skemaPR", label: "Skema PR" }, // 1. Skema PR
  { key: "targetTanggalPO", label: "Target Tanggal PO" },
  { key: "delay", label: "Delay" },
  { key: "noPO", label: "No. PO" },
  { key: "tanggalPO", label: "Tanggal PO" },
  { key: "daftarBarangPO", label: "Daftar Barang PO" },
  { key: "quantityPO", label: "Quantity PO" },
  { key: "satuanPO", label: "Satuan PO" },
  { key: "keteranganPO", label: "Keterangan PO" },
  { key: "diskonPersen", label: "Diskon (%)" },
  { key: "diskonRp", label: "Diskon (RP)" },
  { key: "ppnPersen", label: "PPN (%)" },
  { key: "ppnRp", label: "PPN (Rp)" },
  { key: "totalHarga", label: "Total Harga" },
  { key: "tanggalEstimasiDiterima", label: "Tanggal Estimasi Diterima" },
  { key: "kode", label: "Kode" },
  { key: "statusPengiriman", label: "Status Pengiriman" },
  { key: "supplier", label: "Supplier" },
  { key: "diorderOleh", label: "Diorder Oleh" },
  { key: "skemaPO", label: "Skema PO" }, // 2. Skema PO
  { key: "noBTB", label: "No. BTB" },
  { key: "tanggalBTB", label: "Tanggal BTB" },
  { key: "periodeBTB", label: "Periode" },
  { key: "namaSupplierBTB", label: "Nama Supplier BTB" },
  { key: "namaBarangBTB", label: "Nama Barang BTB" },
  { key: "quantityBTB", label: "Quantity BTB" },
  { key: "satuanBTB", label: "Satuan BTB" },
  { key: "biayaBTB", label: "Biaya BTB" },
  { key: "diterimaOleh", label: "Diterima Oleh" },
  { key: "skemaBTB", label: "Skema BTB" }, // 3. Skema BTB
  { key: "noBKB", label: "No. BKB" },
  { key: "tanggalBKB", label: "Tanggal BKB" },
  { key: "namaBarangBKB", label: "Nama Barang BKB" },
  { key: "quantityBKB", label: "Quantity BKB" },
  { key: "satuanBKB", label: "Satuan BKB" },
  { key: "keteranganBKB", label: "Keterangan BKB" },
  { key: "dikeluarkanOleh", label: "Dikeluarkan Oleh" },
  { key: "skemaBKB", label: "Skema BKB" }, // 4. Skema BKB (modif kolom skema lama)
];

function getMonthName(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("id-ID", { month: "long" });
}
function getYear(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).getFullYear().toString();
}
function getDayName(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("id-ID", { weekday: "long" });
}

// Helper untuk angka bulat tanpa desimal
function formatInt(val: any) {
  if (val === undefined || val === null || val === "") return "";
  const num = Number(val);
  return Number.isNaN(num)
    ? ""
    : num % 1 === 0
    ? num.toString()
    : num.toFixed(2);
}

// Helper format rupiah dengan prefix
function formatRupiahFull(val: any) {
  if (val === undefined || val === "" || isNaN(val)) return "";
  return "Rp. " + Number(val).toLocaleString("id-ID");
}

// Hari libur nasional (contoh, bisa ditambah sesuai kebutuhan)
const HOLIDAYS = [
  "2025-01-01",
  "2025-02-01",
  "2025-03-29",
  "2025-04-18",
  "2025-05-01",
  "2025-05-15",
  "2025-06-01",
  "2025-12-25",
];

// Fungsi menambah hari kerja (tidak termasuk Sabtu/Minggu/tanggal merah)
function addWorkingDays(startDateStr: string, days: number) {
  let date = new Date(startDateStr);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    const dateStr = date.toISOString().slice(0, 10);
    if (day !== 0 && day !== 6 && !HOLIDAYS.includes(dateStr)) {
      added++;
    }
  }
  return date.toISOString().slice(0, 10);
}

// Fungsi menghitung selisih hari kerja antara dua tanggal
function countWorkingDaysBetween(startDateStr: string, endDateStr: string) {
  let start = new Date(startDateStr);
  let end = new Date(endDateStr);
  let count = 0;
  while (start < end) {
    start.setDate(start.getDate() + 1);
    const day = start.getDay();
    const dateStr = start.toISOString().slice(0, 10);
    if (day !== 0 && day !== 6 && !HOLIDAYS.includes(dateStr)) {
      count++;
    }
  }
  return count;
}

export default function RekapFullPage() {
  const [rekapData, setRekapData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filters, setFilters] = useState<{ [key: string]: any }>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportMode, setExportMode] = useState<"all" | "selected" | "range">(
    "all"
  );
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  // Tambahkan state untuk label referensi
  const [supplierMap, setSupplierMap] = useState<{ [key: string]: string }>({});
  const [userMap, setUserMap] = useState<{ [key: string]: string }>({});
  const [skemaMap, setSkemaMap] = useState<{ [key: string]: string }>({});
  const [statusPengirimanMap, setStatusPengirimanMap] = useState<{
    [key: string]: string;
  }>({});
  const [statusPermintaanMap, setStatusPermintaanMap] = useState<{
    [key: string]: string;
  }>({});
  const [satuanMap, setSatuanMap] = useState<{ [key: string]: string }>({});
  // Tambah: divisiMap
  const [divisiMap, setDivisiMap] = useState<{ [key: string]: string }>({});

  // Ambil data referensi untuk label
  useEffect(() => {
    async function fetchRefs() {
      const [
        supplierRes,
        userRes,
        skemaRes,
        statusPengirimanRes,
        statusPermintaanRes,
        satuanRes,
        divisiRes,
      ] = await Promise.all([
        fetch("http://localhost:5000/api/supplier").then((r) => r.json()),
        fetch("http://localhost:5000/api/user").then((r) => r.json()),
        fetch("http://localhost:5000/api/skema").then((r) => r.json()),
        fetch("http://localhost:5000/api/status-pengiriman").then((r) =>
          r.json()
        ),
        fetch("http://localhost:5000/api/status-permintaan").then((r) =>
          r.json()
        ),
        fetch("http://localhost:5000/api/satuan").then((r) => r.json()),
        fetch("http://localhost:5000/api/divisi").then((r) => r.json()),
      ]);
      setSupplierMap(
        Object.fromEntries(
          supplierRes.map((s: any) => [String(s.id_supplier), s.namaSupplier])
        )
      );
      setUserMap(
        Object.fromEntries(
          userRes.map((u: any) => [String(u.id_user), u.nama_pengguna])
        )
      );
      setSkemaMap(
        Object.fromEntries(
          skemaRes.map((s: any) => [String(s.id_skema), s.skema])
        )
      );
      setStatusPengirimanMap(
        Object.fromEntries(
          statusPengirimanRes.map((sp: any) => [
            String(sp.id_statusPengiriman),
            sp.status_pengiriman,
          ])
        )
      );
      setStatusPermintaanMap(
        Object.fromEntries(
          statusPermintaanRes.map((sp: any) => [
            String(sp.id_statusPermintaan),
            sp.status_permintaan,
          ])
        )
      );
      setSatuanMap(
        Object.fromEntries(
          satuanRes.map((s: any) => [String(s.id_satuan), s.satuan])
        )
      );
      setDivisiMap(
        Object.fromEntries(
          divisiRes.map((d: any) => [String(d.id_divisi), d.divisi])
        )
      );
    }
    fetchRefs();
  }, []);

  // Ambil data PR dan PR Item dari backend API, bukan localStorage
  useEffect(() => {
    async function fetchData() {
      try {
        // Ambil data PR, PR Item, PO, PO Item, BTB, BTB Item, BKB, BKB Item
        const [
          prRes,
          prItemRes,
          poRes,
          poItemRes,
          btbRes,
          btbItemRes,
          bkbRes,
          bkbItemRes,
        ] = await Promise.all([
          fetch("http://localhost:5000/api/pr").then((r) => r.json()),
          fetch("http://localhost:5000/api/pr-item").then((r) => r.json()),
          fetch("http://localhost:5000/api/po").then((r) => r.json()),
          fetch("http://localhost:5000/api/po-item").then((r) => r.json()),
          fetch("http://localhost:5000/api/btb").then((r) => r.json()),
          fetch("http://localhost:5000/api/btb-item").then((r) => r.json()),
          fetch("http://localhost:5000/api/bkb").then((r) => r.json()),
          fetch("http://localhost:5000/api/bkb-item").then((r) => r.json()),
        ]);
        const prData = Array.isArray(prRes) ? prRes : [];
        const prItemData = Array.isArray(prItemRes) ? prItemRes : [];
        const poData = Array.isArray(poRes) ? poRes : [];
        const poItemData = Array.isArray(poItemRes) ? poItemRes : [];
        const btbData = Array.isArray(btbRes) ? btbRes : [];
        const btbItemData = Array.isArray(btbItemRes) ? btbItemRes : [];
        const bkbData = Array.isArray(bkbRes) ? bkbRes : [];
        const bkbItemData = Array.isArray(bkbItemRes) ? bkbItemRes : [];

        const rekapRows: any[] = [];
        prData.forEach((pr) => {
          const items = prItemData.filter(
            (item: any) => item.id_PR === pr.id_PR
          );
          items.forEach((item: any, idx: number) => {
            // Cari PO Item yang terkait dengan PR Item ini
            const poItem = poItemData.find(
              (poi: any) => poi.id_PRItem === item.id_PRItem
            );
            // Cari PO yang terkait dengan PO Item ini
            const po = poItem
              ? poData.find((p: any) => p.id_PO === poItem.id_PO)
              : null;

            // Format tanggal PR dan PO
            const formatTanggal = (tgl: string) => {
              if (!tgl) return "";
              const d = new Date(tgl);
              return `${d.getDate().toString().padStart(2, "0")}-${(
                d.getMonth() + 1
              )
                .toString()
                .padStart(2, "0")}-${d.getFullYear()}`;
            };

            const targetTanggalPO = pr.tanggalPR
              ? formatTanggal(addWorkingDays(pr.tanggalPR, 3))
              : "";
            let delay = "";
            if (pr.tanggalPR && pr.tanggalPO) {
              delay =
                countWorkingDaysBetween(pr.tanggalPR, pr.tanggalPO) + " Hari";
            }

            // === BTB Mapping ===
            // Cari BTB yang terkait dengan PO
            let btbRow = null;
            if (po) {
              btbRow = btbData.find((b: any) => b.id_po === po.id_PO);
            }
            // Cari BTB Item yang terkait dengan BTB dan PR Item (via PO Item)
            let btbItemRow = null;
            if (btbRow) {
              btbItemRow = btbItemData.find(
                (bi: any) =>
                  bi.id_btb === btbRow.id_btb &&
                  poItem &&
                  bi.id_POItem === poItem.id_POItem
              );
            }

            // === BKB Mapping ===
            // Cari BKB Item yang terkait dengan BTB Item (via id_btb_item)
            let bkbItemRows: any[] = [];
            if (btbItemRow) {
              bkbItemRows = bkbItemData.filter(
                (bki: any) => bki.id_btb_item === btbItemRow.id_btb_item
              );
            }
            // Jika tidak ada BKB, tetap push satu baris kosong
            if (bkbItemRows.length === 0) {
              bkbItemRows = [null];
            }

            bkbItemRows.forEach((bkbItemRow) => {
              // Cari BKB header
              let bkbRow = null;
              if (bkbItemRow && bkbItemRow.id_bkb) {
                bkbRow = bkbData.find(
                  (b: any) => b.id_bkb === bkbItemRow.id_bkb
                );
              }
              rekapRows.push({
                id:
                  pr.id_PR +
                  "-" +
                  idx +
                  (bkbItemRow ? "-bkb-" + bkbItemRow.id_bkb_item : ""),
                tahunPR: getYear(pr.tanggalPR),
                bulanPR: getMonthName(pr.tanggalPR),
                noPR: pr.noPR,
                tanggalPR: formatTanggal(pr.tanggalPR),
                hariPR: getDayName(pr.tanggalPR),
                daftarBarangPR: item.namaBarang,
                quantityAwalPR: item.quantityAwalPR,
                quantityPR: item.jumlah,
                // Ubah ke label satuan PR
                satuanPR: item.id_satuan
                  ? satuanMap[String(item.id_satuan)] || item.id_satuan
                  : "",
                keteranganPR: item.keterangan || "",
                // Ubah ke label divisi
                divisi: pr.id_divisi
                  ? divisiMap[String(pr.id_divisi)] || pr.id_divisi
                  : "",
                dibuatOleh: pr.dibuatOleh,
                // Ubah ke label skema PR
                skemaPR: pr.id_skema
                  ? skemaMap[String(pr.id_skema)] || pr.id_skema
                  : "",
                targetTanggalPO: targetTanggalPO,
                delay: delay,
                // Kolom PO
                noPO: po?.noPO || "",
                tanggalPO: formatTanggal(po?.tanggalPO || ""),
                daftarBarangPO: poItem ? item.namaBarang : "",
                quantityPO: poItem?.jumlahPO ?? "",
                satuanPO: poItem?.id_satuan ?? "",
                keteranganPO: poItem?.keterangan ?? "",
                diskonPersen: po?.diskon ?? "",
                diskonRp: po?.originalDiskon ?? "",
                ppnPersen: po?.ppn ?? "",
                ppnRp: po?.ppnAmount ?? "",
                totalHarga: po?.totalPembayaran ?? "",
                tanggalEstimasiDiterima: formatTanggal(
                  po?.estimasiTanggalTerima || ""
                ),
                kode: po?.id_statusPermintaan
                  ? statusPermintaanMap[String(po.id_statusPermintaan)] || ""
                  : "",
                statusPengiriman: po?.id_statusPengiriman
                  ? statusPengirimanMap[String(po.id_statusPengiriman)] || ""
                  : "",
                supplier: po?.id_supplier
                  ? supplierMap[String(po.id_supplier)] || ""
                  : "",
                diorderOleh: po?.orderedBy
                  ? userMap[String(po.orderedBy)] || ""
                  : "",
                skemaPO: po?.id_skema
                  ? skemaMap[String(po.id_skema)] || ""
                  : "",
                // === Kolom BTB ===
                noBTB: btbRow?.no_btb || "",
                tanggalBTB: formatTanggal(btbRow?.tanggal_btb || ""),
                periodeBTB: btbRow?.periode || "",
                namaSupplierBTB: btbRow?.id_supplier
                  ? supplierMap[String(btbRow.id_supplier)] || ""
                  : "",
                namaBarangBTB: btbItemRow?.nama_barang || "",
                quantityBTB: btbItemRow?.jumlah_diterima ?? "",
                satuanBTB: btbItemRow?.id_satuan
                  ? satuanMap[String(btbItemRow.id_satuan)] || ""
                  : "",
                biayaBTB: btbRow?.biaya ?? "",
                diterimaOleh: btbRow?.id_user
                  ? userMap[String(btbRow.id_user)] || ""
                  : "",
                skemaBTB: btbRow?.id_skema
                  ? skemaMap[String(btbRow.id_skema)] || ""
                  : "",
                // === Kolom BKB ===
                noBKB: bkbRow?.no_bkb || "",
                tanggalBKB: formatTanggal(bkbRow?.tanggal_bkb || ""),
                namaBarangBKB: bkbItemRow?.nama_barang || "",
                quantityBKB: bkbItemRow?.jumlah_keluar ?? "",
                satuanBKB: bkbItemRow?.id_satuan
                  ? satuanMap[String(bkbItemRow.id_satuan)] || ""
                  : "",
                keteranganBKB: bkbItemRow?.keterangan || "",
                dikeluarkanOleh: bkbRow?.dikeluarkan_oleh
                  ? userMap[String(bkbRow.dikeluarkan_oleh)] || ""
                  : "",
                skemaBKB: bkbRow?.id_skema
                  ? skemaMap[String(bkbRow.id_skema)] || ""
                  : "",
              });
            });
          });
        });
        setRekapData(rekapRows);
      } catch (err) {
        setRekapData([]);
      }
    }
    fetchData();
    // Tambahkan dependensi agar label map selalu update
  }, [
    supplierMap,
    userMap,
    skemaMap,
    statusPengirimanMap,
    statusPermintaanMap,
    satuanMap,
  ]);

  // Unique values for dropdown filter
  const uniqueValues: { [key: string]: string[] } = {};
  columns.forEach((col) => {
    uniqueValues[col.key] = Array.from(
      new Set(rekapData.map((row) => row[col.key]).filter(Boolean))
    ).sort();
  });

  // Filtered data (tanpa filter role/divisi/skema)
  const filteredData = rekapData.filter((row) => {
    // Global search
    const matchesSearch =
      !searchTerm ||
      columns.some((col) =>
        String(row[col.key] ?? "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    const matchesFilters = Object.entries(filters).every(([key, val]) => {
      if (!val || (Array.isArray(val) && val.length === 0)) return true;
      if (Array.isArray(val)) return val.includes(row[key]);
      return String(row[key] ?? "")
        .toLowerCase()
        .includes(String(val).toLowerCase());
    });
    return matchesSearch && matchesFilters;
  });

  // Pagination
  const pagedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle filter change
  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Data untuk export sesuai mode
  const getExportData = () => {
    if (exportMode === "selected") {
      return filteredData.filter((row) => selectedIds.includes(row.id));
    }
    if (exportMode === "range" && exportStartDate && exportEndDate) {
      return filteredData.filter(
        (row) =>
          row.tanggalPR &&
          row.tanggalPR >= exportStartDate &&
          row.tanggalPR <= exportEndDate
      );
    }
    return filteredData;
  };

  const handleExport = async () => {
    const exportData = getExportData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rekap Full");

    const headers = columns.map((col) => col.label);
    const headerRow = worksheet.addRow(headers);

    // Style header
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center" };
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
      };
    });

    // Add data rows
    exportData.forEach((row) => {
      worksheet.addRow(
        columns.map((col) => {
          if (
            [
              "quantityAwalPR",
              "quantityPR",
              "diskonPersen",
              "ppnPersen",
              "quantityBTB",
            ].includes(col.key)
          ) {
            return formatInt(row[col.key]);
          }
          if (
            ["biayaBTB", "totalHarga", "ppnRp", "diskonRp"].includes(col.key)
          ) {
            return formatRupiahFull(row[col.key]);
          }
          return row[col.key];
        })
      );
    });

    // Autofit columns (improved)
    worksheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? String(cell.value) : "";
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = maxLength;
    });

    worksheet.eachRow((row) => {
      row.height = 20;
    });

    // Download Excel file
    const fileName =
      "Rekap_Full_Monitoring_" +
      new Date().toISOString().slice(0, 10) +
      ".xlsx";
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle edit/delete
  const handleEdit = (row: any) => {
    alert("Edit: " + row.noPR);
  };
  const handleDelete = (id: string) => {
    if (confirm("Hapus data ini?")) {
      setRekapData((prev) => prev.filter((row) => row.id !== id));
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Rekap Full Monitoring
            </h1>
            <p className="text-muted-foreground">
              Tabel rekap PR dan PO dengan fitur filter dan pencarian
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <Label htmlFor="exportMode" className="text-xs font-medium mr-2">
                Mode Export
              </Label>
              <Select
                value={exportMode}
                onValueChange={(val) =>
                  setExportMode(val as "all" | "selected" | "range")
                }
              >
                <SelectTrigger id="exportMode" className="w-[140px] h-9">
                  <SelectValue placeholder="Export Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="selected">Terpilih</SelectItem>
                  <SelectItem value="range">Rentang Tanggal PR</SelectItem>
                </SelectContent>
              </Select>
              {exportMode === "range" && (
                <div className="flex items-center gap-2 ml-2">
                  <Label className="text-xs font-medium">Tanggal PR</Label>
                  <Input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-[130px] h-9"
                    placeholder="Mulai"
                  />
                  <span className="mx-1">-</span>
                  <Input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-[130px] h-9"
                    placeholder="Akhir"
                  />
                </div>
              )}
              <Button
                onClick={handleExport}
                className="bg-primary hover:bg-primary/90 h-9 ml-2"
                disabled={
                  (exportMode === "selected" && selectedIds.length === 0) ||
                  (exportMode === "range" &&
                    (!exportStartDate || !exportEndDate))
                }
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </div>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Daftar Rekap Full</CardTitle>
            <CardDescription>
              Total: {filteredData.length} data
              {filteredData.length > 0 && (
                <>
                  {" | "}
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredData.length)}
                  {" dari "}
                  {filteredData.length} data
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Cari semua kolom..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="overflow-x-auto">
              <Table className="border border-gray-300">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {exportMode === "selected" && (
                        <Checkbox
                          checked={pagedData.every((row) =>
                            selectedIds.includes(row.id)
                          )}
                          onCheckedChange={(checked) => {
                            const pageIds = pagedData.map((row) => row.id);
                            if (checked) {
                              setSelectedIds((prev) =>
                                Array.from(new Set([...prev, ...pageIds]))
                              );
                            } else {
                              setSelectedIds((prev) =>
                                prev.filter((id) => !pageIds.includes(id))
                              );
                            }
                          }}
                        />
                      )}
                    </TableHead>
                    {columns.map((col) => (
                      <TableHead key={col.key} className="text-left">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1"
                              aria-label={`Filter ${col.label}`}
                            >
                              {col.label} <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-2 !bg-white border border-gray-200 shadow-lg">
                            <Input
                              placeholder={`Cari ${col.label}...`}
                              value={filters[col.key + "_search"] || ""}
                              onChange={(e) =>
                                handleFilterChange(
                                  col.key + "_search",
                                  e.target.value
                                )
                              }
                            />
                            <div className="max-h-48 overflow-y-auto space-y-1 mt-2">
                              {uniqueValues[col.key]
                                .filter((val) =>
                                  typeof val === "string"
                                    ? val
                                        .toLowerCase()
                                        .includes(
                                          (
                                            filters[col.key + "_search"] || ""
                                          ).toLowerCase()
                                        )
                                    : false
                                )
                                .map((val) => (
                                  <div
                                    key={val}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`${col.key}-${val}`}
                                      checked={
                                        Array.isArray(filters[col.key])
                                          ? filters[col.key].includes(val)
                                          : false
                                      }
                                      onCheckedChange={(checked) => {
                                        let arr = Array.isArray(
                                          filters[col.key]
                                        )
                                          ? filters[col.key]
                                          : [];
                                        if (checked) {
                                          arr = [...arr, val];
                                        } else {
                                          arr = arr.filter((v) => v !== val);
                                        }
                                        handleFilterChange(col.key, arr);
                                      }}
                                    />
                                    <label
                                      htmlFor={`${col.key}-${val}`}
                                      className="text-sm"
                                    >
                                      {val}
                                    </label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                    ))}
                    <TableHead className="w-24 text-left">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedData.map((row, index) => (
                    <TableRow key={`${row.id}-${index}`}>
                      <TableCell>
                        {exportMode === "selected" && (
                          <Checkbox
                            checked={selectedIds.includes(row.id)}
                            onCheckedChange={(checked) => {
                              setSelectedIds((prev) =>
                                checked
                                  ? [...prev, row.id]
                                  : prev.filter((id) => id !== row.id)
                              );
                            }}
                          />
                        )}
                      </TableCell>
                      {columns.map((col) => (
                        <TableCell
                          key={col.key}
                          className="px-4 py-2 text-left"
                        >
                          {/* Format khusus untuk beberapa kolom */}
                          {[
                            "quantityAwalPR",
                            "quantityPR",
                            "diskonPersen",
                            "ppnPersen",
                            "quantityBTB",
                          ].includes(col.key)
                            ? formatInt(row[col.key])
                            : [
                                "biayaBTB",
                                "totalHarga",
                                "ppnRp",
                                "diskonRp",
                              ].includes(col.key)
                            ? formatRupiahFull(row[col.key])
                            : row[col.key]}
                        </TableCell>
                      ))}
                      <TableCell className="px-4 py-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(row)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(row.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              {Array.from(
                { length: Math.ceil(filteredData.length / itemsPerPage) },
                (_, i) => i + 1
              ).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage(
                      Math.min(
                        Math.ceil(filteredData.length / itemsPerPage),
                        currentPage + 1
                      )
                    )
                  }
                  className={
                    currentPage ===
                    Math.ceil(filteredData.length / itemsPerPage)
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </Card>
      </div>
    </MainLayout>
  );
}
