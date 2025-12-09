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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
function parseNoBTB(noBTB: string | null | undefined) {
  if (!noBTB || typeof noBTB !== "string") return null;
  const s = noBTB.trim().toUpperCase();

  // --- FORMAT 1: E-WALK ---
  // BTB/E-WALK/25/XI/001
  const regexEwalk = /^BTB\/E-?WALK\/(\d{2})\/([IVXLCDM]{1,4})\/(\d{1,5})$/;

  // --- FORMAT 2: PENTACITY ---
  // INV/BTB/25/XI/00001
  const regexPenta = /^INV\/BTB\/(\d{2})\/([IVXLCDM]{1,4})\/(\d{1,5})$/;

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
// 2. SORTING BTB TERBARU → TERLAMA
// ========================================
function sortBTBList(filteredBTBData: any[]) {
  const allValid = filteredBTBData.every(
    (x) => typeof x.noBTB === "string" && parseNoBTB(x.noBTB)
  );

  if (allValid) {
    return [...filteredBTBData].sort((a, b) => {
      const pa = parseNoBTB(a.noBTB)!;
      const pb = parseNoBTB(b.noBTB)!;

      if (pb.tahun !== pa.tahun) return pb.tahun - pa.tahun; // DESC
      if (pb.bulan !== pa.bulan) return pb.bulan - pa.bulan; // DESC
      return pb.urut - pa.urut; // DESC
    });
  }

  // fallback
  return [...filteredBTBData].sort((a, b) => Number(b.id) - Number(a.id));
}

export default function BTBMonitoringPage() {
  const [btbRows, setBtbRows] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter states
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
    const pageIds = filteredBTBData
      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      .map((row) => row.id);
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
      const matchesSearch =
        row.noBTB.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(row.supplier).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(row.barang ?? "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

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
        matchesBiayaMax
      );
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

    // Header sesuai urutan tabel monitoring BTB
    const headers = [
      "No. BTB",
      "Tanggal BTB",
      "Nama Supplier",
      "Nama Barang",
      "Quantity",
      "Satuan",
      "Sisa Stok",
      "Biaya",
      "Diterima Oleh",
      "Skema",
    ];

    // Add header row
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "left", vertical: "middle" };
    });

    // Helper format tanggal persis seperti frontend (formatTanggalLebihSehari)
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
    // Helper format quantity
    function formatQtyExcel(val: any) {
      const num = Number(val);
      if (Number.isNaN(num)) return "";
      return num % 1 === 0 ? num.toString() : num.toString();
    }
    // Helper format rupiah
    function formatRupiahExcel(val: any) {
      if (val === undefined || val === "" || isNaN(val)) return "";
      return "Rp " + Math.round(Number(val)).toLocaleString("id-ID"); // <-- pastikan integer
    }

    // Add data rows persis seperti tampilan tabel
    exportBTBData.forEach((btb) => {
      worksheet.addRow([
        btb.noBTB,
        formatTanggalLebihSehari(btb.tanggal), // <-- samakan dengan frontend
        btb.nama_supplier ?? btb.supplier ?? "",
        btb.nama_barang ?? "",
        formatQtyExcel(btb.jumlah),
        btb.satuan ?? "",
        formatQtyExcel(btb.sisa),
        formatRupiahExcel(btb.biaya),
        userMap[String(btb.diterimaOleh)] ?? btb.diterimaOleh ?? "",
        skemaMap[String(btb.skema)] ?? btb.skema ?? "",
      ]);
    });

    // Auto-fit columns based on max length of cell values
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
    a.download = `monitoring-btb-${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
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
            {btbItems.map(({ btbId, items }) => {
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
                                  setSelectedIds(selectedIds.filter((x) => x !== valueId));
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

  // --- Pagination ---
  const totalPages = Math.ceil(sortedBTBDataFinal.length / itemsPerPage);
  const paginatedData = sortedBTBDataFinal.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        {/* Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Daftar Bukti Terima Barang</CardTitle>
            <CardDescription>
              Total: {filteredBTBData.length} BTB Item
              {filteredBTBData.length > 0 && (
                <>
                  {" | "}
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredBTBData.length)}
                  {" dari "}
                  {filteredBTBData.length} BTB Item
                </>
              )}
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
  <div className="overflow-x-auto">
    <Table className="border border-gray-300">
      <TableHeader>
        <TableRow className="border border-gray-300">
          {/* Checkbox header untuk export terpilih */}
          <TableHead className="border border-gray-300 text-center">
            {exportMode === "selected" && (
              <Checkbox
                checked={(() => {
                  const grouped: { [noBTB: string]: any[] } = {};
                  filteredBTBData
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .forEach((row) => {
                      const key = row.noBTB;
                      if (!grouped[key]) grouped[key] = [];
                      grouped[key].push(row);
                    });
                  const pageIds = Object.values(grouped).map((items) => items[0].id);
                  return pageIds.every((id) => selectedBTBIds.includes(id));
                })()}
                onCheckedChange={(checked) => {
                  const grouped: { [noBTB: string]: any[] } = {};
                  filteredBTBData
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .forEach((row) => {
                      const key = row.noBTB;
                      if (!grouped[key]) grouped[key] = [];
                      grouped[key].push(row);
                    });
                  const pageIds = Object.values(grouped).map((items) => items[0].id);
                  if (checked) {
                    setSelectedBTBIds((prev) => Array.from(new Set([...prev, ...pageIds])));
                  } else {
                    setSelectedBTBIds((prev) => prev.filter((id) => !pageIds.includes(id)));
                  }
                }}
              />
            )}
          </TableHead>
          {/* No. BTB */}
          <TableHead className="border border-gray-300 text-center min-w-[140px]">
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1">
                  No. BTB <ChevronDown className="w-4 h-4" />
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
          <TableHead className="border border-gray-300 text-center min-w-[120px]">
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1">
                  Tanggal BTB <ChevronDown className="w-4 h-4" />
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
          <TableHead className="border border-gray-300 text-center min-w-[160px]">
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1">
                  Nama Supplier <ChevronDown className="w-4 h-4" />
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
          <TableHead className="border border-gray-300 text-center min-w-[160px]">
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1">
                  Nama Barang <ChevronDown className="w-4 h-4" />
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
          <TableHead className="border border-gray-300 text-center min-w-[90px]">
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1">
                  Quantity Awal BTB <ChevronDown className="w-4 h-4" />
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
          {/* Tambahkan kolom Quantity Sisa BTB */}
          <TableHead className="border border-gray-300 text-center min-w-[90px]">
            Quantity Sisa BTB
          </TableHead>
          {/* Satuan */}
          <TableHead className="border border-gray-300 text-center min-w-[90px]">
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1">
                  Satuan <ChevronDown className="w-4 h-4" />
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
          <TableHead className="border border-gray-300 text-center min-w-[120px]">Keterangan</TableHead>
          {/* Biaya */}
          <TableHead className="border border-gray-300 text-center min-w-[120px]">
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center gap-1">
                  Biaya <ChevronDown className="w-4 h-4" />
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
          <TableHead className="border border-gray-300 text-center min-w-[120px]">
            Diterima Oleh
          </TableHead>
          {/* Skema */}
          <TableHead className="border border-gray-300 text-center min-w-[120px]">
            Skema
          </TableHead>
          {/* Tambahkan kolom Status */}
          <TableHead className="border border-gray-300 text-center min-w-[90px]">
            Status
          </TableHead>
          {/* Aksi */}
          <TableHead className="border border-gray-300 text-center min-w-[80px]">
            Aksi
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
              return (
                <React.Fragment key={noBTB}>
                  <TableRow className="hover:bg-gray-50 transition-colors border border-gray-300">
                    {/* Checkbox hanya di baris pertama */}
                    <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle">
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
                    <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap font-medium">
                      {items[0].noBTB}
                    </TableCell>
                    {/* Tanggal BTB - rowSpan */}
                    <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap">
                      {items[0].tanggal}
                    </TableCell>
                    {/* Nama Supplier - rowSpan */}
                    <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap">
                      {items[0].nama_supplier || "-"}
                    </TableCell>
                    {/* Nama Barang - item pertama */}
                    <TableCell className="border border-gray-300 px-4 py-3 text-center whitespace-nowrap">
                      {items[0].nama_barang && items[0].nama_barang !== ""
                        ? items[0].nama_barang
                        : items[0].nama_supplier || "-"}
                    </TableCell>
                    {/* Quantity - item pertama */}
                    <TableCell className="border border-gray-300 px-4 py-3 text-center whitespace-nowrap">
                      {formatInt(items[0].jumlah)}
                    </TableCell>
                    {/* Quantity Sisa BTB - item pertama */}
                    <TableCell className="border border-gray-300 px-4 py-3 text-center whitespace-nowrap">
                      {formatInt(items[0].sisa)}
                    </TableCell>
                    {/* Satuan - item pertama */}
                    <TableCell className="border border-gray-300 px-4 py-3 text-center whitespace-nowrap">
                      {items[0].satuan}
                    </TableCell>
                    {/* Keterangan - item pertama */}
                    <TableCell className="border border-gray-300 px-4 py-3 text-center">
                      {items[0].keterangan ? (
                        <span
                          title={items[0].keterangan}
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
                          {items[0].keterangan.length > 15
                            ? items[0].keterangan.slice(0, 15) + "..."
                            : items[0].keterangan}
                        </span>
                      ) : "-"}
                    </TableCell>
                    {/* Biaya - rowSpan */}
                    <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap">
                      {formatRupiah(items[0].biaya)}
                    </TableCell>
                    {/* Diterima Oleh - rowSpan */}
                    <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap">
                      {userMap[String(items[0].diterimaOleh)] ?? items[0].diterimaOleh}
                    </TableCell>
                    {/* Skema - rowSpan */}
                    <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap">
                      {skemaMap[String(items[0].skema)] ?? items[0].skema}
                    </TableCell>
                    {/* Status - rowSpan */}
                    <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap">
                      {getBTBStatus(items)}
                    </TableCell>
                    {/* Aksi - rowSpan */}
                    <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle">
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
                  {items.slice(1).map((item, idx) => (
                    <TableRow key={`${noBTB}-item-${idx + 1}`} className="hover:bg-gray-50 transition-colors border border-gray-300">
                      {/* Kolom yang di-rowSpan tidak ditampilkan lagi */}
                      {/* Nama Barang - item berikutnya */}
                      <TableCell className="border border-gray-300 px-4 py-3 text-center whitespace-nowrap">
                        {item.nama_barang && item.nama_barang !== ""
                          ? item.nama_barang
                          : item.nama_supplier || "-"}
                      </TableCell>
                      {/* Quantity - item berikutnya */}
                      <TableCell className="border border-gray-300 px-4 py-3 text-center whitespace-nowrap">
                        {formatInt(item.jumlah)}
                      </TableCell>
                      {/* Quantity Sisa BTB - item berikutnya */}
                      <TableCell className="border border-gray-300 px-4 py-3 text-center whitespace-nowrap">
                        {formatInt(item.sisa)}
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
                { length: Math.ceil(filteredBTBData.length / itemsPerPage) },
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
                        Math.ceil(filteredBTBData.length / itemsPerPage),
                        currentPage + 1
                      )
                    )
                  }
                  className={
                    currentPage ===
                    Math.ceil(filteredBTBData.length / itemsPerPage)
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
