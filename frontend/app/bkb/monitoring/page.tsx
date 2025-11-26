"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import * as ExcelJS from "exceljs";
import { Checkbox } from "@/components/ui/checkbox";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
dayjs.extend(utc);

// Helper format tanggal DD-MM-YYYY
function formatTanggal(tgl: string | null | undefined) {
  if (!tgl) return "-";
  const [date] = tgl.split("T");
  const [y, m, d] = date.split("-");
  if (!y || !m || !d) return tgl;
  return `${d}-${m}-${y}`;
}

// Tambah helper: tanggal +1 hari
function formatTanggalTambahSehari(tgl: string) {
  if (!tgl) return "-";
  let dateObj;
  if (/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
    dateObj = dayjs(tgl).add(1, "day");
  } else if (tgl.includes("T")) {
    dateObj = dayjs(tgl).add(1, "day");
  } else {
    dateObj = dayjs(tgl).add(1, "day");
  }
  return dateObj.format("DD-MM-YYYY");
}

function formatTanggalPas(tgl: string) {
  if (!tgl) return "-";
  return dayjs.utc(tgl).local().format("DD-MM-YYYY");
}

// Helper format integer tanpa .00
function formatInt(val: any) {
  if (val === undefined || val === null || val === "") return "";
  const num = Number(val);
  return Number.isNaN(num)
    ? ""
    : num % 1 === 0
    ? num.toString()
    : num.toFixed(2);
}

// ========================================
// 1. PARSER No. BKB (E-WALK + PENTA)
// ========================================
function parseNoBKB(noBKB: string | null | undefined) {
  if (!noBKB || typeof noBKB !== "string") return null;
  const s = noBKB.trim().toUpperCase();

  // --- FORMAT E-WALK ---
  // BKB/E-WALK/25/XI/0001
  const regexEwalk = /^BKB\/E-?WALK\/(\d{2})\/([IVXLCDM]{1,4})\/(\d{1,5})$/;

  // --- FORMAT PENTACITY ---
  // INV/BKB/25/XI/00001
  const regexPenta = /^INV\/BKB\/(\d{2})\/([IVXLCDM]{1,4})\/(\d{1,5})$/;

  let match = s.match(regexEwalk);
  let brand = "E-WALK";

  if (!match) {
    match = s.match(regexPenta);
    brand = "PENTA";
  }

  if (!match) return null;

  const [, tahun2, bulanRomawi, urutStr] = match;

  const bulanMap: Record<string, number> = {
    I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
    VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12,
  };

  const bulan = bulanMap[bulanRomawi] ?? 0;
  const tahun = 2000 + parseInt(tahun2, 10);
  const urut = parseInt(urutStr, 10);

  return { tahun, bulan, urut, brand };
}

// ========================================
// 2. SORTING BKB TERBARU → TERLAMA
// ========================================
function sortBKBList(filteredBKBData: any[]) {
  const allValid = filteredBKBData.every(
    (x) => typeof x.noBKB === "string" && parseNoBKB(x.noBKB)
  );

  if (allValid) {
    return [...filteredBKBData].sort((a, b) => {
      const pa = parseNoBKB(a.noBKB)!;
      const pb = parseNoBKB(b.noBKB)!;

      if (pb.tahun !== pa.tahun) return pb.tahun - pa.tahun; // DESC
      if (pb.bulan !== pa.bulan) return pb.bulan - pa.bulan; // DESC
      return pb.urut - pa.urut; // DESC
    });
  }

  // fallback
  return [...filteredBKBData].sort((a, b) => Number(b.id) - Number(a.id));
}

export default function BKBMonitoringPage() {
  const [bkbRows, setBkbRows] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [skemaMap, setSkemaMap] = useState<Record<string, string>>({});
  const [satuanMap, setSatuanMap] = useState<Record<string, string>>({});
  const [btbMap, setBtbMap] = useState<Record<string, string>>({});
  const [userSkemaId, setUserSkemaId] = useState<string>(""); // Tambah state id_skema user

  // Tambahkan state untuk export
  const [exportMode, setExportMode] = useState<"all" | "selected" | "range">(
    "all"
  );
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [selectedBKBIds, setSelectedBKBIds] = useState<string[]>([]);

  // Tambahkan state untuk konfirmasi hapus dan toast
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Fetch satuan list from backend and build mapping
  useEffect(() => {
    fetch("http://localhost:5000/api/satuan")
      .then((res) => res.json())
      .then((data) => {
        const map: Record<string, string> = {};
        data.forEach((s: any) => {
          map[String(s.id_satuan)] = s.satuan;
        });
        setSatuanMap(map);
      });
  }, []);

  // Ambil data dari backend
  useEffect(() => {
    async function fetchBKBData() {
      setLoading(true);
      try {
        // Ambil semua BKB, BKB Item, User, Skema, Satuan, BTB
        const [bkbRes, bkbItemRes, userRes, skemaRes, , btbRes] =
          await Promise.all([
            fetch("http://localhost:5000/api/bkb"),
            fetch("http://localhost:5000/api/bkb-item"),
            fetch("http://localhost:5000/api/user"),
            fetch("http://localhost:5000/api/skema"),
            fetch("http://localhost:5000/api/satuan"),
            fetch("http://localhost:5000/api/btb"),
          ]);
        const bkbList = await bkbRes.json();
        const bkbItemList = await bkbItemRes.json();
        const userList = await userRes.json();
        const skemaList = await skemaRes.json();
        // satuanList tidak perlu, sudah di-fetch di atas
        const btbList = await btbRes.json();

        // Buat mapping id_user -> nama_pengguna
        const userMapObj: Record<string, string> = {};
        userList.forEach((u: any) => {
          userMapObj[String(u.id_user)] = u.nama_pengguna;
        });
        setUserMap(userMapObj);

        // Buat mapping id_skema -> skema
        const skemaMapObj: Record<string, string> = {};
        skemaList.forEach((s: any) => {
          skemaMapObj[String(s.id_skema)] = s.skema;
        });
        setSkemaMap(skemaMapObj);

        // Buat mapping id_btb_item -> no_btb (asal BTB)
        const btbMapObj: Record<string, string> = {};
        btbList.forEach((btb: any) => {
          btbMapObj[String(btb.id_btb)] = btb.no_btb;
        });
        setBtbMap(btbMapObj);

        // Gabungkan: untuk setiap bkb_item, cari parent bkb dan label satuan
        // Tambahkan id_bkb ke setiap row
        const rows = bkbItemList.map((item: any) => {
          const bkb = bkbList.find((b: any) => b.id_bkb === item.id_bkb);
          return {
            id: item.id_bkb_item,
            id_bkb: item.id_bkb, // <-- tambahkan id_bkb parent
            noBKB: bkb?.no_bkb ?? "",
            tanggalBKB: bkb?.tanggal_bkb ?? "",
            namaBarang: item.nama_barang ?? "",
            quantity: item.jumlah_keluar ?? "",
            satuan: satuanMap[String(item.id_satuan)] ?? "",
            keterangan: item.keterangan ?? "",
            dikeluarkanOleh: bkb?.dikeluarkan_oleh ?? "",
            skema: bkb?.id_skema ?? "",
          };
        });
        setBkbRows(rows);
      } catch (err) {
        setBkbRows([]);
      }
      setLoading(false);
    }
    fetchBKBData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satuanMap]); // refetch rows when satuanMap ready

  // Ambil id_skema user dari localStorage
  useEffect(() => {
    const userRaw = localStorage.getItem("userData");
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        setUserSkemaId(String(user.id_skema ?? user.skema ?? ""));
      } catch {}
    }
  }, []);

  // Filter data
  const filteredBKBDataRaw = bkbRows
    // Filter hanya BKB dengan id_skema sesuai user login
    .filter((row) => !userSkemaId || String(row.skema) === String(userSkemaId))
    .filter((row) => {
      const matchesSearch =
        row.noBKB.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.namaBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.keterangan.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

  // --- SORTING: BKB TERBARU → TERLAMA (PAKAI PARSER) ---
  const filteredBKBData = sortBKBList(filteredBKBDataRaw);

  // --- Pagination logic ---
  const totalPages = Math.ceil(filteredBKBData.length / itemsPerPage);
  const paginatedData = filteredBKBData.slice(
    (currentPage - 1) * itemsPerPage,
    (currentPage) * itemsPerPage
  );

  // Export Excel function
  const handleExport = async () => {
    const exportBKBData = getExportBKBData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monitoring BKB");

    // Header sesuai urutan tabel monitoring BKB
    const headers = [
      "No. BKB",
      "Tanggal BKB",
      "Nama Barang",
      "Quantity BKB",
      "Satuan",
      "Keterangan",
      "Dikeluarkan Oleh",
      "Skema",
    ];

    // tambahkan menu header
  
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "left", vertical: "middle" };
    });

    // helper untuk tanggal dd-mm-yyyy
    function formatTanggalExcel(tgl: string | null | undefined) {
      if (!tgl) return "";
      const [date] = tgl.split("T");
      const [y, m, d] = date.split("-");
      return y && m && d ? `${d}-${m}-${y}` : tgl;
    }
    // Helper format quantity
    function formatQtyExcel(val: any) {
      const num = Number(val);
      if (Number.isNaN(num)) return "";
      return num % 1 === 0 ? num.toString() : num.toString();
    }

    // Add data rows persis seperti tampilan tabel
    exportBKBData.forEach((row) => {
      // Keterangan pendek (maks 20 karakter, sama seperti tampilan tabel)
      const ket = row.keterangan ?? "";
      const ketShort = ket.length > 20 ? ket.slice(0, 20) + "..." : ket;
      worksheet.addRow([
        row.noBKB,
        formatTanggalExcel(row.tanggalBKB),
        row.namaBarang,
        formatQtyExcel(row.quantity),
        row.satuan ?? "",
        ketShort,
        userMap[String(row.dikeluarkanOleh)] ?? row.dikeluarkanOleh ?? "",
        skemaMap[String(row.skema)] ?? row.skema ?? "",
      ]);
    });

    // auto fit kolom untuk best value
    worksheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? String(cell.value) : "";
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = maxLength;
    });

    // Set row heights for better readability
    worksheet.eachRow((row, rowNumber) => {
      row.height = rowNumber === 1 ? 22 : 18;
      row.alignment = { vertical: "middle" };
    });

    // Freeze header row
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monitoring-bkb-${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Auto-close toast
  useEffect(() => {
    if (toastOpen) {
      const timer = setTimeout(() => setToastOpen(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastOpen]);

  // Modal konfirmasi hapus
  function ConfirmModal({
    open,
    title,
    description,
    onConfirm,
    onCancel,
  }: any) {
    if (!open) return null;
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px]">
          <h2 className="text-lg font-semibold mb-2">{title}</h2>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              Hapus
            </Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Toast notifikasi
  function Toast({ open, message, onClose }: any) {
    if (!open) return null;
    return createPortal(
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white border border-gray-200 shadow-lg rounded px-4 py-2 flex items-center gap-2 animate-fade-in">
          <span className="text-green-600 font-medium">{message}</span>
          <Button size="sm" variant="ghost" onClick={onClose}>
            ×
          </Button>
        </div>
      </div>,
      document.body
    );
  }

  // Hapus BKB (multi/single) - hapus juga di backend
  const handleDelete = (ids: string[] | string) => {
    // Ambil id_bkb unik dari baris yang dipilih
    const idList = Array.isArray(ids) ? ids : [ids];
    // Map id_bkb_item ke id_bkb (dari bkbRows)
    const idBkbList = Array.from(
      new Set(
        idList
          .map((id) => {
            const row = bkbRows.find((r) => r.id === id);
            // row.id_bkb = id parent BKB
            // row.id = id_bkb_item
            // row.noBKB = no_bkb
            // row.tanggalBKB = tanggal_bkb
            // row.namaBarang = nama_barang
            // row.quantity = jumlah_keluar
            // row.satuan = satuan
            // row.keterangan = keterangan
            // row.dikeluarkanOleh = dikeluarkan_oleh
            // row.skema = id_skema
            // row.id_bkb bisa undefined jika mapping belum ada
            if (row?.id_bkb) return row.id_bkb;
            // fallback: cari dari noBKB dan tanggal
            const fallback = bkbRows.find(
              (r) => r.noBKB === row?.noBKB && r.tanggalBKB === row?.tanggalBKB
            );
            return fallback?.id_bkb;
          })
          .filter(Boolean)
      )
    );
    setDeleteIds(idBkbList as string[]);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    setConfirmDeleteOpen(false);
    try {
      for (const id_bkb of deleteIds) {
        // Hapus BKB di backend (beserta item, ON DELETE CASCADE)
        await fetch(`http://localhost:5000/api/bkb/${id_bkb}`, {
          method: "DELETE",
        });
      }
      // Hapus semua baris yang id_bkb-nya ada di deleteIds
      setBkbRows((prev) =>
        prev.filter((row) => !deleteIds.includes(String(row.id_bkb)))
      );
      setSelectedBKBIds((prev) =>
        prev.filter((id) => {
          const row = bkbRows.find((r) => r.id === id);
          return row && !deleteIds.includes(String(row.id_bkb));
        })
      );
      setToastMsg("BKB berhasil dihapus.");
      setToastOpen(true);
    } catch (error) {
      setToastMsg("Terjadi kesalahan saat menghapus BKB.");
      setToastOpen(true);
    }
    setDeleteIds([]);
  };

  // State untuk popover keterangan
  const [hoveredKeterangan, setHoveredKeterangan] = useState<string | null>(
    null
  );
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(
    null
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Monitoring BKB (Bukti Keluar Barang)
            </h1>
            <p className="text-muted-foreground">
              Pantau pengeluaran barang dari BTB
            </p>
          </div>
          {/* Export section: align like Monitoring PR/PO */}
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
                  <SelectItem value="range">Rentang Tanggal</SelectItem>
                </SelectContent>
              </Select>
              {exportMode === "range" && (
                <div className="flex items-center gap-2 ml-2">
                  <Label className="text-xs font-medium">Tanggal</Label>
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
                  (exportMode === "selected" && selectedBKBIds.length === 0) ||
                  (exportMode === "range" &&
                    (!exportStartDate || !exportEndDate))
                }
              >
                Export Excel
              </Button>
            </div>
          </div>
        </div>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Daftar Bukti Keluar Barang</CardTitle>
            <CardDescription>
              Total: {filteredBKBData.length} BKB Item
              {filteredBKBData.length > 0 && (
                <>
                  {" | "}
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredBKBData.length)}
                  {" dari "}
                  {filteredBKBData.length} BKB Item
                </>
              )}
            </CardDescription>
            {exportMode === "selected" && selectedBKBIds.length > 0 && (
              <Button
                variant="destructive"
                className="mt-2"
                onClick={() => handleDelete(selectedBKBIds)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus BKB Terpilih ({selectedBKBIds.length})
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="border border-gray-300">
                <TableHeader>
                  <TableRow>
                    {/* Checkbox header untuk export terpilih */}
                    <TableHead>
                      {exportMode === "selected" && (
                        <Checkbox
                          checked={paginatedData.every((row) =>
                            selectedBKBIds.includes(row.id)
                          )}
                          onCheckedChange={(checked) => {
                            const pageIds = paginatedData.map((row) => row.id);
                            if (checked) {
                              setSelectedBKBIds((prev) =>
                                Array.from(new Set([...prev, ...pageIds]))
                              );
                            } else {
                              setSelectedBKBIds((prev) =>
                                prev.filter((id) => !pageIds.includes(id))
                              );
                            }
                          }}
                        />
                      )}
                    </TableHead>
                    <TableHead>No. BKB</TableHead>
                    <TableHead>Tanggal BKB</TableHead>
                    <TableHead>Nama Barang</TableHead>
                    <TableHead>Quantity BKB</TableHead>
                    <TableHead>Satuan</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Dikeluarkan Oleh</TableHead>
                    <TableHead>Skema</TableHead>
                    {/* Tambahkan kolom aksi */}
                    <TableHead className="text-left min-w-[80px]">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9}>Loading...</TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((row, idx) => {
                      // Keterangan pendek (maks 20 karakter)
                      const ket = row.keterangan ?? "";
                      const ketShort =
                        ket.length > 20 ? ket.slice(0, 20) + "..." : ket;
                      return (
                        <TableRow key={row.id}>
                          {/* Checkbox cell agar jumlah kolom selalu sama */}
                          {exportMode === "selected" ? (
                            <TableCell>
                              <Checkbox
                                checked={selectedBKBIds.includes(row.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedBKBIds((prev) =>
                                    checked
                                      ? [...prev, row.id]
                                      : prev.filter((id) => id !== row.id)
                                  );
                                }}
                              />
                            </TableCell>
                          ) : (
                            <TableCell />
                          )}
                          <TableCell>{row.noBKB}</TableCell>
                          <TableCell>
                            {formatTanggalPas(row.tanggalBKB)}
                          </TableCell>
                          <TableCell>{row.namaBarang}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                Number(row.quantity) > 0
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {formatInt(row.quantity)}
                            </Badge>
                          </TableCell>
                          <TableCell>{row.satuan}</TableCell>
                          {/* Keterangan: tampilkan pendek, popover di luar tabel */}
                          <TableCell
                            onMouseEnter={(e) => {
                              if (ket.length > 20) {
                                setHoveredKeterangan(ket);
                                const rect = (
                                  e.target as HTMLElement
                                ).getBoundingClientRect();
                                setPopoverPos({
                                  x: rect.left + rect.width / 2,
                                  y: rect.bottom + window.scrollY,
                                });
                              }
                            }}
                            onMouseLeave={() => {
                              setHoveredKeterangan(null);
                              setPopoverPos(null);
                            }}
                            style={{
                              cursor: ket.length > 20 ? "pointer" : undefined,
                            }}
                          >
                            <span className="text-muted-foreground">
                              {ketShort}
                            </span>
                          </TableCell>
                          <TableCell>
                            {userMap[String(row.dikeluarkanOleh)] ??
                              row.dikeluarkanOleh}
                          </TableCell>
                          <TableCell>
                            {skemaMap[String(row.skema)] ?? row.skema}
                          </TableCell>
                          {/* Kolom aksi */}
                          <TableCell className="px-4 py-2 text-left">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(row.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              {/* Popover keterangan di luar tabel */}
              {hoveredKeterangan && popoverPos && (
                <div
                  style={{
                    position: "absolute",
                    left: popoverPos.x,
                    top: popoverPos.y + 8,
                    zIndex: 100,
                    background: "#f3f4f6",
                    color: "#6b7280",
                    borderRadius: 8,
                    boxShadow: "0 2px 8px #0001",
                    padding: "8px 14px",
                    maxWidth: 400,
                    fontSize: 14,
                    pointerEvents: "none",
                    transform: "translateX(-50%)",
                  }}
                >
                  {hoveredKeterangan}
                </div>
              )}
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </Card>
        {/* Modal dan Toast */}
        <ConfirmModal
          open={confirmDeleteOpen}
          title="Konfirmasi Hapus BKB"
          description={`Apakah Anda yakin ingin menghapus ${deleteIds.length} BKB? Data yang dihapus tidak dapat dikembalikan.`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteOpen(false)}
        />
        <Toast
          open={toastOpen}
          message={toastMsg}
          onClose={() => setToastOpen(false)}
        />
      </div>
    </MainLayout>
  );
}
