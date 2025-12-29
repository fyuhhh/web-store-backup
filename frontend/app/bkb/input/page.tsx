"use client";

import React, { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
// ========================================
// 2. SORTING BKB TERBARU → TERLAMA
// ========================================
function sortBKBList(filteredBKBData: any[]) {
  return [...filteredBKBData].sort((a, b) => {
    const pa = parseNoBKB(a.noBKB);
    const pb = parseNoBKB(b.noBKB);

    // Jika keduanya punya format valid, urutkan berdasarkan komponen ID (ASC / Terkecil -> Terbesar)
    if (pa && pb) {
      // Tahun ASC
      if (pa.tahun !== pb.tahun) return pa.tahun - pb.tahun;

      // Bulan ASC
      if (pa.bulan !== pb.bulan) return pa.bulan - pb.bulan;

      // Nomor urut ASC
      return pa.urut - pb.urut;
    }

    // Fallback: jika salah satu atau keduanya tidak valid, urutkan tanggal (ASC / Terlama -> Terbaru)
    // Gunakan string comparison untuk tanggal YYYY-MM-DD
    const dateA = a.tanggalBKB || "";
    const dateB = b.tanggalBKB || "";
    return dateA.localeCompare(dateB);
  });
}

export default function BKBMonitoringPage() {
  const [bkbRows, setBkbRows] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [skemaMap, setSkemaMap] = useState<Record<string, string>>({});
  const [satuanMap, setSatuanMap] = useState<Record<string, string>>({});
  const [btbMap, setBtbMap] = useState<Record<string, string>>({});
  const [divisiMap, setDivisiMap] = useState<Record<string, string>>({});
  const [userSkemaId, setUserSkemaId] = useState<string>(""); // Tambah state id_skema user
  const [startDate, setStartDate] = useState<Date | null>(null); // Tambahkan ini
  const [endDate, setEndDate] = useState<Date | null>(null);     // Tambahkan ini

  // Set default rentang tanggal ke awal & akhir bulan saat halaman diakses
  useEffect(() => {
    if (startDate === null && endDate === null) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(firstDay);
      setEndDate(lastDay);
    }
  }, [startDate, endDate]);

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
      } catch { }
    }
  }, []);

  // Filter data
  const filteredBKBDataRaw = bkbRows
    // Filter hanya BKB dengan id_skema sesuai user login
    .filter((row) => !userSkemaId || String(row.skema) === String(userSkemaId))
    // Filter berdasarkan searchTerm
    .filter((row) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        String(row.noBKB ?? "").toLowerCase().includes(search) ||
        String(row.namaBarang ?? "").toLowerCase().includes(search) ||
        String(row.keterangan ?? "").toLowerCase().includes(search) ||
        String(row.satuan ?? "").toLowerCase().includes(search) ||
        String(row.dikeluarkanOleh ?? "").toLowerCase().includes(search) ||
        String(row.diterima_oleh ?? "").toLowerCase().includes(search) ||
        String(row.divisi ?? "").toLowerCase().includes(search) ||
        String(row.noPR ?? "").toLowerCase().includes(search) ||
        String(row.tanggalBKB ?? "").toLowerCase().includes(search)
      );
    })
    // Filter berdasarkan rentang tanggal jika diisi
    .filter((row) => {
      let matchDateRange = true;
      if (startDate && endDate) {
        // row.tanggalBKB format: yyyy-mm-dd atau yyyy-mm-ddTHH:mm:ss
        const tgl = (row.tanggalBKB || "").split("T")[0];
        if (tgl) {
          const parts = tgl.split("-");
          const tglDate = new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
          );
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          matchDateRange = tglDate >= startDate && tglDate <= end;
        } else {
          matchDateRange = false;
        }
      }
      return matchDateRange;
    });

  // --- SORTING: BKB TERBARU → TERLAMA (ROBUST NUMERIC) ---
  const filteredBKBData = [...filteredBKBDataRaw].sort((a, b) => {
    // Helper parser
    function extractLastNumber(str: string | null | undefined): number {
      if (!str || typeof str !== 'string') return 0;
      const match = str.match(/(\d+)(?!.*\d)/);
      return match ? parseInt(match[1], 10) : 0;
    }

    const numA = extractLastNumber(a.noBKB);
    const numB = extractLastNumber(b.noBKB);
    if (numA !== numB) return numA - numB;

    const dateA = new Date(a.tanggalBKB || 0).getTime();
    const dateB = new Date(b.tanggalBKB || 0).getTime();
    return dateA - dateB;
  });

  // --- Pagination removed: show all data ---
  const paginatedData = filteredBKBData;

  // Export Excel function

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
  const handleExport = async () => {
    const exportBKBData = getExportBKBData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monitoring BKB");

    // Header sesuai tampilan frontend (grouped) - Exclude Skema
    const headers = [
      "No. BKB",
      "Tanggal BKB",
      "Nama Barang",
      "Quantity BKB",
      "Satuan",
      "Keterangan",
      "Dikeluarkan Oleh",
      "Divisi",
      "Refrensi Nomor PR",
    ];
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEEEEEE" },
      };
      cell.border = {
        top: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
      };
    });

    function formatTanggalExcel(tgl: string | null | undefined) {
      if (!tgl) return "";
      if (/^\d{2}-\d{2}-\d{4}$/.test(tgl)) return tgl;

      let datePart = tgl;
      if (tgl.includes("T")) datePart = tgl.split("T")[0];

      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        const [y, m, d] = datePart.split("-");
        return `${d}-${m}-${y}`;
      }

      const d = dayjs(tgl);
      if (d.isValid()) return d.format("DD-MM-YYYY");
      return tgl;
    }

    // Gabungkan baris berdasarkan id_bkb/noBKB
    const grouped = {};
    exportBKBData.forEach((row) => {
      const key = row.id_bkb || row.noBKB || row.id;
      // @ts-ignore
      if (!grouped[key]) grouped[key] = [];
      // @ts-ignore
      grouped[key].push(row);
    });

    Object.values(grouped).forEach((rows: any) => {
      const rowsArray = rows as any[];
      const first = rowsArray[0];
      rowsArray.forEach((item, idx) => {
        const ket = item.keterangan ?? "";
        // const ketShort = ket.length > 20 ? ket.slice(0, 20) + "..." : ket;
        const ketShort = ket; // Full text usually better for excel
        worksheet.addRow([
          idx === 0 ? first.noBKB : "",
          idx === 0 ? formatTanggalExcel(first.tanggalBKB) : "",
          item.namaBarang,
          Number(item.quantity) || 0,
          item.satuan ?? "",
          ketShort,
          idx === 0 ? (userMap[String(first.dikeluarkanOleh)] ?? first.dikeluarkanOleh ?? "") : "",
          idx === 0 ? (first.divisi || "-") : "",
          idx === 0 ? (first.noPR || "-") : "",
        ]);

        // Format Qty BKB (Col 4)
        worksheet.getCell(worksheet.lastRow!.number, 4).numFmt = '#,##0';
      });
    });

    // auto fit kolom untuk best value
    worksheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell && column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? String(cell.value) : "";
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = Math.min(maxLength, 50);
    });

    // Set row heights for better readability
    worksheet.eachRow((row, rowNumber) => {
      row.height = rowNumber === 1 ? 25 : 20;
      row.alignment = { vertical: "top", horizontal: "left", wrapText: true };
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
    a.download = `monitoring-bkb-${new Date().toISOString().split("T")[0]
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
            {bkbItems.map(({ bkbId, items }: any) => {
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
                  Menampilkan Semua Data
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
            {/* Filter tanggal BKB */}
            <div className="flex items-center gap-2 mb-4">
              <Label className="text-sm font-medium">Tanggal BKB:</Label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                dateFormat="yyyy-MM-dd"
                placeholderText="Mulai"
                className="w-[110px] px-2 py-1 border rounded-md bg-white text-xs"
                maxDate={endDate || undefined}
                isClearable
              />
              <span>-</span>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                dateFormat="yyyy-MM-dd"
                placeholderText="Selesai"
                className="w-[110px] px-2 py-1 border rounded-md bg-white text-xs"
                minDate={startDate || undefined}
                isClearable
              />
              <style jsx global>{`
                .react-datepicker__day.datepicker-red {
                  color: #e53935 !important;
                  font-weight: bold;
                }
                .react-datepicker-popper {
                  position: absolute !important;
                  top: 0 !important;
                  left: 0 !important;
                  z-index: 9999 !important;
                }
              `}</style>
            </div>
            {/* Search bar */}
            <div className="mb-4">
              <Input
                placeholder="Cari semua kolom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div
              className="overflow-auto"
              style={{
                maxHeight: "70vh", // adjust as needed
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
              }}
            >
              <Table className="border border-gray-300 min-w-[1400px]">
                <TableHeader>
                  <TableRow className="border border-gray-300">
                    {/* Checkbox header for export selected */}
                    <TableHead
                      className="border border-gray-300 text-center align-middle px-3 py-2"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
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
                    {/* Make all header cells sticky */}
                    {["NO. BKB", "TANGGAL BKB", "NAMA BARANG", "KUANTITAS BKB",
                      "SATUAN",
                      "KETERANGAN",
                      "DIKELUARKAN OLEH",
                      "NAMA PENERIMA",
                      "DIVISI",
                      "REFRENSI NOMOR PR",
                      // "SKEMA",
                      "AKSI",
                    ].map((label, idx) => (
                      <TableHead
                        key={label}
                        className="border border-gray-300 text-center align-middle px-3 py-2"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 2,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        {label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={12}>Loading...</TableCell>
                    </TableRow>
                  ) : (
                    (() => {
                      // Group BKB by id_bkb using Map to preserve order
                      const grouped = new Map<string, any[]>();
                      paginatedData.forEach((row) => {
                        const key = String(row.id_bkb);
                        if (!grouped.has(key)) grouped.set(key, []);
                        grouped.get(key)!.push(row);
                      });

                      return Array.from(grouped.entries()).map(([id_bkb, items]) => {
                        if (!items || items.length === 0) return null;
                        // Urutkan items ASC by id_bkb_item (atau id_bkbItem/id)
                        const sortedItems = [...items].sort((a, b) => {
                          const getId = (x: any) => x.id_bkb_item ?? x.id_bkbItem ?? x.id;
                          return getId(a) - getId(b);
                        });
                        return (
                          <React.Fragment key={id_bkb}>
                            <TableRow className="hover:bg-gray-50 transition-colors">
                              {/* Checkbox hanya di baris pertama */}
                              <TableCell rowSpan={items.length} className="border border-gray-300 px-3 py-1 text-center align-middle">
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
                              <TableCell rowSpan={items.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap font-medium uppercase">
                                {items[0].noBKB}
                              </TableCell>
                              {/* Tanggal BKB - rowSpan */}
                              <TableCell rowSpan={items.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap">
                                {formatTanggalPas(items[0].tanggalBKB)}
                              </TableCell>
                              {/* Nama Barang - item pertama */}
                              <TableCell className="border border-gray-300 px-3 py-1 text-left whitespace-nowrap uppercase">
                                {sortedItems[0].namaBarang}
                              </TableCell>
                              {/* Quantity - item pertama */}
                              <TableCell className="border border-gray-300 px-3 py-1 text-left whitespace-nowrap">
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
                              <TableCell className="border border-gray-300 px-3 py-1 text-left whitespace-nowrap uppercase">
                                {sortedItems[0].satuan}
                              </TableCell>
                              {/* Keterangan - item pertama */}
                              <TableCell className="border border-gray-300 px-3 py-1 text-left uppercase">
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
                              <TableCell rowSpan={items.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap uppercase">
                                {userMap[String(items[0].dikeluarkanOleh)] ?? items[0].dikeluarkanOleh}
                              </TableCell>
                              {/* Diterima Oleh - rowSpan */}
                              <TableCell rowSpan={items.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap uppercase">
                                {(userMap[String(items[0].diterima_oleh)] ?? items[0].diterima_oleh) || "-"}
                              </TableCell>
                              {/* Divisi - rowSpan */}
                              <TableCell rowSpan={items.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap uppercase">
                                {items[0].divisi || "-"}
                              </TableCell>
                              {/* Refrensi Nomor PR - rowSpan */}
                              <TableCell rowSpan={items.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap uppercase">
                                {items[0].noPR || "-"}
                              </TableCell>
                              {/* Skema - rowSpan */}
                              {/* <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap uppercase">
                                {skemaMap[String(items[0].skema)] ?? items[0].skema}
                              </TableCell> */}
                              {/* Aksi - rowSpan */}
                              <TableCell rowSpan={items.length} className="border border-gray-300 px-3 py-1 text-center align-middle">
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
                                <TableCell className="border border-gray-300 px-3 py-1 text-left whitespace-nowrap uppercase">
                                  {item.namaBarang}
                                </TableCell>
                                {/* Quantity - item berikutnya */}
                                <TableCell className="border border-gray-300 px-3 py-1 text-left whitespace-nowrap">
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
                                <TableCell className="border border-gray-300 px-3 py-1 text-left whitespace-nowrap uppercase">
                                  {item.satuan}
                                </TableCell>
                                {/* Keterangan - item berikutnya */}
                                <TableCell className="border border-gray-300 px-3 py-1 text-left uppercase">
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
          {/* Pagination removed */}
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
