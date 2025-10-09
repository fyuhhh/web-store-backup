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

// Kolom sesuai urutan permintaan
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
  { key: "dibuatOleh", label: "Dibuat Oleh" }, // Tambah di sini
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
  { key: "subHargaDiskonRp", label: "Sub Harga-Diskon (Rp)" },
  { key: "ppnPersen", label: "PPN (%)" },
  { key: "ppnRp", label: "PPN (Rp)" },
  { key: "totalHarga", label: "Total Harga" },
  { key: "tanggalEstimasiDiterima", label: "Tanggal Estimasi Diterima" },
  { key: "kode", label: "Kode" },
  { key: "statusPengiriman", label: "Status Pengiriman" },
  { key: "supplier", label: "Supplier" },
  { key: "diorderOleh", label: "Diorder Oleh" }, // Tambah di sini
  { key: "noBTB", label: "No. BTB" },
  { key: "tanggalBTB", label: "Tanggal BTB" },
  { key: "periodeBTB", label: "Periode" },
  { key: "namaSupplierBTB", label: "Nama Supplier BTB" },
  { key: "kodeSupplierBTB", label: "Kode Supplier BTB" },
  { key: "namaBarangBTB", label: "Nama Barang BTB" },
  { key: "quantityBTB", label: "Quantity BTB" },
  { key: "satuanBTB", label: "Satuan BTB" },
  { key: "biayaBTB", label: "Biaya BTB" },
  { key: "diterimaOleh", label: "Diterima Oleh" }, // Tambah di sini
  { key: "noBKB", label: "No. BKB" },
  { key: "tanggalBKB", label: "Tanggal BKB" },
  { key: "namaBarangBKB", label: "Nama Barang BKB" },
  { key: "quantityBKB", label: "Quantity BKB" },
  { key: "satuanBKB", label: "Satuan BKB" },
  { key: "keteranganBKB", label: "Keterangan BKB" },
  { key: "dikeluarkanOleh", label: "Dikeluarkan Oleh" }, // Tambah di sini
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

// Tambahkan helper formatRupiah
function formatRupiah(val: any) {
  if (val === undefined || val === "" || isNaN(val)) return "";
  return Number(val).toLocaleString("id-ID");
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
  const [userRole, setUserRole] = useState<string>("");
  const [userDivision, setUserDivision] = useState<string>("");

  // Ambil data PR dan PO dari localStorage, lalu gabungkan
  useEffect(() => {
    const prRaw = localStorage.getItem("prData");
    const poRaw = localStorage.getItem("poData");
    const btbRaw = localStorage.getItem("btbData");
    const bkbRaw = localStorage.getItem("bkbData"); // Ambil data BKB
    let prData: any[] = [];
    let poData: any[] = [];
    let btbData: any[] = [];
    let bkbData: any[] = [];
    try {
      prData = prRaw ? JSON.parse(prRaw) : [];
      poData = poRaw ? JSON.parse(poRaw) : [];
      btbData = btbRaw ? JSON.parse(btbRaw) : [];
      bkbData = bkbRaw ? JSON.parse(bkbRaw) : [];
    } catch {
      prData = [];
      poData = [];
      btbData = [];
      bkbData = [];
    }

    // Gabungkan PR dan PO berdasarkan noPR (relasi)
    const rekapRows: any[] = [];
    prData.forEach((pr) => {
      (pr.items || []).forEach((item: any, idx: number) => {
        const quantityAwalPR = item.quantityAwalPR ?? item.jumlah;
        // Cari semua PO yang mengambil barang ini dari PR ini, urutkan berdasarkan tanggalPO
        const relatedPOs = poData
          .filter((po) =>
            po.poItems.some(
              (poItem: any) =>
                poItem.noPR === pr.noPR &&
                poItem.items.some(
                  (itm: any) => itm.namaBarang === item.namaBarang
                )
            )
          )
          .sort(
            (a, b) =>
              new Date(a.tanggalPO).getTime() - new Date(b.tanggalPO).getTime()
          );

        let totalQtyPO = 0;
        // Jika tidak ada PO, tetap tampilkan baris PR (qty PR = qty awal)
        if (relatedPOs.length === 0) {
          rekapRows.push({
            id: pr.id + "-" + idx,
            tahunPR: getYear(pr.tanggalPR),
            bulanPR: getMonthName(pr.tanggalPR),
            noPR: pr.noPR,
            tanggalPR: pr.tanggalPR,
            hariPR: getDayName(pr.tanggalPR),
            daftarBarangPR: item.namaBarang,
            quantityAwalPR: quantityAwalPR,
            quantityPR: quantityAwalPR,
            satuanPR: item.satuan,
            keteranganPR: item.keterangan || "",
            divisi: pr.divisi,
            targetTanggalPO: "",
            delay: "",
            noPO: "",
            tanggalPO: "",
            daftarBarangPO: "",
            quantityPO: "",
            satuanPO: "",
            keteranganPO: "",
            diskonPersen: "",
            diskonRp: "",
            subHargaDiskonRp: "",
            ppnPersen: "",
            ppnRp: "",
            totalHarga: "",
            dibuatOleh: pr.dibuatOleh,
            tanggalEstimasiDiterima: "",
            kode: "",
            statusPengiriman: "",
            supplier: "",
            // Tambahkan data BTB kosong
            noBTB: "",
            tanggalBTB: "",
            periodeBTB: "",
            namaSupplierBTB: "",
            kodeSupplierBTB: "",
            namaBarangBTB: "",
            quantityBTB: "",
            satuanBTB: "",
            biayaBTB: "",
            // Kolom BKB
            noBKB: "",
            tanggalBKB: "",
            namaBarangBKB: "",
            quantityBKB: "",
            satuanBKB: "",
            keteranganBKB: "",
            diorderOleh: "", // tetap kosong jika tidak ada PO
            diterimaOleh: "", // <-- kosong jika tidak ada BTB
            dikeluarkanOleh: "", // <-- kosong jika tidak ada BKB
          });
        }
        // Untuk setiap PO terkait barang PR ini, buat baris rekap
        relatedPOs.forEach((po) => {
          // Cari item PO yang match dengan barang PR
          let poItemMatch: any = null;
          let poItemParent: any = null;
          for (const poItem of po.poItems) {
            poItemMatch = poItem.items.find(
              (itm: any) =>
                itm.namaBarang === item.namaBarang && poItem.noPR === pr.noPR
            );
            if (poItemMatch) {
              poItemParent = poItem;
              break;
            }
          }
          // Akumulasi qty PO sampai PO ini
          const qtyPO = poItemMatch?.jumlahPO ?? 0;
          totalQtyPO += qtyPO;

          // --- FIX: Define btbMatch before using it below ---
          // Cari BTB yang terkait dengan PO dan barang
          const btbMatch = btbData.find(
            (btb: any) =>
              btb.poId === po.id &&
              (Array.isArray(btb.items) && btb.items.length > 0
                ? btb.items.some((itm: any) => itm.barang === item.namaBarang)
                : btb.barang === item.namaBarang)
          );
          // Ambil item BTB yang match
          const btbItemMatch = Array.isArray(btbMatch?.items)
            ? btbMatch.items.find((itm: any) => itm.barang === item.namaBarang)
            : btbMatch?.barang === item.namaBarang
            ? {
                barang: btbMatch.barang,
                jumlah: btbMatch.jumlah,
                satuan: btbMatch.satuan,
                biaya: btbMatch.biaya,
              }
            : null;

          // --- Tambahkan pencarian BKB terkait ---
          // Cari BKB yang terkait dengan BTB dan barang
          let bkbRow = null;
          if (btbMatch && bkbData.length > 0) {
            // Cek di semua BKB, pada field barang (array)
            for (const bkb of bkbData) {
              // Cek apakah ada barang yang match BTB dan nama barang
              const items = Array.isArray(bkb.barang)
                ? bkb.barang
                : bkb.items && Array.isArray(bkb.items)
                ? bkb.items
                : bkb.barang
                ? [{ ...bkb, ...bkb.barang }]
                : [];
              for (const bkbItem of items) {
                // Cek btbId dan nama barang
                if (
                  (bkbItem.btbId === btbMatch.id ||
                    (Array.isArray(bkb.sumberBTB) &&
                      bkb.sumberBTB.includes(btbMatch.noBTB))) &&
                  (bkbItem.barang === item.namaBarang ||
                    bkbItem.namaBarang === item.namaBarang)
                ) {
                  bkbRow = {
                    noBKB: bkb.noBKB,
                    tanggalBKB: bkb.tanggalBKB || bkb.tanggal,
                    namaBarangBKB: bkbItem.barang || bkbItem.namaBarang,
                    quantityBKB: bkbItem.jumlah,
                    satuanBKB: bkbItem.satuan,
                    keteranganBKB: bkbItem.keterangan || bkb.keterangan || "",
                    dibuatOleh: bkb.dibuatOleh ?? "",
                    dikeluarkanOleh: bkb.dikeluarkanOleh ?? "", // <-- ambil dari monitoring BKB
                  };
                  break;
                }
              }
              if (bkbRow) break;
            }
          }

          // Format rupiah helper
          const formatRp = (val: any) =>
            val !== undefined && val !== "" && !isNaN(val)
              ? "Rp " + Number(val).toLocaleString("id-ID")
              : "";

          // Diskon (%) dari input PO
          const diskonPersen = po.originalDiskon ?? po.diskonPersen ?? "";
          // Diskon (RP) dari hasil perhitungan PO (ambil dari po.diskon)
          const diskonRp = formatRp(po.diskon);

          // Sub Harga-Diskon (Rp): subtotal barang - total diskon
          const subHargaDiskonRp =
            poItemMatch && poItemMatch.hargaSatuan && qtyPO
              ? formatRp(poItemMatch.hargaSatuan * qtyPO - (po.diskon ?? 0))
              : "";

          // PPN (%) dari input PO
          const ppnPersen = po.ppnPersen ?? po.ppn ?? "";

          // --- Ambil PPN (Rp) dari ppnAmount PO, jika tidak ada hitung manual ---
          let ppnRp = "";
          if (po.ppnAmount !== undefined) {
            ppnRp = formatRp(po.ppnAmount);
          } else if (
            poItemMatch &&
            poItemMatch.hargaSatuan &&
            qtyPO &&
            po.ppn !== undefined
          ) {
            // Hitung manual jika data lama
            const subtotal = poItemMatch.hargaSatuan * qtyPO;
            const diskon = Number(po.diskon ?? 0);
            const ppnVal = Number(po.ppn ?? 0);
            const ppnAmountManual = (subtotal - diskon) * (ppnVal / 100);
            ppnRp = formatRp(ppnAmountManual);
          }

          // Total Harga dari PO
          const totalHarga = formatRp(po.totalPembayaran);

          rekapRows.push({
            id: pr.id + "-" + idx + "-" + po.noPO,
            tahunPR: getYear(pr.tanggalPR),
            bulanPR: getMonthName(pr.tanggalPR),
            noPR: pr.noPR,
            tanggalPR: pr.tanggalPR,
            hariPR: getDayName(pr.tanggalPR),
            daftarBarangPR: item.namaBarang,
            quantityAwalPR: quantityAwalPR,
            quantityPR: Math.max(0, quantityAwalPR - totalQtyPO),
            satuanPR: item.satuan,
            keteranganPR: item.keterangan || "",
            divisi: pr.divisi,
            targetTanggalPO: po.estimasiTanggalDiterima ?? "",
            delay:
              pr.tanggalPR && po.tanggalPO
                ? Math.max(
                    0,
                    Math.ceil(
                      (new Date(po.tanggalPO).getTime() -
                        new Date(pr.tanggalPR).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )
                : "",
            noPO: po.noPO ?? "",
            tanggalPO: po.tanggalPO ?? "",
            daftarBarangPO: poItemMatch?.namaBarang ?? "",
            quantityPO: qtyPO,
            satuanPO: poItemMatch?.satuan ?? "",
            keteranganPO: poItemMatch?.keterangan ?? "",
            diskonPersen: diskonPersen,
            diskonRp: diskonRp,
            subHargaDiskonRp: subHargaDiskonRp,
            ppnPersen: ppnPersen,
            ppnRp: ppnRp, // <-- pastikan ambil dari ppnAmount atau hitung manual
            totalHarga: totalHarga,
            dibuatOleh: pr.dibuatOleh,
            tanggalEstimasiDiterima: po.estimasiTanggalDiterima ?? "",
            kode: po.statusPermintaan ?? "",
            statusPengiriman: po.statusPengiriman ?? "",
            supplier: po.supplier ?? "",
            // Data BTB dari struktur monitoring BTB
            noBTB: btbMatch?.noBTB ?? "",
            tanggalBTB: btbMatch?.tanggal ?? "",
            periodeBTB: btbMatch?.periode ?? "",
            namaSupplierBTB: btbMatch?.supplier ?? "",
            kodeSupplierBTB: btbMatch?.kodeSupplier ?? "",
            namaBarangBTB: btbItemMatch?.barang ?? "",
            quantityBTB: btbItemMatch?.jumlah ?? "",
            satuanBTB: btbItemMatch?.satuan ?? "",
            biayaBTB:
              btbItemMatch?.biaya !== undefined && btbItemMatch?.biaya !== ""
                ? formatRupiah(btbItemMatch.biaya)
                : btbMatch?.biaya !== undefined && btbMatch?.biaya !== ""
                ? formatRupiah(btbMatch.biaya)
                : "",
            // Kolom BKB
            noBKB: bkbRow?.noBKB ?? "",
            tanggalBKB: bkbRow?.tanggalBKB ?? "",
            namaBarangBKB: bkbRow?.namaBarangBKB ?? "",
            quantityBKB: bkbRow?.quantityBKB ?? "",
            satuanBKB: bkbRow?.satuanBKB ?? "",
            keteranganBKB: bkbRow?.keteranganBKB ?? "",
            diorderOleh: po.orderedBy ?? "", // <-- ambil dari monitoring PO, kolom kanan status
            diterimaOleh: btbMatch?.diterimaOleh ?? "", // <-- ambil dari monitoring BTB
            dikeluarkanOleh: bkbRow?.dikeluarkanOleh ?? "", // <-- ambil dari BKB, field dikeluarkanOleh
          });
        });
      });
    });
    setRekapData(rekapRows);
  }, []);

  useEffect(() => {
    // Ambil userData dari localStorage
    const userRaw = localStorage.getItem("userData");
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        setUserRole(user.role);
        setUserDivision(user.division || "");
      } catch {}
    }
  }, []);

  // Unique values for dropdown filter
  const uniqueValues: { [key: string]: string[] } = {};
  columns.forEach((col) => {
    uniqueValues[col.key] = Array.from(
      new Set(rekapData.map((row) => row[col.key]).filter(Boolean))
    ).sort();
  });

  // Filtered data
  const filteredData = rekapData.filter((row) => {
    // Jika user divisi, hanya tampilkan data divisinya
    if (userRole === "divisi" && userDivision) {
      if ((row.divisi ?? "").toLowerCase() !== userDivision.toLowerCase()) {
        return false;
      }
    }
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
      worksheet.addRow(columns.map((col) => row[col.key]));
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
                          {row[col.key]}
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
