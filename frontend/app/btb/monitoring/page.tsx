"use client";

import React from "react";
import type { ReactNode } from "react";
import * as ExcelJS from "exceljs";
import { ChevronDown } from "lucide-react";
// Tambahkan import Trash2
import { Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";

// Helper untuk format rupiah
function formatRupiah(val: any) {
  if (val === undefined || val === "" || isNaN(val)) return "";
  return "Rp " + Math.round(Number(val)).toLocaleString("id-ID"); // <-- pastikan integer
}

// Helper untuk format tanggal DD-MM-YYYY
function formatTanggal(tgl: string | null | undefined) {
  if (!tgl) return "-";
  const [date] = tgl.split("T");
  const [y, m, d] = date.split("-");
  if (!y || !m || !d) return tgl;
  return `${d}-${m}-${y}`;
}

// Helper untuk format integer tanpa .00
function formatInt(val: any) {
  if (val === undefined || val === null || val === "") return "";
  const num = Number(val);
  return Number.isNaN(num)
    ? ""
    : Math.round(num).toString(); // <-- pastikan integer
}

function formatTanggalLebihSehari(tgl: string) {
  if (!tgl) return "-";
  let dateObj;
  if (/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
    dateObj = dayjs(tgl).add(1, "day");
  } else if (tgl.includes("T")) {
    dateObj = dayjs.utc(tgl).add(1, "day");
  } else {
    dateObj = dayjs(tgl).add(1, "day");
  }
  return dateObj.format("DD-MM-YYYY");
}

// ========================================
// 1. PARSER No. BTB (E-WALK + PENTA)
// ========================================
// ========================================
// 1. PARSER No. BTB (E-WALK + PENTA)
// ========================================
function parseNoBTB(noBTB: string | null | undefined) {
  if (!noBTB || typeof noBTB !== "string") return { year: 0, month: 0, urut: 0 };
  const s = noBTB.trim().toUpperCase();

  const romanMap: { [key: string]: number } = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6,
    'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12
  };

  // Try to find year (2 digits) and month (roman)
  const matchMid = s.match(/\/(\d{2})\/([IVX]+)(?:\/|$)/);
  let year = 0;
  let month = 0;

  if (matchMid) {
    year = 2000 + parseInt(matchMid[1], 10);
    month = romanMap[matchMid[2]] || 0;
  }

  // Sequence: Last numeric part
  const matchSeq = s.match(/(\d+)(?!.*\d)/);
  let urut = matchSeq ? parseInt(matchSeq[1], 10) : 0;

  return { year, month, urut };
}

// ========================================
// 2. SORTING BTB TERBARU → TERLAMA
// ========================================
// ========================================
// 2. SORTING BTB TERBARU → TERLAMA
// ========================================
// ========================================
// 2. SORTING BTB TERBARU → TERLAMA
// ========================================
function sortBTBList(filteredBTBData: any[]) {
  return [...filteredBTBData].sort((a, b) => {
    const pa = parseNoBTB(a.noBTB);
    const pb = parseNoBTB(b.noBTB);

    // 1. Sort by Year (ASC)
    if (pa.year !== pb.year) return pa.year - pb.year;
    // 2. Sort by Month (ASC)
    if (pa.month !== pb.month) return pa.month - pb.month;
    // 3. Sort by Sequence (ASC)
    return pa.urut - pb.urut;
  });
}

export default function BTBMonitoringPage() {
  const [btbRows, setBtbRows] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

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

  // Filter states
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);

  // Set default rentang tanggal ke awal & akhir bulan saat halaman diakses
  useEffect(() => {
    if (filterStartDate === null && filterEndDate === null) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFilterStartDate(firstDay);
      setFilterEndDate(lastDay);
    }
  }, [filterStartDate, filterEndDate]);
  const [filterSupplier, setFilterSupplier] = useState<string[]>([]);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [barangSearchTerm, setBarangSearchTerm] = useState("");
  const [filterSatuan, setFilterSatuan] = useState<string[]>([]);
  const [satuanSearchTerm, setSatuanSearchTerm] = useState("");
  const [filterPeriode, setFilterPeriode] = useState("");
  const [filterTanggalBTB, setFilterTanggalBTB] = useState<string[]>([]);
  const [tanggalBTBSearchTerm, setTanggalBTBSearchTerm] = useState("");
  const [filterQtyMin, setFilterQtyMin] = useState<number | "">("");
  const [filterQtyMax, setFilterQtyMax] = useState<number | "">("");
  const [filterBiayaMin, setFilterBiayaMin] = useState<number | "">("");
  const [filterBiayaMax, setFilterBiayaMax] = useState<number | "">("");
  const [periodeSearchTerm, setPeriodeSearchTerm] = useState("");
  const [uniquePeriode, setUniquePeriode] = useState<string[]>([]);
  const [exportMode, setExportMode] = useState<"all" | "selected" | "range">(
    "all"
  );
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [userSchema, setUserSchema] = useState<string>("");
  const [userSkemaId, setUserSkemaId] = useState<string>(""); // Tambah state id_skema user
  const [loading, setLoading] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [skemaMap, setSkemaMap] = useState<Record<string, string>>({});
  // Tambahkan state selectedBTBIds
  const [selectedBTBIds, setSelectedBTBIds] = useState<string[]>([]);

  // Tambah state untuk modal konfirmasi dan toast
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Tambah state/modal untuk restore item BTB
  const [restoreItemModalOpen, setRestoreItemModalOpen] = useState(false);
  const [selectedBTBItemsForRestore, setSelectedBTBItemsForRestore] = useState<{ btbId: string; items: any[] }[]>([]);
  const [selectedItemIdsToRestore, setSelectedItemIdsToRestore] = useState<string[]>([]);
  // Tambah state untuk id_btb yang sudah diproses BKB
  const [btbProcessedInBKB, setBtbProcessedInBKB] = useState<string[]>([]);

  // Auto-close toast
  useEffect(() => {
    if (toastOpen) {
      const timer = setTimeout(() => setToastOpen(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastOpen]);

  // Komponen Modal dan Toast
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

  function Toast({ open, message, onClose }: any) {
    if (!open) return null;
    // Deteksi pesan gagal (mengandung kata 'gagal' atau 'tidak dapat')
    const isError = /gagal|tidak dapat|error/i.test(message);
    return createPortal(
      <div className="fixed bottom-6 right-6 z-50">
        <div className={`bg-white border border-gray-200 shadow-lg rounded px-4 py-2 flex items-center gap-2 animate-fade-in`}>
          <span className={isError ? "text-red-600 font-medium" : "text-green-600 font-medium"}>{message}</span>
          <Button size="sm" variant="ghost" onClick={onClose}>
            ×
          </Button>
        </div>
      </div>,
      document.body
    );
  }

  // Hapus BTB (multi/single) - hapus juga di backend
  const handleDelete = (ids: string[] | string) => {
    const idList = Array.isArray(ids) ? ids : [ids];
    // Ambil semua id_btb yang dipilih
    const btbIds = btbRows
      .filter((row) => idList.includes(row.id) || idList.includes(row.id_btb))
      .map((row) => row.id_btb);

    // Jika ada id_btb yang sudah diproses di BKB, tampilkan notif gagal dan batalkan aksi
    const processed = btbIds.filter((id) => btbProcessedInBKB.includes(String(id)));
    if (processed.length > 0) {
      setToastMsg("Gagal mengembalikan BTB ke PO, karena BTB telah di proses. Hapus BKB terkait telebih dahulu.");
      setToastOpen(true);
      return;
    }

    // Ambil semua item BTB yang memiliki id_btb yang sama
    const btbItems = Array.from(new Set(btbIds)).map((btbId) => ({
      btbId,
      items: btbRows.filter((row) => row.id_btb === btbId),
    }));

    setSelectedBTBItemsForRestore(btbItems);
    setSelectedItemIdsToRestore([]);
    setRestoreItemModalOpen(true);
  };

  // --- Fungsi restore item BTB ke PO ---
  const confirmRestoreItems = async () => {
    setRestoreItemModalOpen(false);
    try {
      const poIdsToCheck = new Set<string>();
      for (const itemId of selectedItemIdsToRestore) {
        // Ambil data item BTB
        const btbItemRes = await fetch(`http://localhost:5000/api/btb-item/${itemId}`);
        if (!btbItemRes.ok) continue;
        const btbItem = await btbItemRes.json();
        // Hapus item BTB
        await fetch(`http://localhost:5000/api/btb-item/${itemId}`, { method: "DELETE" });
        // Update jumlahPO di po_item (tambah kembali jumlah_diterima)
        const poItemRes = await fetch(`http://localhost:5000/api/po-item/${btbItem.id_POItem}`);
        if (poItemRes.ok) {
          const poItem = await poItemRes.json();
          const newJumlahPO = Number(poItem.jumlahPO) + Number(btbItem.jumlah_diterima);
          await fetch(`http://localhost:5000/api/po-item/${btbItem.id_POItem}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jumlahPO: newJumlahPO
            }),
          });
          if (poItem.id_PO) poIdsToCheck.add(String(poItem.id_PO));
        }
      }
      // Hapus BTB parent jika semua item sudah dihapus
      for (const { btbId } of selectedBTBItemsForRestore) {
        const btbItemRes = await fetch(`http://localhost:5000/api/btb-item?id_btb=${btbId}`);
        if (btbItemRes.ok) {
          const items = await btbItemRes.json();
          if (!items || items.length === 0) {
            // Hapus BTB parent pakai id_btb
            await fetch(`http://localhost:5000/api/btb/${btbId}`, { method: "DELETE" });
          }
        }
      }
      setToastMsg("Item BTB berhasil dikembalikan ke PO.");
      setToastOpen(true);
      // Refresh data
      window.location.reload();
    } catch (err) {
      setToastMsg("Gagal mengembalikan item BTB.");
      setToastOpen(true);
    }
    setSelectedItemIdsToRestore([]);
  };

  // Checkbox select all (per halaman)
  const handleSelectAll = (checked: boolean) => {
    const pageIds = filteredBTBData.map((row) => row.id);
    if (checked) {
      setSelectedBTBIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      setSelectedBTBIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  // Checkbox per baris
  const handleSelectBTB = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedBTBIds((prev) => [...prev, id]);
    } else {
      setSelectedBTBIds((prev) => prev.filter((x) => x !== id));
    }
  };

  // Ambil data dari backend
  useEffect(() => {
    async function fetchBTBData() {
      setLoading(true);
      try {
        // Ambil semua BTB, BTB Item, User, Skema, Satuan, dan BKB
        const [btbRes, btbItemRes, userRes, skemaRes, satuanRes, bkbRes] =
          await Promise.all([
            fetch("http://localhost:5000/api/btb"),
            fetch("http://localhost:5000/api/btb-item"),
            fetch("http://localhost:5000/api/user"),
            fetch("http://localhost:5000/api/skema"),
            fetch("http://localhost:5000/api/satuan"),
            fetch("http://localhost:5000/api/bkb"), // <-- ambil semua BKB
          ]);
        const btbList = await btbRes.json();
        const btbItemList = await btbItemRes.json();
        const userList = await userRes.json();
        let skemaListRaw = await skemaRes.json();
        const skemaList = Array.isArray(skemaListRaw)
          ? skemaListRaw
          : Object.values(skemaListRaw);
        const satuanList = await satuanRes.json();
        const bkbList = await bkbRes.json();

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

        // Buat mapping id_satuan -> satuanLabel
        const satuanMap: Record<string, string> = {};
        satuanList.forEach((s: any) => {
          satuanMap[String(s.id_satuan)] = s.satuan;
        });

        // Gabungkan: untuk setiap btb_item, cari parent btb
        const rows = btbItemList.map((item: any) => {
          const btb = btbList.find((b: any) => b.id_btb === item.id_btb);
          return {
            id: item.id_btb_item,
            id_btb: item.id_btb,
            noBTB: btb?.no_btb ?? "",
            tanggal: btb?.tanggal_btb ?? "",
            periode: btb?.periode ?? "",
            id_supplier: btb?.id_supplier ?? "",
            nama_supplier: btb?.nama_supplier ?? "",
            supplier: btb?.id_supplier ?? "",
            nama_barang: item.nama_barang ?? "",
            jumlah: item.jumlah_diterima ?? "",
            satuan: satuanMap[String(item.id_satuan)] ?? item.satuanLabel ?? "",
            sisa: item.qty_sisa ?? "",
            biaya: btb?.biaya ?? "",
            diterimaOleh: btb?.id_user ?? "",
            skema: btb?.id_skema ?? "",
            keterangan: item.keterangan ?? "", // <-- tambahkan keterangan dari btb_item
          };
        });
        setBtbRows(rows);

        // Cari id_btb yang sudah diproses di BKB
        const btbIdsInBKB = new Set<string>();
        bkbList.forEach((bkb: any) => {
          if (bkb.id_btb) btbIdsInBKB.add(String(bkb.id_btb));
        });
        setBtbProcessedInBKB(Array.from(btbIdsInBKB));
      } catch (err) {
        setBtbRows([]);
        setBtbProcessedInBKB([]);
      }
      setLoading(false);
    }
    fetchBTBData();
  }, []);

  useEffect(() => {
    setUniquePeriode(
      Array.from(
        new Set(btbRows.map((row) => row.periode).filter(Boolean))
      ).sort()
    );
  }, [btbRows]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    setUserSchema(userData.skema || "");
    setUserSkemaId(String(userData.id_skema ?? userData.skema ?? "")); // Set id_skema user
  }, []);

  // Compute unique values for filters dari btbRows
  const uniqueSuppliers = Array.from(
    new Set(btbRows.map((row) => row.supplier).filter((s) => s && s !== ""))
  ).sort();
  const uniqueSatuan = Array.from(
    new Set(btbRows.map((row) => row.satuan).filter((s) => s && s !== ""))
  ).sort();
  const uniqueTanggalBTB = Array.from(
    new Set(btbRows.map((row) => row.tanggal).filter(Boolean))
  ).sort();

  // Filter data
  const filteredBTBData = btbRows
    // Filter hanya BTB dengan id_skema sesuai user login
    .filter((row) => !userSkemaId || String(row.skema) === String(userSkemaId))
    .filter((row) => {
      // --- FITUR PENCARIAN GLOBAL ---
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        row.noBTB?.toLowerCase().includes(searchLower) ||
        String(row.nama_supplier ?? row.supplier ?? "")
          .toLowerCase()
          .includes(searchLower) ||
        String(row.nama_barang ?? "")
          .toLowerCase()
          .includes(searchLower);

      const matchesStatus = !filterStatus || row.status === filterStatus;

      // Filter barang (popover filter)
      const matchesBarangSearch =
        !barangSearchTerm ||
        row.barang.toLowerCase().includes(barangSearchTerm.toLowerCase());

      // Filter supplier
      const matchesSupplier =
        filterSupplier.length === 0 || filterSupplier.includes(row.supplier);

      // Filter satuan
      const matchesSatuan =
        filterSatuan.length === 0 || filterSatuan.includes(row.satuan);

      // Filter tanggal BTB
      const matchesTanggalBTB =
        filterTanggalBTB.length === 0 || filterTanggalBTB.includes(row.tanggal);

      // Filter periode
      const matchesPeriode =
        !filterPeriode ||
        row.periode === filterPeriode ||
        row.periode?.toLowerCase().includes(periodeSearchTerm.toLowerCase());

      // Filter quantity
      const matchesQtyMin =
        filterQtyMin === "" || Number(row.jumlah) >= Number(filterQtyMin);
      const matchesQtyMax =
        filterQtyMax === "" || Number(row.jumlah) <= Number(filterQtyMax);

      // Filter biaya
      const biayaVal = Number(row.biaya) || 0;
      const matchesBiayaMin =
        filterBiayaMin === "" || biayaVal >= Number(filterBiayaMin);
      const matchesBiayaMax =
        filterBiayaMax === "" || biayaVal <= Number(filterBiayaMax);

      // --- FILTER BY TANGGAL RENTANG (pakai DatePicker) ---
      let matchesDateRange = true;
      if (filterStartDate && filterEndDate) {
        // Assume row.tanggal is yyyy-mm-dd or yyyy-mm-ddTHH:mm:ss
        const tgl = (row.tanggal || "").split("T")[0];
        if (tgl) {
          const parts = tgl.split("-");
          // Buat date object local time (00:00:00)
          const tglDate = new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
          );
          // Set filterEndDate ke akhir hari (23:59:59) untuk perbandingan inklusif
          const end = new Date(filterEndDate);
          end.setHours(23, 59, 59, 999);

          matchesDateRange = tglDate >= filterStartDate && tglDate <= end;
        } else {
          matchesDateRange = false;
        }
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesBarangSearch &&
        matchesSupplier &&
        matchesSatuan &&
        matchesPeriode &&
        matchesTanggalBTB &&
        matchesQtyMin &&
        matchesQtyMax &&
        matchesBiayaMin &&
        matchesBiayaMax &&
        matchesDateRange
      );
    })
    .sort((a, b) => {
      const pa = parseNoBTB(a.noBTB);
      const pb = parseNoBTB(b.noBTB);

      // 1. Sort by Year (ASC)
      if (pa.year !== pb.year) return pa.year - pb.year;
      // 2. Sort by Month (ASC)
      if (pa.month !== pb.month) return pa.month - pb.month;
      // 3. Sort by Sequence (ASC)
      return pa.urut - pb.urut;
    });

  // Filter data untuk export
  const getExportData = () => {
    if (exportMode === "selected") {
      return filteredBTBData.filter((btb) => selectedBTBIds.includes(btb.id));
    }
    if (exportMode === "range" && exportStartDate && exportEndDate) {
      return filteredBTBData.filter((btb) => {
        return btb.tanggal >= exportStartDate && btb.tanggal <= exportEndDate;
      });
    }
    // default: all
    return filteredBTBData;
  };

  // Export Excel function

  const handleExport = async () => {
    const exportBTBData = getExportData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monitoring BTB");

    // Header sesuai urutan tabel (Exclude Skema)
    const headers = [
      "No. BTB",
      "Tanggal BTB",
      "Nama Supplier",
      "Nama Barang",
      "Quantity Awal BTB",
      "Satuan",
      "Keterangan",
      "Biaya",
      "Diterima Oleh",
      "Status",
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

    // Helper format tanggal persis UI string (DD-MM-YYYY)
    function formatTanggalExcel(tgl: string) {
      if (!tgl) return "";
      // Prioritize explicit substrings to avoid timezone shifts
      if (/^\d{2}-\d{2}-\d{4}$/.test(tgl)) return tgl;

      let datePart = tgl;
      if (tgl.includes("T")) datePart = tgl.split("T")[0];

      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        const [y, m, d] = datePart.split("-");
        return `${d}-${m}-${y}`;
      }

      // Fallback dayjs format
      const d = dayjs(tgl);
      if (d.isValid()) return d.format("DD-MM-YYYY");
      return tgl;
    }

    // Gabungkan baris berdasarkan id_btb
    const grouped = {};
    exportBTBData.forEach((row) => {
      const key = row.id_btb || row.id;
      // @ts-ignore
      if (!grouped[key]) grouped[key] = [];
      // @ts-ignore
      grouped[key].push(row);
    });

    Object.values(grouped).forEach((rows: any) => {
      const rowsArray = rows as any[];
      const first = rowsArray[0];
      const status = rowsArray.every((item) => Number(item.sisa) === 0) ? "Closed" : "Open";

      rowsArray.forEach((item, idx) => {
        worksheet.addRow([
          idx === 0 ? first.noBTB : "",
          idx === 0 ? formatTanggalExcel(first.tanggal) : "",
          idx === 0 ? (first.nama_supplier ?? first.supplier ?? "") : "",
          item.nama_barang ?? "",
          Number(item.jumlah) || 0, // Column 5: Qty
          item.satuan ?? "",
          item.keterangan ?? "",
          idx === 0 ? (Number(first.biaya) || 0) : "", // Column 8: Biaya
          idx === 0 ? (userMap[String(first.diterimaOleh)] ?? first.diterimaOleh ?? "") : "",
          idx === 0 ? status : "",
        ]);

        // Format Number Columns
        // Col 5: Qty
        worksheet.getCell(worksheet.lastRow!.number, 5).numFmt = '#,##0';

        // Col 8: Biaya (Currency)
        if (idx === 0) {
          worksheet.getCell(worksheet.lastRow!.number, 8).numFmt = '_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)';
        }
      });
    });

    // Auto-fit columns
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

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monitoring-btb-${new Date().toISOString().split("T")[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Auto-logout logic (testing: 5 detik idle)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.removeItem("userData");
        window.location.href = "/login";
      }, 600000); // 5 detik idle
    };

    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, []);

  // --- Modal restore item BTB ---
  function RestoreItemModal({
    open,
    btbItems,
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
            Pilih Item BTB yang akan dikembalikan ke PO
          </h2>
          <div className="space-y-4">
            {btbItems.map(({ btbId, items }: any) => {
              const noPO =
                items && items.length > 0 && items[0].noPO
                  ? items[0].noPO
                  : items && items.length > 0 && items[0].noBTB
                    ? items[0].noBTB
                    : "-";
              return (
                <div key={btbId}>
                  <div className="font-semibold mb-1">
                    BTB (No. PO): {noPO}
                  </div>
                  {items.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Tidak ada item pada BTB ini.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {items.map((item: any, idx: number) => {
                        const keyId = item.id ? String(item.id) : `${item.nama_barang}-${item.jumlah}-${idx}`;
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
                            <span>
                              {item.nama_barang}
                            </span>
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
              Kembalikan ke PO ({selectedIds.length})
            </Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Tambahkan definisi fungsi confirmDelete agar tidak error
  function confirmDelete() {
    setConfirmDeleteOpen(false);
    // ...tambahkan logika hapus jika diperlukan...
  }

  // --- SORTING: BTB TERBARU → TERLAMA (PAKAI PARSER) ---
  const sortedBTBDataFinal = sortBTBList(filteredBTBData);

  // --- Pagination removed ---
  // const totalPages = Math.ceil(sortedBTBDataFinal.length / itemsPerPage);
  const paginatedData = sortedBTBDataFinal;

  // Tambahkan helper untuk status BTB per noBTB
  function getBTBStatus(items: any[]) {
    if (!items || items.length === 0) return "-";
    // Jika semua qty_sisa (atau sisa) === 0 → Closed, jika ada yg > 0 → Open
    return items.every((item) => Number(item.sisa) === 0) ? "Closed" : "Open";
  }



  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Monitoring BTB (Bukti Terima Barang)
            </h1>
            <p className="text-muted-foreground">
              Pantau penerimaan barang dari Purchase Order
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
                  (exportMode === "selected" && selectedBTBIds.length === 0) ||
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
        {/* FITUR PENCARIAN GLOBAL & FILTER TANGGAL RENTANG */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Input
            placeholder="Cari No. BTB, Supplier, atau Nama Barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[320px]"
          />
          {/* Filter rentang tanggal BTB pakai DatePicker */}
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">Tanggal BTB:</span>
            <DatePicker
              selected={filterStartDate}
              onChange={(date) => setFilterStartDate(date)}
              selectsStart
              startDate={filterStartDate}
              endDate={filterEndDate}
              dateFormat="yyyy-MM-dd"
              placeholderText="Mulai"
              className="w-[110px] px-2 py-1 border rounded-md bg-white text-xs"
              maxDate={filterEndDate || undefined}
              isClearable
            />
            <span className="mx-1">-</span>
            <DatePicker
              selected={filterEndDate}
              onChange={(date) => setFilterEndDate(date)}
              selectsEnd
              startDate={filterStartDate}
              endDate={filterEndDate}
              dateFormat="yyyy-MM-dd"
              placeholderText="Selesai"
              className="w-[110px] px-2 py-1 border rounded-md bg-white text-xs"
              minDate={filterStartDate || undefined}
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
        </div>
        {/* Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Daftar Bukti Terima Barang</CardTitle>
            <CardDescription>
              Total: {filteredBTBData.length} BTB Item
            </CardDescription>
            {exportMode === "selected" && selectedBTBIds.length > 0 && (
              <Button
                variant="destructive"
                className="mt-2"
                onClick={() => handleDelete(selectedBTBIds)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus BTB Terpilih ({selectedBTBIds.length})
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div
              ref={tableWrapperRef}
              className="overflow-auto"
              style={{
                maxHeight: "70vh", // atau sesuaikan kebutuhan
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
              }}
            >
              <Table className="border border-gray-300 min-w-[1400px]">
                <TableHeader>
                  <TableRow className="border border-gray-300">
                    {/* Checkbox header untuk export terpilih */}
                    <TableHead
                      className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      {exportMode === "selected" && (
                        <Checkbox
                          checked={(() => {
                            if (filteredBTBData.length === 0) return false;
                            const allIds = filteredBTBData.map(row => row.id);
                            return allIds.every(id => selectedBTBIds.includes(id));
                          })()}
                          onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        />
                      )}
                    </TableHead>
                    {/* No. BTB */}
                    <TableHead
                      className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1 uppercase">
                            NO. BTB <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari No. BTB..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Tanggal BTB */}
                    <TableHead
                      className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1 uppercase">
                            TANGGAL BTB <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari tanggal..."
                            value={tanggalBTBSearchTerm}
                            onChange={(e) =>
                              setTanggalBTBSearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueTanggalBTB
                              .filter((t) =>
                                t
                                  .toLowerCase()
                                  .includes(tanggalBTBSearchTerm.toLowerCase())
                              )
                              .map((t) => (
                                <div
                                  key={t}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`tanggal-${t}`}
                                    checked={filterTanggalBTB.includes(t)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterTanggalBTB([
                                          ...filterTanggalBTB,
                                          t,
                                        ]);
                                      else
                                        setFilterTanggalBTB(
                                          filterTanggalBTB.filter(
                                            (x) => x !== t
                                          )
                                        );
                                    }}
                                  />
                                  <Label
                                    htmlFor={`tanggal-${t}`}
                                    className="text-sm"
                                  >
                                    {t}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Nama Supplier */}
                    <TableHead
                      className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1 uppercase">
                            NAMA SUPPLIER <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari supplier..."
                            value={supplierSearchTerm}
                            onChange={(e) =>
                              setSupplierSearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueSuppliers
                              .filter(
                                (s) =>
                                  typeof s === "string" &&
                                  s
                                    .toLowerCase()
                                    .includes(supplierSearchTerm.toLowerCase())
                              )
                              .map((s) => (
                                <div
                                  key={s}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`supplier-${s}`}
                                    checked={filterSupplier.includes(s)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterSupplier([
                                          ...filterSupplier,
                                          s,
                                        ]);
                                      else
                                        setFilterSupplier(
                                          filterSupplier.filter((x) => x !== s)
                                        );
                                    }}
                                  />
                                  <Label
                                    htmlFor={`supplier-${s}`}
                                    className="text-sm"
                                  >
                                    {s}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Nama Barang */}
                    <TableHead
                      className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1 uppercase">
                            NAMA BARANG <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari barang..."
                            value={barangSearchTerm}
                            onChange={(e) =>
                              setBarangSearchTerm(e.target.value)
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Quantity */}
                    <TableHead
                      className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1 uppercase">
                            KUANTITAS <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <div className="space-y-2">
                            <Input
                              placeholder="Min Qty"
                              type="number"
                              value={filterQtyMin}
                              onChange={(e) =>
                                setFilterQtyMin(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                            />
                            <Input
                              placeholder="Max Qty"
                              type="number"
                              value={filterQtyMax}
                              onChange={(e) =>
                                setFilterQtyMax(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* HAPUS: Quantity Sisa BTB */}
                    {/* <TableHead className="border border-gray-300 text-center min-w-[90px]">
            Quantity Sisa BTB
          </TableHead> */}
                    {/* Satuan */}
                    <TableHead
                      className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1 uppercase">
                            SATUAN <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari satuan..."
                            value={satuanSearchTerm}
                            onChange={(e) =>
                              setSatuanSearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueSatuan
                              .filter((s) =>
                                s
                                  .toLowerCase()
                                  .includes(satuanSearchTerm.toLowerCase())
                              )
                              .map((s) => (
                                <div
                                  key={s}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`satuan-${s}`}
                                    checked={filterSatuan.includes(s)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterSatuan([...filterSatuan, s]);
                                      else
                                        setFilterSatuan(
                                          filterSatuan.filter((x) => x !== s)
                                        );
                                    }}
                                  />
                                  <Label
                                    htmlFor={`satuan-${s}`}
                                    className="text-sm"
                                  >
                                    {s}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Keterangan */}
                    <TableHead
                      className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      KETERANGAN
                    </TableHead>
                    {/* Biaya */}
                    <TableHead
                      className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1 uppercase">
                            BIAYA <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Min Biaya"
                            type="number"
                            value={filterBiayaMin}
                            onChange={(e) =>
                              setFilterBiayaMin(
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                          />
                          <Input
                            placeholder="Max Biaya"
                            type="number"
                            value={filterBiayaMax}
                            onChange={(e) =>
                              setFilterBiayaMax(
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Diterima Oleh */}
                    <TableHead
                      className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      DITERIMA OLEH
                    </TableHead>
                    {/* Skema */}
                    {/* <TableHead
                      className="border border-gray-300 text-center min-w-[120px]"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      SKEMA
                    </TableHead> */}
                    {/* Tambahkan kolom Status */}
                    <TableHead
                      className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      STATUS
                    </TableHead>
                    {/* Aksi */}
                    <TableHead
                      className="px-3 py-1 border-b border-r border-gray-300 uppercase sticky top-0 z-10 bg-gray-100 text-center"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      AKSI
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center py-4 border border-gray-300">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : (
                    (() => {
                      // Group BTB by noBTB
                      const grouped: { [noBTB: string]: any[] } = {};
                      paginatedData.forEach((row) => {
                        const key = row.noBTB;
                        if (!grouped[key]) grouped[key] = [];
                        grouped[key].push(row);
                      });

                      return Object.entries(grouped).map(([noBTB, items]) => {
                        if (!items || items.length === 0) return null;
                        // Urutkan items ASC by id_btb_item (atau id_btbItem/id)
                        const sortedItems = [...items].sort((a, b) => {
                          const getId = (x) => x.id_btb_item ?? x.id_btbItem ?? x.id;
                          return getId(a) - getId(b);
                        });
                        return (
                          <React.Fragment key={noBTB}>
                            <TableRow className="hover:bg-gray-50 transition-colors border border-gray-300">
                              {/* Checkbox hanya di baris pertama */}
                              <TableCell rowSpan={items.length} className="px-3 py-1 border-r border-gray-300 text-center align-middle">
                                {exportMode === "selected" && (
                                  <Checkbox
                                    checked={selectedBTBIds.includes(items[0].id)}
                                    onCheckedChange={(checked) =>
                                      handleSelectBTB(items[0].id, checked as boolean)
                                    }
                                  />
                                )}
                              </TableCell>
                              {/* No. BTB - rowSpan */}
                              <TableCell rowSpan={items.length} className="px-3 py-1 border-r border-gray-300 text-center align-middle whitespace-nowrap font-medium uppercase">
                                {items[0].noBTB}
                              </TableCell>
                              {/* Tanggal BTB - rowSpan */}
                              <TableCell rowSpan={items.length} className="px-3 py-1 border-r border-gray-300 text-center align-middle whitespace-nowrap">
                                {formatTanggalLebihSehari(items[0].tanggal)}
                              </TableCell>
                              {/* Nama Supplier - rowSpan */}
                              <TableCell rowSpan={items.length} className="px-3 py-1 border-r border-gray-300 text-center align-middle whitespace-nowrap uppercase">
                                {items[0].nama_supplier || "-"}
                              </TableCell>
                              {/* Nama Barang - item pertama */}
                              <TableCell className="px-3 py-1 border-r border-gray-300 text-left whitespace-nowrap uppercase">
                                {sortedItems[0].nama_barang && sortedItems[0].nama_barang !== ""
                                  ? sortedItems[0].nama_barang
                                  : sortedItems[0].nama_supplier || "-"}
                              </TableCell>
                              {/* Quantity - item pertama */}
                              <TableCell className="px-3 py-1 border-r border-gray-300 text-left whitespace-nowrap">
                                {formatInt(sortedItems[0].jumlah)}
                              </TableCell>
                              {/* Satuan - item pertama */}
                              <TableCell className="px-3 py-1 border-r border-gray-300 text-left whitespace-nowrap uppercase">
                                {sortedItems[0].satuan}
                              </TableCell>
                              {/* Keterangan - item pertama */}
                              <TableCell className="px-3 py-1 border-r border-gray-300 text-left uppercase">
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
                              {/* Biaya - rowSpan */}
                              <TableCell rowSpan={items.length} className="px-3 py-1 border-r border-gray-300 text-center align-middle whitespace-nowrap">
                                {formatRupiah(items[0].biaya)}
                              </TableCell>
                              {/* Diterima Oleh - rowSpan */}
                              <TableCell rowSpan={items.length} className="px-3 py-1 border-r border-gray-300 text-center align-middle whitespace-nowrap uppercase">
                                {userMap[String(items[0].diterimaOleh)] ?? items[0].diterimaOleh}
                              </TableCell>
                              {/* Skema - rowSpan */}
                              {/* <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap uppercase">
                                {skemaMap[String(items[0].skema)] ?? items[0].skema}
                              </TableCell> */}
                              {/* Status - rowSpan */}
                              <TableCell rowSpan={items.length} className="px-3 py-1 border-r border-gray-300 text-center align-middle whitespace-nowrap uppercase">
                                {getBTBStatus(items)}
                              </TableCell>
                              {/* Aksi - rowSpan */}
                              <TableCell rowSpan={items.length} className="px-3 py-1 border-r border-gray-300 text-center align-middle">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(items[0].id_btb)}
                                  title="Hapus BTB"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                            {/* Baris item berikutnya */}
                            {sortedItems.slice(1).map((item, idx) => (
                              <TableRow key={`${noBTB}-item-${idx + 1}`} className="hover:bg-gray-50 transition-colors border border-gray-300">
                                {/* Kolom yang di-rowSpan tidak ditampilkan lagi */}
                                {/* Nama Barang - item berikutnya */}
                                <TableCell className="px-3 py-1 border-r border-gray-300 text-left whitespace-nowrap uppercase">
                                  {item.nama_barang && item.nama_barang !== ""
                                    ? item.nama_barang
                                    : item.nama_supplier || "-"}
                                </TableCell>
                                {/* Quantity - item berikutnya */}
                                <TableCell className="px-3 py-1 border-r border-gray-300 text-left whitespace-nowrap">
                                  {formatInt(item.jumlah)}
                                </TableCell>
                                {/* Satuan - item berikutnya */}
                                <TableCell className="px-3 py-1 border-r border-gray-300 text-left whitespace-nowrap uppercase">
                                  {item.satuan}
                                </TableCell>
                                {/* Keterangan - item berikutnya */}
                                <TableCell className="px-3 py-1 border-r border-gray-300 text-left uppercase">
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
                                {/* Jika ingin tampilkan tanggal di baris item, tambahkan di sini:
                      <TableCell className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap">
                        {formatTanggalLebihSehari(item.tanggal)}
                      </TableCell>
                      */}
                              </TableRow>
                            ))}
                          </React.Fragment>
                        );
                      });
                    })()
                  )}
                </TableBody>
              </Table>
              <style jsx>{`
              .sticky {
                position: sticky !important;
              }
              /* Optional: style scrollbar if needed */
              div[class*="sticky"]::-webkit-scrollbar {
                height: 12px;
              }
              div[class*="sticky"]::-webkit-scrollbar-thumb {
                background-color: #8b8b8b;
                border-radius: 6px;
              }
              div[class*="sticky"]::-webkit-scrollbar-track {
                background: #e5e7eb;
              }
            `}</style>
            </div>
          </CardContent>

        </Card>
        {/* Modal dan Toast */}
        <ConfirmModal
          open={confirmDeleteOpen}
          title="Konfirmasi Hapus BTB"
          description={`Apakah Anda yakin ingin menghapus ${deleteIds.length} BTB? Data yang dihapus tidak dapat dikembalikan.`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteOpen(false)}
        />
        <Toast
          open={toastOpen}
          message={toastMsg}
          onClose={() => setToastOpen(false)}
        />
        <RestoreItemModal
          open={restoreItemModalOpen}
          btbItems={selectedBTBItemsForRestore}
          selectedIds={selectedItemIdsToRestore}
          setSelectedIds={setSelectedItemIdsToRestore}
          onConfirm={confirmRestoreItems}
          onCancel={() => setRestoreItemModalOpen(false)}
        />
      </div>
    </MainLayout>
  );
}
