"use client";

import React, { useEffect, useState } from "react";
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

      if (pa.tahun !== pb.tahun) return pa.tahun - pb.tahun; // DESC
      if (pa.bulan !== pb.bulan) return pa.bulan - pb.bulan; // DESC
      return pa.urut - pb.urut; // DESC
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
  const [divisiMap, setDivisiMap] = useState<Record<string, string>>({});
  const [userSkemaId, setUserSkemaId] = useState<string>(""); // Tambah state id_skema user

  // Tambahkan state untuk export
   const tableWrapperRef = React.useRef<HTMLDivElement>(null);

  // Sinkronkan scroll antara tabel dan scrollbar custom
  React.useEffect(() => {
    const tableDiv = tableWrapperRef.current;
    if (!tableDiv) return;

    const handleTableScroll = () => {
      const stickyScrollbar = document.querySelector('.sticky') as HTMLElement;
      if (stickyScrollbar) {
        stickyScrollbar.scrollLeft = tableDiv.scrollLeft;
      }
    };

    tableDiv.addEventListener('scroll', handleTableScroll);
    return () => {
      tableDiv.removeEventListener('scroll', handleTableScroll);
    };
  }, []);
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
        // Ambil semua BKB, BKB Item, User, Skema, Satuan, BTB, Divisi, PR
        const [bkbRes, bkbItemRes, userRes, skemaRes, , btbRes, divisiRes, prRes] =
          await Promise.all([
            fetch("http://localhost:5000/api/bkb"),
            fetch("http://localhost:5000/api/bkb-item"),
            fetch("http://localhost:5000/api/user"),
            fetch("http://localhost:5000/api/skema"),
            fetch("http://localhost:5000/api/satuan"),
            fetch("http://localhost:5000/api/btb"),
            fetch("http://localhost:5000/api/divisi"),
            fetch("http://localhost:5000/api/pr"),
          ]);
        const bkbList = await bkbRes.json();
        const bkbItemList = await bkbItemRes.json();
        const userList = await userRes.json();
        const skemaList = await skemaRes.json();
        // satuanList tidak perlu, sudah di-fetch di atas
        const btbList = await btbRes.json();
        const divisiList = await divisiRes.json();
        const prList = await prRes.json();

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

        // Buat mapping id_divisi -> nama_divisi
        const divisiMapObj: Record<string, string> = {};
        divisiList.forEach((d: any) => {
          divisiMapObj[String(d.id_divisi)] = d.nama_divisi;
        });
        setDivisiMap(divisiMapObj);

        // Buat mapping id_pr dan no_pr -> id_divisi dari PR
        const prToDivisiMap: Record<string, string> = {};
        prList.forEach((pr: any) => {
          if (pr.id_pr && pr.id_divisi) prToDivisiMap[String(pr.id_pr)] = pr.id_divisi;
          if (pr.no_pr && pr.id_divisi) prToDivisiMap[String(pr.no_pr)] = pr.id_divisi;
        });

        // Gabungkan: untuk setiap bkb_item, cari parent bkb dan label satuan
        // Ambil divisi dari PR yang sama id_pr dengan BKB, fallback ke refrensiNoPr jika perlu
        const rows = bkbItemList.map((item: any) => {
          const bkb = bkbList.find((b: any) => b.id_bkb === item.id_bkb);
          let divisiId = "";
          if (bkb?.id_pr && prToDivisiMap[bkb.id_pr]) {
            divisiId = prToDivisiMap[bkb.id_pr];
          } else if (bkb?.refrensiNoPr && prToDivisiMap[bkb.refrensiNoPr]) {
            divisiId = prToDivisiMap[bkb.refrensiNoPr];
          }
          return {
            id: item.id_bkb_item,
            id_bkb: item.id_bkb,
            noBKB: bkb?.no_bkb ?? "",
            tanggalBKB: bkb?.tanggal_bkb ?? "",
            namaBarang: item.nama_barang ?? "",
            quantity: item.jumlah_keluar ?? "",
            satuan: satuanMap[String(item.id_satuan)] ?? "",
            keterangan: item.keterangan ?? "",
            dikeluarkanOleh: bkb?.dikeluarkan_oleh ?? "",
            diterima_oleh: bkb?.diterima_oleh ?? "",
            divisi: bkb?.divisi ?? "", // <-- ambil langsung dari bkb.divisi
            skema: bkb?.id_skema ?? "",
            noPR: bkb?.refrensiNoPr ?? "-",
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
    // Export data sesuai filter dan mode
    function getExportBKBData() {
      if (exportMode === "all") return filteredBKBData;
      if (exportMode === "selected") return filteredBKBData.filter((row) => selectedBKBIds.includes(row.id));
      if (exportMode === "range") {
        const start = exportStartDate ? new Date(exportStartDate) : null;
        const end = exportEndDate ? new Date(exportEndDate) : null;
        return filteredBKBData.filter((row) => {
          if (!row.tanggalBKB) return false;
          const tgl = new Date(row.tanggalBKB);
          return (!start || tgl >= start) && (!end || tgl <= end);
        });
      }
      return filteredBKBData;
    }
    const exportBKBData = getExportBKBData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monitoring BKB");

    // Header sesuai tampilan frontend (grouped)
    const headers = [
      "No. BKB",
      "Tanggal BKB",
      "Nama Barang",
      "Quantity BKB",
      "Satuan",
      "Keterangan",
      "Dikeluarkan Oleh",
      "Skema",
      "Divisi",
      "Refrensi Nomor PR",
    ];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "left", vertical: "middle" };
    });

    function formatTanggalExcel(tgl: string | null | undefined) {
      if (!tgl) return "";
      const [date] = tgl.split("T");
      const [y, m, d] = date.split("-");
      return y && m && d ? `${d}-${m}-${y}` : tgl;
    }
    function formatQtyExcel(val: any) {
      const num = Number(val);
      if (Number.isNaN(num)) return "";
      return num % 1 === 0 ? num.toString() : num.toString();
    }

    // Gabungkan baris berdasarkan id_bkb/noBKB
    const grouped = {};
    exportBKBData.forEach((row) => {
      const key = row.id_bkb || row.noBKB || row.id;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });

    Object.values(grouped).forEach((rows: any[]) => {
      const first = rows[0];
      rows.forEach((item, idx) => {
        const ket = item.keterangan ?? "";
        const ketShort = ket.length > 20 ? ket.slice(0, 20) + "..." : ket;
        worksheet.addRow([
          idx === 0 ? first.noBKB : "",
          idx === 0 ? formatTanggalExcel(first.tanggalBKB) : "",
          item.namaBarang,
          typeof item.quantity === "number" ? item.quantity : Number(item.quantity) || 0,
          item.satuan ?? "",
          ketShort,
          idx === 0 ? (userMap[String(first.dikeluarkanOleh)] ?? first.dikeluarkanOleh ?? "") : "",
          idx === 0 ? (skemaMap[String(first.skema)] ?? first.skema ?? "") : "",
          idx === 0 ? (first.divisi || "-") : "",
          idx === 0 ? (first.noPR || "-") : "",
        ]);
      });
      // Set number format for quantity column
      worksheet.getColumn(4).numFmt = '#,##0';
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


  // Restore-to-BTB modal and logic
  const [restoreItemModalOpen, setRestoreItemModalOpen] = useState(false);
  const [selectedBKBItemsForRestore, setSelectedBKBItemsForRestore] = useState<{ bkbId: string; items: any[] }[]>([]);
  const [selectedItemIdsToRestore, setSelectedItemIdsToRestore] = useState<string[]>([]);

  // Hapus BKB (multi/single) - restore ke BTB
  const handleDelete = (ids: string[] | string) => {
    // Ambil id_bkb unik dari baris yang dipilih
    const idList = Array.isArray(ids) ? ids : [ids];
    // Map id_bkb_item ke id_bkb (dari bkbRows)
    const idBkbList = Array.from(
      new Set(
        idList
          .map((id) => {
            const row = bkbRows.find((r) => r.id === id);
            if (row?.id_bkb) return row.id_bkb;
            const fallback = bkbRows.find(
              (r) => r.noBKB === row?.noBKB && r.tanggalBKB === row?.tanggalBKB
            );
            return fallback?.id_bkb;
          })
          .filter(Boolean)
      )
    );
    // Ambil semua item BKB yang memiliki id_bkb yang sama
    const bkbItems = Array.from(new Set(idBkbList)).map((bkbId) => ({
      bkbId,
      items: bkbRows.filter((row) => row.id_bkb === bkbId),
    }));
    setSelectedBKBItemsForRestore(bkbItems);
    setSelectedItemIdsToRestore([]);
    setRestoreItemModalOpen(true);
  };

  // Fungsi konfirmasi restore item ke BTB
  const confirmRestoreItems = async () => {
    setRestoreItemModalOpen(false);
    try {
      // Untuk setiap item yang dipilih, panggil endpoint restore ke BTB
      for (const bkbItemId of selectedItemIdsToRestore) {
        await fetch(`http://localhost:5000/api/bkb-item/restore-to-btb/${bkbItemId}`, {
          method: "POST",
        });
      }
      // Hapus item yang sudah direstore dari tampilan
      setBkbRows((prev) => prev.filter((row) => !selectedItemIdsToRestore.includes(String(row.id))));
      setSelectedBKBIds((prev) => prev.filter((id) => !selectedItemIdsToRestore.includes(String(id))));
      setToastMsg("Item BKB berhasil dikembalikan ke BTB.");
      setToastOpen(true);
    } catch (error) {
      setToastMsg("Terjadi kesalahan saat mengembalikan item ke BTB.");
      setToastOpen(true);
    }
    setSelectedItemIdsToRestore([]);
  };

  // Modal restore item BKB ke BTB
  function RestoreItemModal({
    open,
    bkbItems,
    selectedIds,
    setSelectedIds,
    onConfirm,
    onCancel,
  }: any) {
    if (!open) return null;
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white rounded-lg shadow-lg p-6 min-w-[420px] max-h-[80vh] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2">
            Pilih Item BKB yang akan dikembalikan ke BTB
          </h2>
          <div className="space-y-4">
            {bkbItems.map(({ bkbId, items }) => {
              const noBKB = items && items.length > 0 && items[0].noBKB ? items[0].noBKB : "-";
              return (
                <div key={bkbId}>
                  <div className="font-semibold mb-1">BKB: {noBKB}</div>
                  {items.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Tidak ada item pada BKB ini.</div>
                  ) : (
                    <div className="space-y-1">
                      {items.map((item: any, idx: number) => {
                        const keyId = item.id ? String(item.id) : `${item.namaBarang}-${item.quantity}-${idx}`;
                        const valueId = item.id ? String(item.id) : "";
                        return (
                          <label key={keyId} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value={valueId}
                              checked={selectedIds.includes(valueId)}
                              disabled={!valueId}
                              onChange={(e) => {
                                if (!valueId) return;
                                if (e.target.checked) {
                                  setSelectedIds([...selectedIds, valueId]);
                                } else {
                                  setSelectedIds(selectedIds.filter((x: string) => x !== valueId));
                                }
                              }}
                            />
                            <span>{item.namaBarang}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={selectedIds.length === 0}
            >
              Kembalikan ke BTB ({selectedIds.length})
            </Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // state untuk keterangan
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
                  <TableRow className="border border-gray-300">
                    {/* Checkbox header untuk export terpilih */}
                    <TableHead className="border border-gray-300 text-center align-middle px-3 py-2">
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
                    <TableHead className="border border-gray-300 text-center align-middle px-3 py-2">No. BKB</TableHead>
                    <TableHead className="border border-gray-300 text-center align-middle px-3 py-2">Tanggal BKB</TableHead>
                    <TableHead className="border border-gray-300 text-center align-middle px-3 py-2">Nama Barang</TableHead>
                    <TableHead className="border border-gray-300 text-center align-middle px-3 py-2">Quantity BKB</TableHead>
                    <TableHead className="border border-gray-300 text-center align-middle px-3 py-2">Satuan</TableHead>
                    <TableHead className="border border-gray-300 text-center align-middle px-3 py-2">Keterangan</TableHead>
                    <TableHead className="border border-gray-300 text-center align-middle px-3 py-2">Dikeluarkan Oleh</TableHead>
                    <TableHead className="border border-gray-300 text-center align-middle px-3 py-2">Nama Penerima</TableHead>
                    <TableHead className="border border-gray-300 text-center align-middle px-3 py-2">Divisi</TableHead>
                    <TableHead className="border border-gray-300 text-center align-middle px-3 py-2">Refrensi Nomor PR</TableHead>
                    <TableHead className="border border-gray-300 text-center align-middle px-3 py-2">Skema</TableHead>
                    <TableHead className="border border-gray-300 text-center align-middle px-3 py-2 min-w-[80px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={12}>Loading...</TableCell>
                    </TableRow>
                  ) : (
                    (() => {
                      // Group BKB by id_bkb
                      const grouped: { [id_bkb: string]: any[] } = {};
                      paginatedData.forEach((row) => {
                        const key = row.id_bkb;
                        if (!grouped[key]) grouped[key] = [];
                        grouped[key].push(row);
                      });
                      return Object.entries(grouped).map(([id_bkb, items]) => {
                        if (!items || items.length === 0) return null;
                        // Urutkan items ASC by id_bkb_item (atau id_bkbItem/id)
                        const sortedItems = [...items].sort((a, b) => {
                          const getId = (x) => x.id_bkb_item ?? x.id_bkbItem ?? x.id;
                          return getId(a) - getId(b);
                        });
                        return (
                          <React.Fragment key={id_bkb}>
                            <TableRow className="hover:bg-gray-50 transition-colors">
                              {/* Checkbox hanya di baris pertama */}
                              <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle">
                                {exportMode === "selected" && (
                                  <Checkbox
                                    checked={selectedBKBIds.includes(items[0].id)}
                                    onCheckedChange={(checked) => {
                                      setSelectedBKBIds((prev) =>
                                        checked
                                          ? [...prev, items[0].id]
                                          : prev.filter((id) => id !== items[0].id)
                                      );
                                    }}
                                  />
                                )}
                              </TableCell>
                              {/* No. BKB - rowSpan */}
                              <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap font-medium">
                                {items[0].noBKB}
                              </TableCell>
                              {/* Tanggal BKB - rowSpan */}
                              <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap">
                                {formatTanggalPas(items[0].tanggalBKB)}
                              </TableCell>
                              {/* Nama Barang - item pertama */}
                              <TableCell className="border border-gray-300 px-4 py-3 text-center whitespace-nowrap">
                                {sortedItems[0].namaBarang}
                              </TableCell>
                              {/* Quantity - item pertama */}
                              <TableCell className="border border-gray-300 px-4 py-3 text-center whitespace-nowrap">
                                <Badge
                                  variant={
                                    Number(sortedItems[0].quantity) > 0
                                      ? "default"
                                      : "destructive"
                                  }
                                >
                                  {formatInt(sortedItems[0].quantity)}
                                </Badge>
                              </TableCell>
                              {/* Satuan - item pertama */}
                              <TableCell className="border border-gray-300 px-4 py-3 text-center whitespace-nowrap">
                                {sortedItems[0].satuan}
                              </TableCell>
                              {/* Keterangan - item pertama */}
                              <TableCell className="border border-gray-300 px-4 py-3 text-center">
                                {sortedItems[0].keterangan ? (
                                  <span
                                    title={sortedItems[0].keterangan}
                                    style={{
                                      cursor: "pointer",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      maxWidth: 120,
                                      display: "inline-block",
                                      color: "#6b7280"
                                    }}
                                  >
                                    {sortedItems[0].keterangan.length > 15
                                      ? sortedItems[0].keterangan.slice(0, 15) + "..."
                                      : sortedItems[0].keterangan}
                                  </span>
                                ) : "-"}
                              </TableCell>
                              {/* Dikeluarkan Oleh - rowSpan */}
                              <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap">
                                {userMap[String(items[0].dikeluarkanOleh)] ?? items[0].dikeluarkanOleh}
                              </TableCell>
                              {/* Diterima Oleh - rowSpan */}
                              <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap">
                                {(userMap[String(items[0].diterima_oleh)] ?? items[0].diterima_oleh) || "-"}
                              </TableCell>
                              {/* Divisi - rowSpan */}
                              <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap">
                                {items[0].divisi || "-"}
                              </TableCell>
                              {/* Refrensi Nomor PR - rowSpan */}
                              <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap">
                                {items[0].noPR || "-"}
                              </TableCell>
                              {/* Skema - rowSpan */}
                              <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap">
                                {skemaMap[String(items[0].skema)] ?? items[0].skema}
                              </TableCell>
                              {/* Aksi - rowSpan */}
                              <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(items[0].id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                            {/* Baris item berikutnya */}
                            {sortedItems.slice(1).map((item, idx) => (
                              <TableRow key={`${id_bkb}-item-${idx + 1}`} className="hover:bg-gray-50 transition-colors">
                                {/* Nama Barang - item berikutnya */}
                                <TableCell className="border border-gray-300 px-4 py-3 text-center whitespace-nowrap">
                                  {item.namaBarang}
                                </TableCell>
                                {/* Quantity - item berikutnya */}
                                <TableCell className="border border-gray-300 px-4 py-3 text-center whitespace-nowrap">
                                  <Badge
                                    variant={
                                      Number(item.quantity) > 0
                                        ? "default"
                                        : "destructive"
                                    }
                                  >
                                    {formatInt(item.quantity)}
                                  </Badge>
                                </TableCell>
                                {/* Satuan - item berikutnya */}
                                <TableCell className="border border-gray-300 px-4 py-3 text-center whitespace-nowrap">
                                  {item.satuan}
                                </TableCell>
                                {/* Keterangan - item berikutnya */}
                                <TableCell className="border border-gray-300 px-4 py-3 text-center">
                                  {item.keterangan ? (
                                    <span
                                      title={item.keterangan}
                                      style={{
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        maxWidth: 120,
                                        display: "inline-block",
                                        color: "#6b7280"
                                      }}
                                    >
                                      {item.keterangan.length > 15
                                        ? item.keterangan.slice(0, 15) + "..."
                                        : item.keterangan}
                                    </span>
                                  ) : "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </React.Fragment>
                        );
                      });
                    })()
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
          title="Konfirmasi Kembalikan Item BKB ke BTB"
          description={`Apakah Anda ingin mengembalikan item BKB ke BTB? Data BKB yang dikembalikan akan mengupdate stok BTB.`}
          onConfirm={() => {
            setConfirmDeleteOpen(false);
            setRestoreItemModalOpen(true);
          }}
          onCancel={() => setConfirmDeleteOpen(false)}
        />
        <Toast
          open={toastOpen}
          message={toastMsg}
          onClose={() => setToastOpen(false)}
        />
        <RestoreItemModal
          open={restoreItemModalOpen}
          bkbItems={selectedBKBItemsForRestore}
          selectedIds={selectedItemIdsToRestore}
          setSelectedIds={setSelectedItemIdsToRestore}
          onConfirm={confirmRestoreItems}
          onCancel={() => setRestoreItemModalOpen(false)}
        />
      </div>
    </MainLayout>
  );
}
