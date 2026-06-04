"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import DatePicker from "react-datepicker";
import { toast } from "sonner"; // Import from sonner
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

import { ChevronDown, Calendar as CalendarIcon, FileSpreadsheet, Download } from "lucide-react";
import { Pencil } from "lucide-react"; // untuk ikon edit

import { Label } from "@/components/ui/label";
// halo disini saya cooba coba
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ExcelJS from "exceljs";

// Tambahkan helper untuk popover keterangan
import { API_BASE_URL } from "@/lib/config";
import {
  Popover as HoverPopover,
  PopoverTrigger as HoverPopoverTrigger,
  PopoverContent as HoverPopoverContent,
} from "@/components/ui/popover";

// Kolom sesuai urutan permintaan (Periode, No. PR, dst)
// Kembalikan urutan kolom seperti sebelumnya, delay tetap kosong dan di posisi aslinya (setelah status)
const columns = [

  { key: "noPR", label: "NO. PR" },
  { key: "tanggalPR", label: "TANGGAL PR" },
  { key: "hariPR", label: "HARI" },
  { key: "daftarBarangPR", label: "DAFTAR BARANG" },
  { key: "quantityAwalPR", label: "QUANTITY PR" },
  { key: "satuanPR", label: "SATUAN" },
  { key: "noMR", label: "NO. MR" },
  { key: "keteranganPR", label: "KETERANGAN" },
  { key: "divisi", label: "DIVISI" },
  { key: "dibuatOleh", label: "DIBUAT OLEH" },
  { key: "targetTanggalPO", label: "TARGET TANGGAL PO" },
  { key: "status", label: "STATUS" },
  { key: "skemaPR", label: "SKEMA PR" },
  { key: "noPO", label: "NO. PO" },
  { key: "tanggalPO", label: "TANGGAL PO" },
  { key: "supplier", label: "NAMA SUPPLIER" },
  { key: "quantityAwalPO", label: "QUANTITY PO" },
  { key: "satuanPO", label: "SATUAN" },
  { key: "hargaSatuanPO", label: "HARGA SATUAN" },
  { key: "diskonPersen", label: "DISKON (%)" },
  { key: "diskonRp", label: "DISKON (RP)" },
  { key: "ppnPersen", label: "PPN (%)" },
  { key: "ppnRp", label: "PPN (RP)" },
  { key: "totalHarga", label: "TOTAL HARGA" },
  { key: "statusPengiriman", label: "STATUS PENGIRIMAN" },
  { key: "tanggalEstimasiDiterima", label: "ESTIMASI DITERIMA" },
  { key: "diinputOleh", label: "DIORDER OLEH" },
  { key: "diorderOleh", label: "DIBUAT OLEH" },
  { key: "terminPembayaran", label: "TERMIN PEMBAYARAN" },
  { key: "targetPencapaianPO", label: "TARGET PENCAPAIAN PO" },
  { key: "delay", label: "STATUS" },
  { key: "quantityPO", label: "QUANTITY BELUM PO" },
  { key: "skemaPO", label: "SKEMA PO" },
  { key: "noBTB", label: "NO. BTB" },
  { key: "tanggalBTB", label: "TANGGAL TERIMA" },
  { key: "quantityBTB", label: "QUANTITY BTB" },
  { key: "satuanBTB", label: "SATUAN BTB" },
  { key: "biayaBTB", label: "BIAYA BTB" },
  { key: "sisaStokBTB", label: "QUANTITY BELUM BTB" },
  { key: "diterimaOleh", label: "DITERIMA OLEH" },// baru
  { key: "plan", label: "PLAN / NO PLAN" },
  { key: "statusPR_closed", label: "STATUS PR" },
  { key: "skemaBTB", label: "SKEMA BTB" },
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
  return "Rp. " + Number(val).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ===== New helpers: parse percent and compute per-item total =====
function parsePercentVal(val: any) {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "string") {
    return Number(val.replace("%", "").trim()) || 0;
  }
  return Number(val) || 0;
}

function computeItemTotal(po: any, poItem: any) {
  const price = Number(poItem?.hargaSatuan ?? 0);
  const qty = Number(poItem?.jumlahPO ?? poItem?.jumlah_po ?? poItem?.jumlah ?? 0);
  const base = price * qty;
  const diskonPercent = parsePercentVal(poItem?.diskonPersen);
  const diskonRp = Number(poItem?.diskonRp ?? po?.originalDiskon ?? 0);
  const ppnPercent = parsePercentVal(poItem?.ppnPersen);

  let total = base;
  // apply percent discount
  total = total - (base * diskonPercent) / 100;
  // apply flat discount
  total = total - diskonRp;
  // apply ppn on post-discount amount
  total = total + (total * ppnPercent) / 100;

  return Number.isFinite(total) ? total : total;
}
// ===== end new helpers =====

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

  // Set jam ke 00:00:00 untuk perbandingan akurat
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (start.getTime() === end.getTime()) return 0;

  const isWarning = start > end;
  if (isWarning) {
    // Swap untuk hitung selisih positif, nanti dikali -1
    const temp = start;
    start = end;
    end = temp;
  }

  let count = 0;
  // Loop dari start sampai end (exclusive end untuk diff? User minta -1 jika beda 1 hari)
  // Logic standard: diff 08 ke 09 adalah 1 hari.
  // Loop while (start < end) akan menghitung benar.

  while (start < end) {
    start.setDate(start.getDate() + 1);
    const day = start.getDay();
    const dateStr = start.toISOString().slice(0, 10);
    if (day !== 0 && day !== 6 && !HOLIDAYS.includes(dateStr)) {
      count++;
    }
  }
  return isWarning ? -count : count;
}

// Fungsi menghitung selisih hari kalender (termasuk sabtu/minggu)
function countCalendarDaysBetween(startDateStr: string, endDateStr: string) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  // Set jam ke 00:00:00 untuk perbandingan akurat
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24)); // Gunakan round untuk aman
}



// Helper format tanggal dd-mm-yyyy +1 hari (fix: handle dd-mm-yyyy and yyyy-mm-dd)
function computeTargetPOStatus(targetTanggalPO: string, tanggalPO: string) {
  if (!targetTanggalPO) return "WAITING PROGRESS PO"; // If no target exists but we need to show status
  if (!tanggalPO) return "WAITING PROGRESS PO"; // No PO yet

  // Parse Target PO Date
  let targetDateObj: Date | null = null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(targetTanggalPO)) {
    const [d, m, y] = targetTanggalPO.split("/");
    targetDateObj = new Date(`${y}-${m}-${d}`);
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(targetTanggalPO)) {
    const [d, m, y] = targetTanggalPO.split("-");
    targetDateObj = new Date(`${y}-${m}-${d}`);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(targetTanggalPO)) {
    targetDateObj = new Date(targetTanggalPO);
  }

  // Parse actual PO Date
  let poDateObj: Date | null = null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(tanggalPO)) {
    const [d, m, y] = tanggalPO.split("/");
    poDateObj = new Date(`${y}-${m}-${d}`);
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(tanggalPO)) {
    const [d, m, y] = tanggalPO.split("-");
    poDateObj = new Date(`${y}-${m}-${d}`);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(tanggalPO)) {
    poDateObj = new Date(tanggalPO);
  }

  if (!targetDateObj || isNaN(targetDateObj.getTime())) return "WAITING PROGRESS PO";
  if (!poDateObj || isNaN(poDateObj.getTime())) return "WAITING PROGRESS PO";

  // Compare strictly on Date level by setting hours to 0
  targetDateObj.setHours(0, 0, 0, 0);
  poDateObj.setHours(0, 0, 0, 0);

  if (poDateObj <= targetDateObj) {
    return "TERCAPAI";
  } else {
    return "TIDAK TERCAPAI";
  }
}

function formatTanggalTambahSehari(tgl: string) {
  if (!tgl) return "";
  // Jika sudah dd/mm/yyyy, ubah ke Date dulu
  let dateObj;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(tgl)) {
    const [d, m, y] = tgl.split("/");
    dateObj = new Date(`${y}-${m}-${d}`);
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(tgl)) {
    const [d, m, y] = tgl.split("-");
    dateObj = new Date(`${y}-${m}-${d}`);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
    dateObj = new Date(tgl);
  } else {
    return tgl;
  }
  if (isNaN(dateObj.getTime())) return tgl;
  dateObj.setDate(dateObj.getDate() + 1);
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}

// Helper format tanggal dd-mm-yyyy +2 hari (fix: handle dd-mm-yyyy and yyyy-mm-dd)
function formatTanggalTambahDuaHari(tgl: string) {
  if (!tgl) return "";
  let dateObj;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(tgl)) {
    const [d, m, y] = tgl.split("/");
    dateObj = new Date(`${y}-${m}-${d}`);
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(tgl)) {
    const [d, m, y] = tgl.split("-");
    dateObj = new Date(`${y}-${m}-${d}`);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
    dateObj = new Date(tgl);
  } else {
    return tgl;
  }
  if (isNaN(dateObj.getTime())) return tgl;
  dateObj.setDate(dateObj.getDate() + 2);
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}
// Helper untuk mendapatkan nama bulan yang benar (menambahkan 1)
function getMonthNameCorrected(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const monthIndex = date.getMonth(); // JavaScript's month index starts at 0 (Jan = 0)
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return months[monthIndex]; // Fix month index off by 1
}

function formatDateSimple(dateStr: string) {
  if (!dateStr) return "";
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return dateStr.replace(/-/g, "/");
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

// Helper untuk popover keterangan (hover, abu-abu, di luar tabel)
function KeteranganPopover({ text, max = 20 }: { text: string; max?: number }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  if (!text) return "";
  if (text.length <= max) return text;

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPos({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 4,
    });
    setShow(true);
  };
  const handleMouseLeave = () => setShow(false);

  return (
    <>
      <span
        ref={ref}
        className="cursor-pointer"
        style={{
          whiteSpace: "nowrap",
          textDecoration: "underline dotted",
          color: "#6b7280",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {text.slice(0, max) + "..."}{" "}
      </span>
      {show &&
        typeof window !== "undefined" &&
        ReactDOM.createPortal(
          <div
            className="z-[9999] bg-gray-100 text-gray-700 border border-gray-300 rounded px-3 py-2 shadow-lg max-w-xs text-sm"
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              minWidth: 200,
              whiteSpace: "pre-line",
              pointerEvents: "none",
            }}
          >
            {text}
          </div>,
          document.body
        )}
    </>
  );
}

export default function RekapFullPage() {
  const [rekapData, setRekapData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  // Hilangkan pagination: tampilkan semua data sesuai rentang tanggal
  const [filters, setFilters] = useState<{ [key: string]: any }>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportMode, setExportMode] = useState<"all" | "selected" | "range">(
    "all"
  );
  // Ganti state exportStartDate/exportEndDate ke Date | null agar cocok dengan DatePicker
  const [exportStartDate, setExportStartDate] = useState<Date | null>(null);
  const [exportEndDate, setExportEndDate] = useState<Date | null>(null);




  // Set default rentang tanggal ke awal & akhir bulan saat halaman diakses
  useEffect(() => {
    if (exportStartDate === null && exportEndDate === null) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setExportStartDate(firstDay);
      setExportEndDate(lastDay);
    }
  }, [exportStartDate, exportEndDate]);

  // Check current user role
  const [currentUserRole, setCurrentUserRole] = useState<number | null>(null); // Changed to number | null
  const [currentUserId, setCurrentUserId] = useState<number | null>(null); // Add User ID state

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("userData");
      if (saved) {
        try {
          const p = JSON.parse(saved);
          setCurrentUserRole(Number(p.id_peran || p.role)); // Ensure it's a number
          setCurrentUserId(Number(p.id)); // Set User ID
        } catch {
          console.error("Error parsing userData from localStorage");
        }
      }
    }
  }, []);

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

  useEffect(() => {
    async function fetchData() {
      try {
        const [
          prRes,
          prItemRes,
          poRes,
          poItemRes,
          btbRes,
          btbItemRes,
          bkbRes,
          bkbItemRes,
          supplierRes,
          userRes,
          skemaRes,
          statusPengirimanRes,
          statusPermintaanRes,
          satuanRes,
          divisiRes,
        ] = await Promise.all([
          fetch(API_BASE_URL + "/api/pr", { cache: "no-store" }).then((r) => r.json()),
          fetch(API_BASE_URL + "/api/pr-item", { cache: "no-store" }).then((r) => r.json()),
          fetch(API_BASE_URL + "/api/po", { cache: "no-store" }).then((r) => r.json()),
          fetch(API_BASE_URL + "/api/po-item", { cache: "no-store" }).then((r) => r.json()),
          fetch(API_BASE_URL + "/api/btb", { cache: "no-store" }).then((r) => r.json()),
          fetch(API_BASE_URL + "/api/btb-item", { cache: "no-store" }).then((r) => r.json()),
          fetch(API_BASE_URL + "/api/bkb", { cache: "no-store" }).then((r) => r.json()),
          fetch(API_BASE_URL + "/api/bkb-item", { cache: "no-store" }).then((r) => r.json()),
          fetch(API_BASE_URL + "/api/supplier", { cache: "no-store" }).then((r) => r.json()),
          fetch(API_BASE_URL + "/api/user", { cache: "no-store" }).then((r) => r.json()),
          fetch(API_BASE_URL + "/api/skema", { cache: "no-store" }).then((r) => r.json()),
          fetch(API_BASE_URL + "/api/status-pengiriman", { cache: "no-store" }).then((r) => r.json()),
          fetch(API_BASE_URL + "/api/status-permintaan", { cache: "no-store" }).then((r) => r.json()),
          fetch(API_BASE_URL + "/api/satuan", { cache: "no-store" }).then((r) => r.json()),
          fetch(API_BASE_URL + "/api/divisi", { cache: "no-store" }).then((r) => r.json()),
        ]);

        // --- Build maps locally to ensure availability ---
        const localSupplierMap = Object.fromEntries(
          (Array.isArray(supplierRes) ? supplierRes : []).map((s: any) => [String(s.id_supplier), s.namaSupplier])
        );
        const localUserMap = Object.fromEntries(
          (Array.isArray(userRes) ? userRes : []).map((u: any) => [String(u.id_user), u.nama_pengguna])
        );
        const localSkemaMap = Object.fromEntries(
          (Array.isArray(skemaRes) ? skemaRes : []).map((s: any) => [String(s.id_skema), s.skema])
        );
        const localStatusPengirimanMap = Object.fromEntries(
          (Array.isArray(statusPengirimanRes) ? statusPengirimanRes : []).map((sp: any) => [String(sp.id_statusPengiriman), sp.status_pengiriman])
        );
        const localStatusPermintaanMap = Object.fromEntries(
          (Array.isArray(statusPermintaanRes) ? statusPermintaanRes : []).map((sp: any) => [String(sp.id_statusPermintaan), sp.status_permintaan])
        );
        const localSatuanMap = Object.fromEntries(
          (Array.isArray(satuanRes) ? satuanRes : []).map((s: any) => [String(s.id_satuan), s.satuan])
        );
        const localDivisiMap = Object.fromEntries(
          (Array.isArray(divisiRes) ? divisiRes : []).map((d: any) => [String(d.id_divisi), d.divisi || d.nama_divisi])
        );

        // Update state maps as well for outside usage if needed
        setSupplierMap(localSupplierMap);
        setUserMap(localUserMap);
        setSkemaMap(localSkemaMap);
        setStatusPengirimanMap(localStatusPengirimanMap);
        setStatusPermintaanMap(localStatusPermintaanMap);
        setSatuanMap(localSatuanMap);
        setDivisiMap(localDivisiMap);

        // Ensure data is in the correct array format
        const prData = Array.isArray(prRes) ? prRes : [];
        const prItemData = Array.isArray(prItemRes) ? prItemRes : [];
        const poData = Array.isArray(poRes) ? poRes : [];
        const poItemData = Array.isArray(poItemRes) ? poItemRes : [];
        const btbData = Array.isArray(btbRes) ? btbRes : [];
        const btbItemData = Array.isArray(btbItemRes) ? btbItemRes : [];
        const bkbData = Array.isArray(bkbRes) ? bkbRes : [];
        const bkbItemData = Array.isArray(bkbItemRes) ? bkbItemRes : [];

        const rekapRows: any[] = [];

        prData.forEach((pr: any) => {
          const items = prItemData.filter((item: any) => item.id_PR === pr.id_PR);

          items.forEach((item: any, idx: number) => {
            // Cari PO Item yang terkait PR Item ini
            const poItems = poItemData.filter((poi: any) => String(poi.id_PRItem) === String(item.id_PRItem));
            if (poItems.length === 0) {
              // Jika tidak ada PO, tetap tampilkan baris PR-PRItem saja
              rekapRows.push({
                id: pr.id_PR + "-" + idx,
                id_PR: pr.id_PR,
                periodePR: pr.tanggalPR ? `${getMonthName(pr.tanggalPR)} ${getYear(pr.tanggalPR)}` : "",
                tahunPR: getYear(pr.tanggalPR),
                bulanPR: getMonthName(pr.tanggalPR),
                noPR: pr.noPR,
                tanggalPR: pr.tanggalPR
                  ? (() => {
                    const d = new Date(pr.tanggalPR);
                    return `${d.getDate().toString().padStart(2, "0")}-${(
                      d.getMonth() + 1
                    ).toString().padStart(2, "0")}-${d.getFullYear()}`;
                  })()
                  : "",
                hariPR: getDayName(pr.tanggalPR),
                // New Fields
                id_PRItem: item.id_PRItem,
                kodeBarangPR: item.kodeBarang || "",
                spesifikasi: item.spesifikasi || "",
                noMR: pr.noMR || pr.no_mr || item.noMR || "",

                daftarBarangPR: item.namaBarang,
                quantityAwalPR: item.quantityAwalPR ?? item.jumlah ?? "",
                quantityPO: item.jumlah ?? "",
                satuanPR: item.id_satuan
                  ? localSatuanMap[String(item.id_satuan)] || item.id_satuan
                  : "",
                keteranganPR: item.keterangan || "",
                divisi: pr.id_divisi
                  ? localDivisiMap[String(pr.id_divisi)] || pr.id_divisi
                  : "",
                dibuatOleh: pr.dibuatOleh,
                skemaPR: pr.id_skema ?? "",
                skemaPRLabel: pr.id_skema
                  ? localSkemaMap[String(pr.id_skema)] || pr.id_skema
                  : "",
                targetTanggalPO: formatDateSimple(pr.estimasipo),
                delay: "",
                status: computeTargetPOStatus(formatDateSimple(pr.estimasipo), ""),
                noPO: "",
                tanggalPO: "",
                periodePO: "",
                supplier: "",
                quantityAwalPO: "",
                satuanPO: "",
                hargaSatuanPO: "",
                diskonPersen: "",
                diskonRp: "",
                ppnPersen: "",
                ppnRp: "",
                totalHarga: "",
                tanggalEstimasiDiterima: "",
                statusPengiriman: "",
                diorderOleh: "",
                diinputOleh: "",
                terminPembayaran: "",
                skemaPO: "",
                noBTB: "",
                tanggalBTB: "",
                periodeBTB: "",
                namaSupplierBTB: "",
                namaBarangBTB: "",
                quantityBTB: "",
                satuanBTB: "",
                sisaStokBTB: "",
                statusPermintaanByPR: "",
                statusPR_closed: computeStatusPRClosed(item, null),
                    plan: pr.plan || "",
                noPlan: "",
                biayaBTB: "",
                diterimaOleh: "",
                skemaBTB: "",
                targetPencapaianPO: "",

                // BKB Fields Empty
                noBKB: "",
                tanggalBKB: "",
                kodeBarangBKB: "",
                namaBarangBKB: "",
                quantityBKBData: "", // Renamed to avoid collision with quantityBTB? No, explicit name
                satuanBKB: "",
                divisiBKB: "",
              });
            } else {
              // Untuk setiap PO Item yang terkait, cari PO dan BTB
              poItems.forEach((poItem: any) => {
                const po = poData.find((p: any) => String(p.id_PO) === String(poItem.id_PO));
                // Untuk setiap BTB Item yang terkait, cari BTB
                // REFACTOR: Aggregate BTB Items to prevent PO Data duplication
                const btbItems = btbItemData.filter((bi: any) => String(bi.id_POItem) === String(poItem.id_POItem));

                if (btbItems.length === 0) {
                  // Jika tidak ada BTB, tetap tampilkan baris PR-PRItem-POItem
                  rekapRows.push({
                    id: pr.id_PR + "-" + idx + "-" + (poItem.id_POItem || ""),
                    id_PR: pr.id_PR,
                    periodePR: pr.tanggalPR ? `${getMonthName(pr.tanggalPR)} ${getYear(pr.tanggalPR)}` : "",
                    tahunPR: getYear(pr.tanggalPR),
                    bulanPR: getMonthName(pr.tanggalPR),
                    noPR: pr.noPR,
                    tanggalPR: pr.tanggalPR
                      ? (() => {
                        const d = new Date(pr.tanggalPR);
                        return `${d.getDate().toString().padStart(2, "0")}-${(
                          d.getMonth() + 1
                        ).toString().padStart(2, "0")}-${d.getFullYear()}`;
                      })()
                      : "",
                    hariPR: getDayName(pr.tanggalPR),
                    // New Fields
                    id_PRItem: item.id_PRItem,
                    kodeBarangPR: item.kodeBarang || "",
                    spesifikasi: item.spesifikasi || "",
                    noMR: pr.noMR || pr.no_mr || item.noMR || "",

                    daftarBarangPR: item.namaBarang,
                    quantityAwalPR: item.quantityAwalPR ?? item.jumlah ?? "",
                    quantityPR: item.jumlah ?? "",
                    satuanPR: item.id_satuan
                      ? localSatuanMap[String(item.id_satuan)] || item.id_satuan
                      : "",
                    keteranganPR: item.keterangan || "",
                    divisi: pr.id_divisi
                      ? localDivisiMap[String(pr.id_divisi)] || pr.id_divisi
                      : "",
                    dibuatOleh: pr.dibuatOleh,
                    skemaPR: pr.id_skema ?? "",
                    skemaPRLabel: pr.id_skema
                      ? localSkemaMap[String(pr.id_skema)] || pr.id_skema
                      : "",
                    targetTanggalPO: formatDateSimple(pr.estimasipo),
                    delay: "",
                    status: poItem?.status_po || computeTargetPOStatus(
                      formatDateSimple(pr.estimasipo),
                      po?.tanggalPO ? (() => {
                        const d = new Date(po.tanggalPO);
                        return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getFullYear()}`;
                      })() : ""
                    ),
                    id_POItem: poItem?.id_POItem || "",
                    noPO: po?.noPO || "",
                    tanggalPO: po?.tanggalPO
                      ? (() => {
                        const d = new Date(po.tanggalPO);
                        return `${d.getDate().toString().padStart(2, "0")}-${(
                          d.getMonth() + 1
                        ).toString().padStart(2, "0")}-${d.getFullYear()}`;
                      })()
                      : "",
                    periodePO: po?.tanggalPO
                      ? (() => {
                        let d;
                        if (/^\d{2}-\d{2}-\d{4}$/.test(po.tanggalPO)) {
                          const [day, month, year] = po.tanggalPO.split("-");
                          d = new Date(`${year}-${month}-${day}`);
                        } else {
                          d = new Date(po.tanggalPO);
                        }
                        if (isNaN(d.getTime())) return "";
                        return `${d.toLocaleString("id-ID", { month: "long" })} ${d.getFullYear()}`;
                      })()
                      : "",
                    supplier: po?.id_supplier
                      ? localSupplierMap[String(po.id_supplier)] || ""
                      : "",
                    quantityAwalPO: poItem?.jumlahAsli || poItem?.jumlahPO || poItem?.jumlah_po || "",
                    quantityPO: item?.jumlah ?? "",
                    satuanPO:
                      item.id_satuan
                        ? localSatuanMap[String(item.id_satuan)] || item.id_satuan
                        : "",
                    hargaSatuanPO: poItem?.hargaSatuan ?? "",
                    diskonPersen: poItem?.diskonPersen !== undefined && poItem?.diskonPersen !== null
                      ? (typeof poItem.diskonPersen === "string" && poItem.diskonPersen.includes("+")
                        ? poItem.diskonPersen
                        : (Number(poItem.diskonPersen) % 1 === 0
                          ? Number(poItem.diskonPersen).toString()
                          : Number(poItem.diskonPersen).toFixed(2)
                        ) + "%"
                      )
                      : "",
                    diskonRp: poItem?.diskonRupiah ?? "",
                    ppnPersen: poItem?.ppnPersen !== undefined && poItem?.ppnPersen !== null
                      ? (Number(poItem.ppnPersen) % 1 === 0
                        ? Number(poItem.ppnPersen).toString()
                        : Number(poItem.ppnPersen).toFixed(2)
                      ) + "%"
                      : "",
                    ppnRp: po?.ppnAmount ?? "",
                    totalHarga: poItem?.totalPerItem ?? computeItemTotal(po, poItem),
                    tanggalEstimasiDiterima: po?.estimasiTanggalTerima
                      ? (() => {
                        const d = new Date(po.estimasiTanggalTerima);
                        return `${d.getDate().toString().padStart(2, "0")}-${(
                          d.getMonth() + 1
                        ).toString().padStart(2, "0")}-${d.getFullYear()}`;
                      })()
                      : "",
                    statusPengiriman: po?.id_statusPengiriman
                      ? localStatusPengirimanMap[String(po.id_statusPengiriman)] || ""
                      : "",
                    diorderOleh: po?.orderedBy
                      ? localUserMap[String(po.orderedBy)] || po.orderedBy
                      : "",
                    diinputOleh: poItem?.namaPembeli ?? "",
                    terminPembayaran: po?.termin || po?.id_termin || "",
                    skemaPO: po?.id_skema ? localSkemaMap[String(po.id_skema)] || "" : "",
                    noBTB: "",
                    tanggalBTB: "",
                    periodeBTB: "",
                    namaSupplierBTB: "",
                    namaBarangBTB: "",
                    quantityBTB: "",
                    satuanBTB: "",
                    sisaStokBTB: poItem?.jumlahPO || "",
                    statusPermintaanByPR: "",
                    statusPR_closed: computeStatusPRClosed(item, typeof poItem !== "undefined" ? poItem : null),
                    plan: pr.plan || "",
                    noPlan: "",
                    biayaBTB: "",
                    diterimaOleh: "",
                    skemaBTB: "",
                    targetPencapaianPO: "WAITING PART",
                    id_btb_item: "",

                    // BKB Fields Empty
                    noBKB: "",
                    tanggalBKB: "",
                    kodeBarangBKB: "",
                    namaBarangBKB: "",
                    quantityBKBData: "",
                    satuanBKB: "",
                    divisiBKB: "",
                  });
                } else {
                  // --- ROW PER BTB WITH REDUCED PO DATA START ---
                  // Revert to looping BTB items, but blank out PO data for subsequent rows to avoid "double counting"

                  let runningBalance = Number(poItem?.jumlahAsli || poItem?.jumlahPO || poItem?.jumlah_po || 0);

                  btbItems.forEach((btbItem: any, btbIdx: number) => {
                    const btb = btbData.find((b: any) => String(b.id_btb) === String(btbItem.id_btb));
                    
                    // Subtract current BTB quantity from running balance
                    runningBalance -= Number(btbItem?.jumlah_diterima || 0);

                    // Determine if we should show PO data (only for the first BTB row of this PO Item)
                    const showPOData = (btbIdx === 0);

                    // --- BKB INTEGRATION START ---
                    const relatedBkbItems = bkbItemData.filter((bkb: any) => String(bkb.id_btb_item) === String(btbItem.id_btb_item));

                    // Common logic to push a row
                    const pushRow = (bkbItem: any | null, bkbIdx: number = 0) => {
                      const parentBkb = bkbItem ? bkbData.find((b: any) => String(b.id_bkb) === String(bkbItem.id_bkb)) : null;

                      // Visual Deduplication Logic
                      // PR: Always show (Duplicate for all child rows, as requested/observed)
                      const showPR = true;

                      // PO: Show only on 1st BTB and 1st BKB of that BTB (The distinct "Header" of the group)
                      const showPO = (btbIdx === 0 && bkbIdx === 0);

                      // BTB: Show only on 1st BKB of that BTB
                      const showBTB = (bkbIdx === 0);

                      rekapRows.push({
                        id: pr.id_PR + "-" + idx + "-" + (poItem.id_POItem || "") + "-" + (btbItem.id_btb || "") + "-" + (bkbItem?.id_bkb_item || "0"),
                        id_PR: pr.id_PR,
                        periodePR: showPR && pr.tanggalPR ? `${getMonthName(pr.tanggalPR)} ${getYear(pr.tanggalPR)}` : "",
                        tahunPR: showPR ? getYear(pr.tanggalPR) : "",
                        bulanPR: showPR ? getMonthName(pr.tanggalPR) : "",
                        noPR: showPR ? pr.noPR : "",
                        tanggalPR: pr.tanggalPR
                          ? (() => {
                            const d = new Date(pr.tanggalPR);
                            return `${d.getDate().toString().padStart(2, "0")}-${(
                              d.getMonth() + 1
                            ).toString().padStart(2, "0")}-${d.getFullYear()}`;
                          })()
                          : "",
                        hariPR: getDayName(pr.tanggalPR),
                        id_PRItem: item.id_PRItem || "",
                        kodeBarangPR: item.kodeBarang || "",
                        spesifikasi: item.spesifikasi || "",
                        noMR: pr.noMR || pr.no_mr || item.noMR || "",
                        daftarBarangPR: item.namaBarang,
                        quantityAwalPR: item.quantityAwalPR ?? item.jumlah ?? "",
                        quantityPR: item.jumlah ?? "",
                        satuanPR: item.id_satuan
                          ? localSatuanMap[String(item.id_satuan)] || item.id_satuan
                          : "",
                        keteranganPR: item.keterangan || "",
                        divisi: pr.id_divisi
                          ? localDivisiMap[String(pr.id_divisi)] || pr.id_divisi
                          : "",
                        dibuatOleh: pr.dibuatOleh,
                        skemaPR: pr.id_skema ?? "",
                        skemaPRLabel: pr.id_skema
                          ? localSkemaMap[String(pr.id_skema)] || pr.id_skema
                          : "",
                        // TARGET PENCAPAIAN PO: Use DB value (now fixed in backend)
                        targetPencapaianPO: showPO ? (btb?.targetPencapaianPo || "WAITING PART") : "",

                        targetTanggalPO: formatDateSimple(pr.estimasipo),

                        // PO Data - CONDITIONALLY BLANK (showPO)
                        // STATUS (next to Target Pencapaian PO): Mapped to btb.delay as requested
                        // This corresponds to key 'delay' in columns definition
                        delay: btb?.delay || "",

                        // STATUS (next to Target Tanggal PO): Mapped to pr_item.status as requested
                        // This corresponds to key 'status' in columns definition
                        status: showPO ? (poItem?.status_po || computeTargetPOStatus(
                          formatDateSimple(pr.estimasipo),
                          po?.tanggalPO ? (() => {
                            const d = new Date(po.tanggalPO);
                            return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getFullYear()}`;
                          })() : ""
                        )) : "",

                        id_POItem: poItem?.id_POItem || "",
                        noPO: showPO ? (po?.noPO || "") : "",
                        tanggalPO: showPO && po?.tanggalPO
                          ? (() => {
                            const d = new Date(po.tanggalPO);
                            return `${d.getDate().toString().padStart(2, "0")}-${(
                              d.getMonth() + 1
                            ).toString().padStart(2, "0")}-${d.getFullYear()}`;
                          })()
                          : "",
                        periodePO: showPO && po?.tanggalPO
                          ? (() => {
                            let d;
                            if (/^\d{2}-\d{2}-\d{4}$/.test(po.tanggalPO)) {
                              const [day, month, year] = po.tanggalPO.split("-");
                              d = new Date(`${year}-${month}-${day}`);
                            } else {
                              d = new Date(po.tanggalPO);
                            }
                            if (isNaN(d.getTime())) return "";
                            return `${d.toLocaleString("id-ID", { month: "long" })} ${d.getFullYear()}`;
                          })()
                          : "",
                        supplier: showPO && po?.id_supplier
                          ? localSupplierMap[String(po.id_supplier)] || ""
                          : "",
                        quantityAwalPO: showPO ? (poItem?.jumlahAsli || poItem?.jumlahPO || poItem?.jumlah_po || "") : "",
                        quantityPO: showPO ? (item?.jumlah ?? "") : "",
                        satuanPO: showPO ? (item.id_satuan
                          ? localSatuanMap[String(item.id_satuan)] || item.id_satuan
                          : "") : "",
                        hargaSatuanPO: showPO ? (poItem?.hargaSatuan ?? "") : "",
                        diskonPersen: showPO ? (poItem?.diskonPersen !== undefined && poItem?.diskonPersen !== null
                          ? (typeof poItem.diskonPersen === "string" && poItem.diskonPersen.includes("+")
                            ? poItem.diskonPersen
                            : (Number(poItem.diskonPersen) % 1 === 0
                              ? Number(poItem.diskonPersen).toString()
                              : Number(poItem.diskonPersen).toFixed(2)
                            ) + "%"
                          )
                          : "") : "",
                        diskonRp: showPO ? (poItem?.diskonRupiah ?? "") : "",
                        ppnPersen: showPO ? (poItem?.ppnPersen !== undefined && poItem?.ppnPersen !== null
                          ? (Number(poItem.ppnPersen) % 1 === 0
                            ? Number(poItem.ppnPersen).toString()
                            : Number(poItem.ppnPersen).toFixed(2)
                          ) + "%"
                          : "") : "",
                        ppnRp: showPO ? (po?.ppnAmount ?? "") : "",
                        totalHarga: showPO ? (poItem?.totalPerItem ?? computeItemTotal(po, poItem)) : "",
                        tanggalEstimasiDiterima: showPO && po?.estimasiTanggalTerima
                          ? (() => {
                            const d = new Date(po.estimasiTanggalTerima);
                            return `${d.getDate().toString().padStart(2, "0")}-${(
                              d.getMonth() + 1
                            ).toString().padStart(2, "0")}-${d.getFullYear()}`;
                          })()
                          : "",
                        statusPengiriman: showPO && po?.id_statusPengiriman
                          ? localStatusPengirimanMap[String(po.id_statusPengiriman)] || ""
                          : "",
                        diorderOleh: showPO && po?.orderedBy
                          ? localUserMap[String(po.orderedBy)] || po.orderedBy
                          : "",
                        diinputOleh: showPO ? (poItem?.namaPembeli ?? "") : "",
                        terminPembayaran: showPO ? (po?.termin || po?.id_termin || "") : "",
                        skemaPO: showPO ? (po?.id_skema ? localSkemaMap[String(po.id_skema)] || "" : "") : "",

                        // BTB Data - CONDITIONALLY BLANK (showBTB)
                        noBTB: showBTB ? (btb?.no_btb || "") : "",
                        id_btb: showBTB ? (btb?.id_btb || "") : "",
                        tanggalBTB: showBTB && btb?.tanggal_btb
                          ? (() => {
                            const d = new Date(btb.tanggal_btb);
                            return `${d.getDate().toString().padStart(2, "0")}-${(
                              d.getMonth() + 1
                            ).toString().padStart(2, "0")}-${d.getFullYear()}`;
                          })()
                          : "",
                        periodeBTB: showBTB && btb?.tanggal_btb
                          ? (() => {
                            let d;
                            if (/^\d{2}-\d{2}-\d{4}$/.test(btb.tanggal_btb)) {
                              const [day, month, year] = btb.tanggal_btb.split("-");
                              d = new Date(`${year}-${month}-${day}`);
                            } else {
                              d = new Date(btb.tanggal_btb);
                            }
                            if (isNaN(d.getTime())) return "";
                            return `${d.toLocaleString("id-ID", { month: "long" })} ${d.getFullYear()}`;
                          })()
                          : "",
                        quantityBTB: showBTB ? (btbItem?.jumlah_diterima ?? "") : "",
                        satuanBTB: showBTB ? (
                          btbItem?.id_satuan
                            ? localSatuanMap[String(btbItem.id_satuan)] || btbItem.id_satuan
                            : "") : "",
                        biayaBTB: showBTB ? (btbItem?.biaya ?? btb?.biaya ?? "") : "",
                        sisaStokBTB: runningBalance, 
                        diterimaOleh: showBTB ? (btb?.diterima_oleh
                          ? localUserMap[String(btb.diterima_oleh)] || btb.diterima_oleh
                          : "") : "",
                        statusPermintaanByPR: "",
                        statusPR_closed: runningBalance === 0 ? "CLOSED" : "",
                        plan: pr.plan || "",
                        noPlan: "",
                        skemaBTB: "",

                        // BKB Fields (Always show as they are the unique leaf nodes if present)
                        noBKB: parentBkb?.no_bkb || "",
                        tanggalBKB: parentBkb?.tanggal_bkb
                          ? formatDateSimple(parentBkb.tanggal_bkb)
                          : "",
                        kodeBarangBKB: bkbItem?.kodeBarang || "",
                        namaBarangBKB: bkbItem?.nama_barang || "",
                        quantityBKBData: bkbItem?.jumlah_keluar || "",
                        satuanBKB: bkbItem?.satuan || "",
                        divisiBKB: parentBkb?.divisi || ""
                      });
                    };

                    // We do not expand BKB items as BKB columns are not displayed in this table.
                    // Expanding them causes ghost rows with duplicated PO/BTB info.
                    pushRow(null);

                  });
                }
              });
            }
          });
        });

        // Helper to parse PR number
        function parsePRNumber(prNo: string) {
          if (!prNo) return { year: 0, month: 0, seq: 0 };

          const romanMap: { [key: string]: number } = {
            'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6,
            'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12
          };

          // Try to find year (2 digits) and month (roman)
          // Regex: \/(\d{2})\/([IVX]+)(?:\/|$)/
          const matchMid = prNo.match(/\/(\d{2})\/([IVX]+)(?:\/|$)/);
          let year = 0;
          let month = 0;

          if (matchMid) {
            year = parseInt(matchMid[1], 10);
            month = romanMap[matchMid[2]] || 0;
          }

          // Sequence: Last numeric part
          const matchSeq = prNo.match(/(\d+)(?!.*\d)/);
          let seq = matchSeq ? parseInt(matchSeq[1], 10) : 0;

          return { year, month, seq };
        }

        // Sort rekapRows
        rekapRows.sort((a, b) => {
          // 1. Sort by Year (ASC)
          const pA = parsePRNumber(a.noPR);
          const pB = parsePRNumber(b.noPR);

          if (pA.year !== pB.year) return pA.year - pB.year;
          // 2. Sort by Month (ASC)
          if (pA.month !== pB.month) return pA.month - pB.month;
          // 3. Sort by Sequence (ASC)
          return pA.seq - pB.seq;
        });

        setRekapData(rekapRows);
      } catch (err) {
        setRekapData([]);
      }
    }

    fetchData();
  }, []);

  // Gabungan fetch data & references
  // Duplicate useEffect removed


  // Ambil id_skema dari localStorage (userData)
  const [userSkemaId, setUserSkemaId] = useState<string | null>(null);

  useEffect(() => {
    // Ambil dari localStorage
    const stored = localStorage.getItem("userData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // id_skema bisa di userData atau skema
        setUserSkemaId(String(parsed.id_skema ?? parsed.skema ?? ""));

        // Set Role & ID for permission checks
        const role = parsed.role ?? parsed.id_peran;
        const uid = parsed.id ?? parsed.id_user;
        setCurrentUserRole(role ? Number(role) : null);
        setCurrentUserId(uid ? Number(uid) : null);

        // Log id_skema yang diterima
        console.log(
          "User id_skema (from localStorage):",
          parsed.id_skema ?? parsed.skema ?? ""
        );
      } catch {
        setUserSkemaId(null);
        setCurrentUserRole(null);
        setCurrentUserId(null);
        console.log("Gagal parsing userData dari localStorage");
      }
    }
  }, []);

  // Unique values for dropdown filter
  const uniqueValues: { [key: string]: string[] } = {};
  columns.forEach((col) => {
    uniqueValues[col.key] = Array.from(
      new Set(rekapData.map((row) => row[col.key]).filter(Boolean))
    ).sort();
  });

  // --- FILTER DATA BERDASARKAN RENTANG TANGGAL PR YANG DIPILIH USER ---
  // Helper: parse tanggal ke Date
  function parseTanggalToDate(tgl: string) {
    if (!tgl) return null;
    if (/^\d{2}-\d{2}-\d{4}$/.test(tgl)) {
      const [d, m, y] = tgl.split("-");
      return new Date(`${y}-${m}-${d}`);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
      return new Date(tgl);
    }
    return null;
  }

  // Filtered data (bandingkan id skema, bukan label)
  const filteredData = React.useMemo(() => {
    // Jika tanggal belum diisi, jangan return [], tapi biarkan filter berjalan (open ended)
    // if (!exportStartDate || !exportEndDate) return [];
    return (
      rekapData.filter((row) => {
        // Filter skemaPR sesuai user login (bandingkan id)
        if (userSkemaId && String(row.skemaPR) !== userSkemaId) {
          return false;
        }
        // Filter tanggal PR
        if (row.tanggalPR) {
          const tglPR = parseTanggalToDate(row.tanggalPR);
          if (!tglPR) return false;

          let afterStart = true;
          let beforeEnd = true;

          if (exportStartDate) {
            const start = new Date(exportStartDate);
            start.setHours(0, 0, 0, 0);
            afterStart = tglPR >= start;
          }

          if (exportEndDate) {
            const end = new Date(exportEndDate);
            end.setHours(23, 59, 59, 999); // End of day
            beforeEnd = tglPR <= end;
          }

          if (!afterStart || !beforeEnd) return false;
        } else {
          return false;
        }
        // Global search
        const matchesSearch =
          !searchTerm ||
          columns.some((col) =>
            String(row[col.key] ?? "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          );
        // Filter dropdown
        const matchesFilters = Object.entries(filters).every(([key, val]) => {
          if (!val || (Array.isArray(val) && val.length === 0)) return true;
          if (Array.isArray(val)) {
            return val.includes(row[key]);
          }
          return String(row[key] ?? "")
            .toLowerCase()
            .includes(String(val).toLowerCase());
        });
        return matchesSearch && matchesFilters;
      })
    );
  }, [
    rekapData,
    userSkemaId,
    searchTerm,
    filters,
    exportStartDate,
    exportEndDate,
  ]);

  // Tidak ada pagination, gunakan seluruh filteredData
  const pagedData = filteredData;

  
  function computeStatusPRClosed(item: any, poItem: any) {
    if (!item && !poItem) return "";
    // Belum PO = item.jumlah (quantityPO)
    // Belum BTB = poItem.jumlahPO (sisaStokBTB)
    const belumPO = Number(item?.jumlah ?? -1);
    const belumBTB = Number(poItem?.jumlahPO ?? -1);
    // If we have a PO and BTB tracking
    if (belumPO === 0 && belumBTB === 0) return "CLOSED";
    return "";
  }

  // Group rows by id_PR, then by PR Item, then by PO, then by BTB
  function groupRowsForTable(rows: any[]) {
    const grouped: { [id_PR: string]: any[] } = {};
    rows.forEach((row) => {
      const key = String(row.id_PR);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });
    // For each PR group, further group by PR Item
    // CRITICAL FIX: Sort the groups explicitly by PR Sequence
    const sortedGroups = Object.entries(grouped).sort(([, itemsA], [, itemsB]) => {
      // Helper to parse PR number
      const parsePR = (prNo: string) => {
        if (!prNo) return { year: 0, month: 0, seq: 0 };

        const romanMap: { [key: string]: number } = {
          'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6,
          'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12
        };

        // Try to find year (2 digits) and month (roman)
        // Regex: \/(\d{2})\/([IVX]+)(?:\/|$)/
        const matchMid = prNo.match(/\/(\d{2})\/([IVX]+)(?:\/|$)/);
        let year = 0;
        let month = 0;

        if (matchMid) {
          year = parseInt(matchMid[1], 10);
          month = romanMap[matchMid[2]] || 0;
        }

        // Sequence: Last numeric part
        const matchSeq = prNo.match(/(\d+)(?!.*\d)/);
        let seq = matchSeq ? parseInt(matchSeq[1], 10) : 0;

        return { year, month, seq };
      };

      const noA = itemsA[0]?.noPR || "";
      const noB = itemsB[0]?.noPR || "";

      const pA = parsePR(noA);
      const pB = parsePR(noB);

      if (pA.year !== pB.year) return pA.year - pB.year;
      if (pA.month !== pB.month) return pA.month - pB.month;
      return pA.seq - pB.seq;
    });

    return sortedGroups.map(([id_PR, items]) => {
      // Group by PR Item
      const prItemGroups: { [prItemKey: string]: any[] } = {};
      items.forEach((item) => {
        // Use id_PRItem as key. If not available, fallback to daftarBarangPR + satuanPR + quantityAwalPR
        const prItemKey = item.id_PRItem 
          ? String(item.id_PRItem)
          : String(item.daftarBarangPR) + "|" + String(item.satuanPR) + "|" + String(item.quantityAwalPR);
        if (!prItemGroups[prItemKey]) prItemGroups[prItemKey] = [];
        prItemGroups[prItemKey].push(item);
      });
      const prItemGroupArr = Object.entries(prItemGroups).map(
        ([prItemKey, prItemItems]) => {
          // Group by PO
          const poGroups: { [id_PO: string]: any[] } = {};
          prItemItems.forEach((item) => {
            const poKey = String(item.noPO || item.id_PO || "");
            if (!poGroups[poKey]) poGroups[poKey] = [];
            poGroups[poKey].push(item);
          });
          const poGroupArr = Object.entries(poGroups).map(([id_PO, poItems]) => {
            // Group by BTB
            const btbGroups: { [id_btb: string]: any[] } = {};
            poItems.forEach((itm) => {
              const btbKey = String(itm.noBTB || itm.id_btb || "");
              if (!btbGroups[btbKey]) btbGroups[btbKey] = [];
              btbGroups[btbKey].push(itm);
            });
            const btbGroupArr = Object.entries(btbGroups).map(
              ([id_btb, btbItems]) => ({
                id_btb,
                items: btbItems,
                rowSpan: btbItems.length,
                firstIdx: poItems.findIndex((itm) => itm.noBTB === id_btb),
              })
            );
            return {
              id_PO,
              items: poItems,
              rowSpan: poItems.length,
              btbGroups: btbGroupArr,
              firstIdx: prItemItems.findIndex((itm) => itm.noPO === id_PO),
            };
          });
          return {
            prItemKey,
            items: prItemItems,
            rowSpan: prItemItems.length,
            poGroups: poGroupArr,
          };
        }
      );
      return {
        id_PR,
        items,
        rowSpan: items.length,
        prItemGroups: prItemGroupArr,
      };
    });
  }

  const groupedTableData = groupRowsForTable(pagedData);

  // Data untuk export sesuai mode
  const getExportData = () => {
    if (exportMode === "selected") {
      return filteredData.filter((row) => selectedIds.includes(row.id));
    }
    if (exportMode === "range" && exportStartDate && exportEndDate) {
      return filteredData.filter((row) => {
        if (!row.tanggalPR) return false;
        // Parse tanggalPR string to Date object
        let d: Date | null = null;
        if (/^\d{2}-\d{2}-\d{4}$/.test(row.tanggalPR)) {
          const [day, month, year] = row.tanggalPR.split("-");
          d = new Date(`${year}-${month}-${day}`);
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(row.tanggalPR)) {
          d = new Date(row.tanggalPR);
        }

        if (!d) return false;

        // Compare with exportStartDate/EndDate (which are Date objects)
        const start = new Date(exportStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(exportEndDate);
        end.setHours(23, 59, 59, 999);

        return d >= start && d <= end;
      });
    }
    return filteredData;
  };

  const handleExport = async () => {
    // 1. Dapatkan data yang akan diexport (sudah difilter)
    const exportDataRaw = getExportData();

    // 2. Lakukan grouping persis seperti di tabel UI
    //    agar kita bisa melakukan merge cell (rowSpan) di Excel
    const groupedData = groupRowsForTable(exportDataRaw);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rekap Full");

    // 3. Header
    // Kita ambil label dari columns definition, TAPI exclude yang key-nya mengandung 'skema'
    // 3. Header
    // Kita ambil label dari columns definition, TAPI exclude yang key-nya mengandung 'skema'
    const exportColumns = columns.filter(
      (col) => !["skemaPR", "skemaPO", "skemaBTB"].includes(col.key)
    );
    const headers = exportColumns.map((col) => col.label);
    const headerRow = worksheet.addRow(headers);

    // Style header
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFEEEEEE" },
      };
    });
    headerRow.height = 25;

    // Helper untuk menulis row ke Excel
    // Kita akan loop structure groupedData > itemGroups > poGroups > btbGroups
    // dan menulis row satu per satu, sambil mencatat koordinat merge.

    let currentRowIdx = 2; // Row 1 adalah header, mulai data di Row 2

    // Helper untuk styling border & align standard
    const styleCell = (row: ExcelJS.Row, colIdx: number, val: any) => {
      const cell = row.getCell(colIdx);
      cell.value = val;
      cell.border = {
        top: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
      };
      cell.alignment = { vertical: "top", horizontal: "left", wrapText: true };
    };

    /**
     * Structure groupedData:
     * [
     *   {
     *     id_PR,
     *     rowSpan, // Total baris untuk PR ini
     *     prItemGroups: [
     *       {
     *         prItemKey,
     *         rowSpan, // Total baris untuk PR Item ini
     *         items, // raw items (untuk ambil data PR Item level)
     *         poGroups: [
     *           {
     *             id_PO,
     *             rowSpan, // Total baris untuk PO ini
     *             items, // raw items (untuk ambil data PO level)
     *             btbGroups: [
     *                {
     *                  id_btb,
     *                  items, // raw items (baris-baris akhir/detail BTB)
     *                  rowSpan
     *                }
     *             ]
     *           }
     *         ]
     *       }
     *     ]
     *   }
     * ]
     */

    groupedData.forEach((prGroup) => {
      // Koordinat awal baris untuk PR ini
      const prStartRow = currentRowIdx;

      prGroup.prItemGroups.forEach((prItemGroup) => {
        const prItemStartRow = currentRowIdx;

        prItemGroup.poGroups.forEach((poGroup) => {
          // Capture first row of this PO group for data carry-forward
          const firstPORow = poGroup.items[0] || {};

          poGroup.btbGroups.forEach((btbGroup) => {
            // Capture first row of this BTB group for data carry-forward
            const firstBTBRow = btbGroup.items[0] || {};

            // Di level terdalam (BTB Groups), kita punya n baris item
            btbGroup.items.forEach((rowDetail) => {
              const row = worksheet.getRow(currentRowIdx);

              exportColumns.forEach((col, colIdx) => {
                // Excel columns 1-indexed
                const excelColIdx = colIdx + 1;
                let val = rowDetail[col.key];

                // --- DEDUPLICATION LOGIC ---
                const isFirstPR = currentRowIdx === prStartRow;
                const isFirstPRItem = currentRowIdx === prItemStartRow;

                const prCols = ["noPR", "tanggalPR", "hariPR", "skemaPR", "plan"];
                const prItemCols = [
                  "noMR", "daftarBarangPR", "quantityAwalPR", "satuanPR", "keteranganPR", 
                  "divisi", "dibuatOleh", "targetTanggalPO", "status"
                ];
                // Custom PR Item Cols that should not be deduplicated if they change per row
                const prItemColsDynamic = ["statusPR_closed"];
                const poCols = [
                  "noPO", "tanggalPO", "supplier", "quantityAwalPO", "satuanPO", "hargaSatuanPO",
                  "diskonPersen", "diskonRp", "ppnPersen", "ppnRp", "totalHarga", "statusPengiriman",
                  "tanggalEstimasiDiterima", "diorderOleh", "diinputOleh", "terminPembayaran",
                  "targetPencapaianPO", "skemaPO", "delay"
                ];
                const btbCols = ["noBTB", "tanggalBTB", "quantityBTB", "satuanBTB", "biayaBTB", "sisaStokBTB", "diterimaOleh", "skemaBTB"];

                // PR and PR Item level deduplication (keep as-is, matches frontend behavior)
                if (!isFirstPR && prCols.includes(col.key)) val = "";
                if (!isFirstPRItem && prItemCols.includes(col.key)) val = "";

                // VISUAL OVERRIDE: Match frontend behavior - show PO and BTB data on every row
                // For PO columns: carry forward data from the first row in the PO group if current row is blank
                if (poCols.includes(col.key) && (val === "" || val === undefined || val === null)) {
                  val = firstPORow[col.key] ?? "";
                }
                // For BTB columns: carry forward data from the first row in the BTB group if current row is blank
                if (btbCols.includes(col.key) && (val === "" || val === undefined || val === null)) {
                  val = firstBTBRow[col.key] ?? "";
                }

                const cell = row.getCell(excelColIdx);

                // --- FORMATTING VALUE ---

                // 1. Numeric (Quantity) -> Number + '#,##0'
                if (
                  [
                    "quantityAwalPR",
                    "quantityPR",
                    "quantityPO",
                    "quantityBTB",
                    "sisaStokBTB",
                    "quantityAwalPO",
                    // "targetPencapaianPO", // usually string e.g. "100%" or text
                    "quantity" // generic fallback
                  ].includes(col.key)
                ) {
                  const num = Number(val);
                  if (!isNaN(num) && val !== "" && val !== null) {
                    cell.value = num;
                    cell.numFmt = '#,##0';
                  } else {
                    cell.value = val;
                  }
                }
                // 2. Currency (Money) -> Number + 'Rp #,##0' (or just number with accounting format)
                // User asked for "sama persis dengan frontend". Frontend shows "Rp ...".
                // Better to use Excel currency format so it's calculated.
                else if (
                  ["biayaBTB", "totalHarga", "ppnRp", "diskonRp", "hargaSatuanPO"].includes(col.key)
                ) {
                  const num = Number(val);
                  if (!isNaN(num) && val !== "" && val !== null) {
                    cell.value = num;
                    // Excel custom format for Rp. (with dot)
                    cell.numFmt = '_("Rp."* #,##0_);_("Rp."* (#,##0);_("Rp."* "-"_);_(@_)';
                  } else {
                    cell.value = val;
                  }
                }
                // 3. Diskon Persen -> String + Ignore Green Triangle Error
                else if (col.key === "diskonPersen") {
                  cell.value = String(val || "0");
                  // @ts-ignore
                  cell.ignoredErrors = { numberStoredAsText: true };
                }
                // 3. Usernames -> Remove underscores and Uppercase
                else if (["dibuatOleh", "diorderOleh", "diterimaOleh", "diinputOleh"].includes(col.key)) {
                  cell.value = val ? String(val).replace(/_/g, " ").toUpperCase() : "";
                }
                // 4. Dates -> Replace hyphen with slash if regex matches DD-MM-YYYY
                else if (
                  ["tanggalPR", "targetTanggalPO", "tanggalPO", "tanggalEstimasiDiterima", "tanggalBTB"].includes(col.key)
                ) {
                  if (val && typeof val === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(val)) {
                    cell.value = val.replace(/-/g, '/');
                  } else {
                    cell.value = val;
                  }
                }
                else {
                  // Clean up labels
                  if (col.key === "skemaPR") val = rowDetail.skemaPRLabel ?? rowDetail.skemaPR ?? "";
                  if (col.key === "skemaPO") val = rowDetail.skemaPO ?? "";
                  if (col.key === "skemaBTB") val = rowDetail.skemaBTB ?? "";
                  if (col.key === "noPO" && (!val || val === "")) val = "";

                  cell.value = val;
                }

                // Standard Styling
                cell.border = {
                  top: { style: "thin" },
                  right: { style: "thin" },
                  bottom: { style: "thin" },
                  left: { style: "thin" },
                };
                cell.alignment = { vertical: "top", horizontal: "left", wrapText: true };
              });

              currentRowIdx++;
            });

            // Merge BTB Level columns - REMOVED for consistency with no-rowSpan layout
          }); // end btbGroups

          // Merge PO Level columns - REMOVED for consistency with no-rowSpan layout

        }); // end poGroups

        // Merge PR Item Level columns - REMOVED for consistency with no-rowSpan layout
      }); // end prItemGroups

      // Merge PR Level columns - REMOVED for consistency with no-rowSpan layout

    }); // end prGroup

    // Auto-fit columns (simple approximation)
    worksheet.columns.forEach((column) => {
      let maxLen = 10;
      // Sampling some cells to guess width? Or just set fixed generic width.
      // Better to check typical content length.
      column.width = 15;
    });
    // Adjust specific columns
    const widthMap: Record<string, number> = {
      daftarBarangPR: 30,
      keteranganPR: 25,
      supplier: 25,
      divisi: 15,
      noPR: 18,
      noPO: 18,
      noBTB: 18
    };
    exportColumns.forEach((col, idx) => {
      if (widthMap[col.key]) {
        worksheet.getColumn(idx + 1).width = widthMap[col.key];
      }
    });

    // Download
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

  // --- CUSTOM EXPORT FOR SPECIAL USERS (98, 141) ---
  const handleSpecialExport = async () => {
    // 1. Get filtered data
    const exportDataRaw = getExportData();
    // 2. Group it just like table
    const groupedData = groupRowsForTable(exportDataRaw);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rekap Full Custom");

    // Specific Columns Requested
    const specialColumns = [
      { header: "No.Pr", key: "noPR" },
      { header: "Tgl.Pr", key: "tanggalPR" },
      { header: "Kode Barang", key: "kodeBarangPR" },
      { header: "Nama Barang", key: "daftarBarangPR" },
      { header: "Qty", key: "quantityAwalPR" },
      { header: "Satuan", key: "satuanPR" },
      { header: "Spesifikasi/No seri sertifikat", key: "spesifikasi" },
      { header: "Status Control", key: "status" },
      { header: "No.Mr", key: "noMR" },
      { header: "Keterangan", key: "keteranganPR" },
      { header: "Divisi", key: "divisi" },
      { header: "User", key: "dibuatOleh" },
      { header: "No.Po", key: "noPO" },
      { header: "Tgl.Po", key: "tanggalPO" },
      { header: "Qty", key: "quantityPO" },
      { header: "Satuan", key: "satuanPO" },
      { header: "Suplayer Btb", key: "supplier" },
      { header: "No. Btb", key: "noBTB" },
      { header: "Tgl.Ttb", key: "tanggalBTB" },
      { header: "Kode Barang", key: "kodeBarangPR" }, // Assuming matching PR code
      { header: "Nama Barang", key: "namaBarangBTB" }, // Or daftarBarangPR if generic
      { header: "Qty", key: "quantityBTB" },
      { header: "Satuan", key: "satuanBTB" },
      { header: "No.Bkb", key: "noBKB" }, // Inferred
      { header: "Tgl.Bkb", key: "tanggalBKB" },
      { header: "Kode Barang", key: "kodeBarangBKB" },
      { header: "Nama Barang", key: "namaBarangBKB" },
      { header: "Qty", key: "quantityBKBData" },
      { header: "Satuan", key: "satuanBKB" },
      { header: "Dept", key: "divisiBKB" }
    ].filter(col => {
      // Remove spesifikasi for users 98 and 141
      if (col.key === "spesifikasi" && (currentUserId === 98 || currentUserId === 141)) {
        return false;
      }
      return true;
    });

    // Add keys for internal use if needed (checking width etc)
    const headers = specialColumns.map(c => c.header);
    const headerRow = worksheet.addRow(headers);

    // Style header
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.eachCell((cell) => {
      cell.border = { top: { style: "thin" }, right: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEEEEE" } };
    });

    let currentRowIdx = 2;

    groupedData.forEach((prGroup) => {
      const prStartRow = currentRowIdx;
      prGroup.prItemGroups.forEach((prItemGroup) => {
        const prItemStartRow = currentRowIdx;
        prItemGroup.poGroups.forEach((poGroup) => {
          const poStartRow = currentRowIdx;
          poGroup.btbGroups.forEach((btbGroup) => {
            const btbStartRow = currentRowIdx;
            btbGroup.items.forEach((rowDetail) => {
              const row = worksheet.getRow(currentRowIdx);

              specialColumns.forEach((col, colIdx) => {
                const excelColIdx = colIdx + 1;
                let val = rowDetail[col.key];

                const cell = row.getCell(excelColIdx);

                // Basic formatting similar to main export
                if (["quantityAwalPR", "quantityPO", "quantityBTB", "quantityBKBData"].includes(col.key)) {
                  const num = Number(val);
                  if (!isNaN(num) && val !== "" && val !== null) {
                    cell.value = num;
                    cell.numFmt = '#,##0';
                  } else {
                    cell.value = val;
                  }
                } else if (["tanggalPR", "tanggalPO", "tanggalBTB", "tanggalBKB"].includes(col.key)) {
                  if (val && typeof val === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(val)) {
                    cell.value = val.replace(/-/g, '/');
                  } else {
                    cell.value = val;
                  }
                } else {
                  if (col.key === "namaBarangBTB" && (!val || val === "")) val = rowDetail.daftarBarangPR; // Fallback

                  // Logic requested: Satuan BKB fallback to Satuan BTB if empty
                  if (col.key === "satuanBKB" && (!val || val === "")) val = rowDetail.satuanBTB;

                  cell.value = val;
                }

                cell.border = { top: { style: "thin" }, right: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" } };
                cell.alignment = { vertical: "top", horizontal: "left", wrapText: true };
              });
              currentRowIdx++;
            });

            // Merge Logic for BTB
            if (btbGroup.rowSpan > 1) {
              const btbEndRow = btbStartRow + btbGroup.rowSpan - 1;
              // Columns related to BTB & BKB? 
              // Logic: BKB is inside BTB group. If BKB has multiple items, BTB fields should merge.
              // Columns 17-22 are BTB.
              // Updated indices after adding No. BTB (17) -> Suppliers(16), NoBTB(17), TglBTB(18), Kode(19), Nama(20), Qty(21), Satuan(22)
              // 0-based indices: 16, 17, 18, 19, 20, 21, 22
              const btbColsIndices = [16, 17, 18, 19, 20, 21, 22];
              btbColsIndices.forEach(idx => {
                worksheet.mergeCells(btbStartRow, idx + 1, btbEndRow, idx + 1);
              });
            }
          });

          // Merge Logic for PO
          if (poGroup.rowSpan > 1) {
            const poEndRow = poStartRow + poGroup.rowSpan - 1;
            // Columns 13-16 are PO
            const poColsIndices = [12, 13, 14, 15];
            poColsIndices.forEach(idx => {
              worksheet.mergeCells(poStartRow, idx + 1, poEndRow, idx + 1);
            });
          }
        });
        // Merge Logic for PR Item
        if (prItemGroup.rowSpan > 1) {
          const prItemEndRow = prItemStartRow + prItemGroup.rowSpan - 1;
          // Columns 4-7, 9-10 are PR Item level? No.
          // Kode Barang(2), Nama(3), Qty(4), Satuan(5), Spesifikasi(6), NoMR(8), Keterangan(9), Divisi(10), User(11)
          const prItemColsIndices = [2, 3, 4, 5, 6, 8, 9, 10, 11];
          prItemColsIndices.forEach(idx => {
            worksheet.mergeCells(prItemStartRow, idx + 1, prItemEndRow, idx + 1);
          });
        }
      });
      // Merge Logic for PR
      if (prGroup.rowSpan > 1) {
        const prEndRow = prStartRow + prGroup.rowSpan - 1;
        // Columns 0, 1, 7(Status)
        const prColsIndices = [0, 1, 7];
        prColsIndices.forEach(idx => {
          worksheet.mergeCells(prStartRow, idx + 1, prEndRow, idx + 1);
        });
      }
    });

    // Auto width approximation
    worksheet.columns.forEach(c => c.width = 15);
    worksheet.getColumn(4).width = 30; // Nama Barang PR
    worksheet.getColumn(20).width = 30; // Nama Barang BTB
    worksheet.getColumn(26).width = 30; // Nama Barang BKB
    worksheet.getColumn(10).width = 25; // Keterangan

    const fileName = "Rekap_Special_" + new Date().toISOString().slice(0, 10) + ".xlsx";
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };


  // State untuk edit Target Pencapaian PO
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null); // pakai item.id
  const [editingTargetValue, setEditingTargetValue] = useState<string>("");
  const [editingTargetLoading, setEditingTargetLoading] = useState<boolean>(false);
  const [customTargetInput, setCustomTargetInput] = useState<string>(""); // <-- tambahkan untuk custom

  // State untuk edit Status (statusterima)
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingStatusValue, setEditingStatusValue] = useState<string>("");
  const [editingStatusLoading, setEditingStatusLoading] = useState<boolean>(false);
  const [customStatusInput, setCustomStatusInput] = useState<string>("");

  // State untuk edit Delay
  const [editingDelayId, setEditingDelayId] = useState<string | null>(null);
  const [editingDelayValue, setEditingDelayValue] = useState<string>("");
  const [editingDelayLoading, setEditingDelayLoading] = useState<boolean>(false);
  const [customDelayInput, setCustomDelayInput] = useState<string>("");

  // Handler klik kolom delay: buka popover (input text direct)
  function handleDelayEditClick(item: any) {
    if (currentUserRole === 4 || currentUserId === 112 || currentUserId === 113 || currentUserId === 168 || currentUserId === 169) {
      // Store (Role 4) and Restricted Users cannot edit
      return;
    }
    if (!item.id_btb_item) return;
    setEditingDelayId(item.id);
    // Jika delay sudah ada value, set ke custom input
    setCustomDelayInput(item.delay || "");
    setEditingDelayValue("Custom..."); // Assume custom for delay since it's free text mostly
  }

  // Handler submit custom delay
  async function handleCustomDelaySubmit(item: any) {
    const customVal = customDelayInput.trim();
    // if (!customVal) return; // Allow empty to reset? Maybe.
    setEditingDelayLoading(true);

    if (!item.id_btb_item) {
      alert("BTB Item ID tidak ditemukan");
      setEditingDelayId(null);
      setEditingDelayLoading(false);
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/api/btb-item/${item.id_btb_item}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delay: customVal }),
      });
      setRekapData((prev) =>
        prev.map((row) =>
          row.id_btb_item === item.id_btb_item ? { ...row, delay: customVal } : row
        )
      );
    } catch (err) {
      alert("Gagal update Delay");
    }
    setEditingDelayId(null);
    setEditingDelayLoading(false);
  }

  // Opsi status yang diizinkan
  const statusOptions = [
    "TERCAPAI",
    "TIDAK TERCAPAI",
    "WAITING PROGRESS PO",
    "Custom..."
  ];

  // Opsi target pencapaian yang diizinkan (sesuai permintaan)
  const targetOptions = [
    "TERCAPAI",
    "TIDAK TERCAPAI",
    "WAITING PART",
    "Custom...",
  ];

  // Handler klik kolom status: buka dropdown
  function handleStatusEditClick(item: any) {
    // Block editing for Store (id_peran 4) and Restricted Users
    if (currentUserRole === 4 || currentUserId === 112 || currentUserId === 113 || currentUserId === 168 || currentUserId === 169) {
      // Optional: alert("Store tidak memiliki akses edit status");
      return;
    }
    if (!item.id_POItem) return;
    setEditingStatusId(item.id);
    setEditingStatusValue(item.status || "");
    setCustomStatusInput("");
  }

  // Handler klik kolom target pencapaian: buka dropdown
  function handleTargetEditClick(item: any) {
    // Block editing for Divisi (id_peran 2), Store (id_peran 4) and Restricted Users
    if (currentUserRole === 2 || currentUserRole === 4 || currentUserId === 112 || currentUserId === 113 || currentUserId === 168 || currentUserId === 169) {
      return;
    }
    if (!item.id_btb) return; // Use BTB ID check
    setEditingTargetId(item.id); // pakai id unik row
    setEditingTargetValue(item.targetPencapaianPO || "");
    setCustomTargetInput(""); // reset custom input
  }

  // Handler pilih status baru
  async function handleStatusChange(newStatus: string, item: any) {
    if (newStatus === "Custom...") {
      setEditingStatusValue("Custom...");
      setCustomStatusInput("");
      return;
    }
    setEditingStatusValue(newStatus);
    setEditingStatusId(item.id); // lock editing on specific row
    setEditingStatusLoading(true);
    try {
      if (!item.id_POItem) {
        alert("PO Item ID tidak ditemukan");
        setEditingStatusId(null);
        setEditingStatusLoading(false);
        return;
      }

      // Update status_po di po_item (backend)
      await fetch(`${API_BASE_URL}/api/po-item/${item.id_POItem}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_po: newStatus }),
      });
      // Update di frontend (refresh data)
      setRekapData((prev) =>
        prev.map((row) =>
          row.id_POItem === item.id_POItem ? { ...row, status: newStatus } : row
        )
      );
    } catch (err) {
      alert("Gagal update status");
    }
    setEditingStatusId(null);
    setEditingStatusLoading(false);
  }

  // Handler pilih target baru
  async function handleTargetChange(newTarget: string, item: any) {
    if (newTarget === "Custom...") {
      setEditingTargetValue("Custom...");
      setCustomTargetInput(item.targetPencapaianPO || "");
      return;
    }
    setEditingTargetValue(newTarget);
    setEditingTargetId(item.id);
    setEditingTargetLoading(true);

    let targetId = item.id_btb; // Use BTB ID

    if (!targetId) {
      alert("BTB ID tidak ditemukan");
      setEditingTargetId(null);
      setEditingTargetLoading(false);
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/api/btb/${targetId}`, {
        method: "PATCH", // PATCH for btb update
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPencapaianPo: newTarget }),
      });
      // Update all rows with same id_btb
      setRekapData((prev) =>
        prev.map((row) =>
          row.id_btb === item.id_btb ? { ...row, targetPencapaianPO: newTarget } : row
        )
      );
    } catch (err) {
      alert("Gagal update Target Pencapaian PO");
    }
    setEditingTargetId(null);
    setEditingTargetLoading(false);
  }

  // Handler submit custom status
  async function handleCustomStatusSubmit(item: any) {
    const customVal = customStatusInput.trim();
    if (!customVal) return;
    setEditingStatusLoading(true);
    try {
      if (!item.id_POItem) {
        alert("PO Item ID tidak ditemukan");
        setEditingStatusId(null);
        setEditingStatusLoading(false);
        return;
      }

      await fetch(`${API_BASE_URL}/api/po-item/${item.id_POItem}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_po: customVal }),
      });
      setRekapData((prev) =>
        prev.map((row) =>
          row.id_POItem === item.id_POItem ? { ...row, status: customVal } : row
        )
      );
    } catch (err) {
      alert("Gagal update status");
    }
    setEditingStatusId(null);
    setEditingStatusLoading(false);
  }

  // Handler submit custom target
  async function handleCustomTargetSubmit(item: any) {
    const customVal = customTargetInput.trim();
    if (!customVal) return;
    setEditingTargetLoading(true);

    let targetId = item.id_btb;

    if (!targetId) {
      alert("BTB ID tidak ditemukan");
      setEditingTargetId(null);
      setEditingTargetLoading(false);
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/api/btb/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPencapaianPo: customVal }),
      });
      setRekapData((prev) =>
        prev.map((row) =>
          row.id_btb === item.id_btb ? { ...row, targetPencapaianPO: customVal } : row
        )
      );
    } catch (err) {
      alert("Gagal update Target Pencapaian PO");
    }
    setEditingTargetId(null);
    setEditingTargetLoading(false);
  }

  // Handler klik target pencapaian PO: update targetPencapaianPo di backend (BTB Item)
  async function handleTargetPencapaianClick(item: any) {
    // Hanya update jika ada id_btb_item dan targetPencapaianPO bukan "woke bos"
    if (!item.id_btb_item || !item.targetPencapaianPO || item.targetPencapaianPO === "woke bos") return;

    setUpdatingTargetId(item.id_btb_item);
    try {
      await fetch(`${API_BASE_URL}/api/btb-item/${item.id_btb_item}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPencapaianPo: "woke bos" }),
      });
      setRekapData(prev =>
        prev.map(row =>
          row.id_btb_item === item.id_btb_item
            ? { ...row, targetPencapaianPO: "woke bos" }
            : row
        )
      );
    } catch (err) {
      alert("Gagal update Target Pencapaian PO");
    }
    setUpdatingTargetId(null);
  }

  // Helper: mapping status Target Pencapaian PO ke warna background cell
  function getTargetPencapaianPoBg(status: string | undefined | null) {
    if (!status || status.trim() === "") return "";
    const s = status.trim().toUpperCase();
    if (s === "TERCAPAI") return "bg-green-100";
    if (s === "WAITING PART") return "bg-yellow-100";
    // Jika typo atau status custom lain, tetap merah muda
    return "bg-red-100";
  }

  // Helper: mapping status ke warna background cell (untuk kolom Status)
  function getStatusBg(status: string | undefined | null) {
    if (!status || status.trim() === "") return "";
    const s = status.trim().toUpperCase();
    if (s === "TERCAPAI") return "bg-green-100";
    if (s === "WAITING PROGRESS PO") return "bg-yellow-100";
    return "bg-red-100"; // TIDAK TERCAPAI and Custom statuses
  }

  // Helper format tanggal ke dd-mm-yyyy dan bisa lebihkan hari
  function formatTanggalDisplay(tgl: string, plusDays: number = 0) {
    if (!tgl) return "";
    let dateObj: Date | null = null;
    if (/^\d{2}-\d{2}-\d{4}$/.test(tgl)) {
      const [d, m, y] = tgl.split("-");
      dateObj = new Date(`${y}-${m}-${d}`);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
      dateObj = new Date(tgl);
    }
    if (dateObj && !isNaN(dateObj.getTime())) {
      if (plusDays !== 0) dateObj.setDate(dateObj.getDate() + plusDays);
      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = dateObj.getFullYear();
      return `${day}-${month}-${year}`;
    }
    // fallback: jika sudah dd-mm-yyyy dan parsing gagal, return as is
    if (/^\d{2}-\d{2}-\d{4}$/.test(tgl) && plusDays === 0) return tgl;
    return tgl;
  }

  // State untuk loading update status
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  // Tambahkan state untuk loading update target pencapaian PO
  const [updatingTargetId, setUpdatingTargetId] = useState<string | null>(null);

  // Handler klik status: update status PO di backend
  async function handleStatusClick(item: any) {
    // Hanya update jika ada noPO dan status bukan "woke bos"
    if (!item.noPO || item.status === "woke bos") return;
    setUpdatingStatusId(item.noPO);
    try {
      // Cari id_PO dari noPO (harus ada di data PO)
      const poRes = await fetch(API_BASE_URL + "/api/po");
      const poList = await poRes.json();
      const po = poList.find((p: any) => String(p.noPO) === String(item.noPO));
      if (!po) {
        alert("PO tidak ditemukan");
        setUpdatingStatusId(null);
        return;
      }
      // Update statusterima di backend
      await fetch(`${API_BASE_URL}/api/po/${po.id_PO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusterima: "woke bos" }),
      });
      // Update di frontend (refresh data)
      setRekapData((prev) =>
        prev.map((row) =>
          row.noPO === item.noPO ? { ...row, status: "woke bos" } : row
        )
      );
    } catch (err) {
      alert("Gagal update status");
    }
    setUpdatingStatusId(null);
  }

  return (
    <MainLayout>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Rekap Full Monitoring
            </h1>
            <p className="text-muted-foreground">
              Tabel rekap PR, PO dan BTB
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 px-4 gap-2 border-dashed border-gray-400 hover:bg-gray-50 hover:border-gray-500">
                    <Download className="h-4 w-4" />
                    <span className="font-medium">Export Excel</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 z-[9999] bg-white" align="end">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                        Export Rekap Full
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Pilih format dan filter data yang ingin diunduh.
                      </p>
                    </div>

                    <Tabs defaultValue={exportMode} onValueChange={(v) => setExportMode(v as any)} className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all" className="text-xs">Semua</TabsTrigger>
                        <TabsTrigger value="selected" className="text-xs">Pilihan</TabsTrigger>
                        <TabsTrigger value="range" className="text-xs">Tanggal</TabsTrigger>
                      </TabsList>

                      <TabsContent value="all" className="mt-4 space-y-2">
                        <div className="p-3 bg-gray-50 rounded-md border text-center">
                          <span className="text-xs text-muted-foreground block mb-1">Total Data</span>
                          <span className="text-xl font-bold text-primary">{filteredData.length}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center">
                          Mengunduh semua data yang tampil saat ini.
                        </p>
                      </TabsContent>

                      <TabsContent value="selected" className="mt-4 space-y-2">
                        <div className="p-3 bg-gray-50 rounded-md border text-center">
                          <span className="text-xs text-muted-foreground block mb-1">Data Terpilih</span>
                          <span className={`text-xl font-bold ${selectedIds.length > 0 ? 'text-primary' : 'text-gray-400'}`}>
                            {selectedIds.length}
                          </span>
                        </div>
                        {selectedIds.length === 0 && (
                          <p className="text-[10px] text-red-500 text-center">
                            Pilih checkbox pada tabel terlebih dahulu.
                          </p>
                        )}
                      </TabsContent>

                      <TabsContent value="range" className="mt-4 space-y-3">
                        <div className="grid gap-2">
                          <div className="grid gap-1">
                            <Label className="text-xs">Tanggal PR Mulai</Label>
                            <div className="relative">
                              <Input
                                type="date"
                                value={exportStartDate ? exportStartDate.toISOString().split('T')[0] : ''}
                                onChange={(e) => setExportStartDate(e.target.value ? new Date(e.target.value) : null)}
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                          <div className="grid gap-1">
                            <Label className="text-xs">Tanggal PR Akhir</Label>
                            <div className="relative">
                              <Input
                                type="date"
                                value={exportEndDate ? exportEndDate.toISOString().split('T')[0] : ''}
                                onChange={(e) => setExportEndDate(e.target.value ? new Date(e.target.value) : null)}
                                className="h-8 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <Button
                      onClick={() => {
                        handleExport();
                      }}
                      className="w-full h-9 bg-green-600 hover:bg-green-700 text-white gap-2"
                      disabled={
                        (exportMode === "selected" && selectedIds.length === 0) ||
                        (exportMode === "range" && (!exportStartDate || !exportEndDate))
                      }
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download .xlsx
                    </Button>

                    {/* Integrated Custom Export Button for Users 98 & 141 */}
                    {(currentUserId === 98 || currentUserId === 141) && (
                      <div className="pt-2 mt-2 border-t border-gray-100">
                        <Button
                          onClick={handleSpecialExport}
                          variant="outline"
                          className="w-full h-9 border-green-600 text-green-600 hover:bg-green-50 gap-2"
                          disabled={
                            (exportMode === "selected" && selectedIds.length === 0) ||
                            (exportMode === "range" && (!exportStartDate || !exportEndDate))
                          }
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          Download Format Khusus
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Tombol Export Khusus (Visible only for User 98 & 141) */}
              {/* Tombol Export Khusus removed and integrated into Popover */}


            </div>
          </div>
        </div>
        {/* Tambahkan input tanggal PR di atas tabel, pakai DatePicker visual */}
        <div className="flex items-center gap-2 mb-2">
          <Label className="text-sm font-medium">Rentang Tanggal Rekap:</Label>
          <DatePicker
            selected={exportStartDate}
            onChange={(date) => setExportStartDate(date)}
            selectsStart
            startDate={exportStartDate}
            endDate={exportEndDate}
            dateFormat="yyyy-MM-dd"
            placeholderText="Tanggal Mulai"
            className="w-[140px] px-2 py-1 border rounded-md bg-white text-xs"
            maxDate={exportEndDate || undefined}
            isClearable
          />
          <span>-</span>
          <DatePicker
            selected={exportEndDate}
            onChange={(date) => setExportEndDate(date)}
            selectsEnd
            startDate={exportStartDate}
            endDate={exportEndDate}
            dateFormat="yyyy-MM-dd"
            placeholderText="Tanggal Akhir"
            className="w-[140px] px-2 py-1 border rounded-md bg-white text-xs"
            minDate={exportStartDate || undefined}
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
        {/* Jika tanggal belum diisi, tampilkan pesan */}
        {/* Jika tanggal belum diisi, tetap tampilkan tabel (default all/open-ended) */}
        {false ? (
          <Card className="bg-white bg-card border-border">
            <CardHeader>
              <CardTitle>Daftar Rekap Full</CardTitle>
              <CardDescription>

                Pilih rentang tanggal PR terlebih dahulu untuk menampilkan data.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card className="bg-white bg-card border-border">
            <CardHeader>
              <CardTitle>Daftar Rekap Full</CardTitle>
              <CardDescription>
                Total: {filteredData.length} data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Cari semua kolom..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                  }}
                />
              </div>
              {/* Make table scrollable with sticky header */}
              <div
                className="overflow-auto"
                style={{
                  maxHeight: "70vh", // adjust as needed
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                }}
              >
                <Table className="border-collapse border border-gray-300 table-auto min-w-[1800px]">
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead
                          key={col.key}
                          className={`text-left px-3 py-1 border-b border-r border-gray-300 uppercase
                            ${["skemaPR", "skemaPO", "skemaBTB"].includes(col.key) ? " hidden" : ""}
                            sticky-header-cell
                          `}
                          style={{
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                            background: "#f3f4f6", // bg-gray-100
                            borderBottom: "2px solid #d1d5db",
                          }}
                        >
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedTableData.map((prGroup, globalPrIdx) => (
                      <React.Fragment key={prGroup.id_PR}>
                        {/* For each PR Item group inside PR group */}
                        {prGroup.prItemGroups.map((prItemGroup, prItemGrpIdx) =>
                          prItemGroup.poGroups.map((poGroup, poGrpIdx) =>
                            poGroup.btbGroups.map((btbGroup, btbGrpIdx) =>
                              btbGroup.items.map((item, idx) => {
                                // For BTB logical trace
                                const isFirstBTB_logic = idx === 0;
                                // For PO logical trace
                                const isFirstPO_logic = btbGrpIdx === 0 && isFirstBTB_logic;
                                // For PR Item rowSpan, only show on first item in PR Item group
                                const isFirstPRItem = poGrpIdx === 0 && isFirstPO_logic;
                                // For PR rowSpan, only show on first item in PR group
                                const isFirstPR = prItemGrpIdx === 0 && isFirstPRItem;

                                // VISUAL OVERRIDE: User requested PO and BTB data to be printed on every row
                                const isFirstPO = true;
                                const isFirstBTB = true;
                                // Only allow edit on the last item in BTB group
                                const isEditableRow = idx === btbGroup.items.length - 1;
                                return (
                                  <TableRow
                                    key={
                                      prGroup.id_PR +
                                      "-" +
                                      prItemGroup.prItemKey +
                                      "-" +
                                      poGroup.id_PO +
                                      "-" +
                                      btbGroup.id_btb +
                                      "-item-" +
                                      idx
                                    }
                                    className="hover:bg-gray-50 even:bg-gray-50 transition-colors"
                                  >
                                    {/* Periode PR */}

                                    {/* No. PR */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {isFirstPR ? (
                                        <span
                                          className={`font-bold text-black ${currentUserRole === 3 || currentUserId === 112 || currentUserId === 113 || currentUserId === 168 || currentUserId === 169 ? "" : "cursor-pointer hover:text-blue-600 hover:underline"}`}
                                          onClick={() => {
                                            if (currentUserRole === 3 || currentUserId === 112 || currentUserId === 113 || currentUserId === 168 || currentUserId === 169) return; // Disable for Purchasing & Restricted
                                            if (item.noPR) {
                                              window.location.href = `/pr/monitoring?highlight=${encodeURIComponent(item.noPR)}`;
                                            }
                                          }}
                                        >
                                          {(item.noPR || "").toUpperCase()}
                                        </span>
                                      ) : null}
                                    </TableCell>
                                    {/* Tanggal PR */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {isFirstPR ? (item.tanggalPR || "").toUpperCase() : null}
                                    </TableCell>
                                    {/* Hari PR */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {isFirstPR ? (item.hariPR || "").toUpperCase() : null}
                                    </TableCell>

                                    {/* Daftar Barang PR */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {isFirstPRItem ? (item.daftarBarangPR || "").toUpperCase() : null}
                                    </TableCell>
                                    {/* Quantity Awal PR */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 text-right uppercase align-top">
                                      {isFirstPRItem ? formatInt(item.quantityAwalPR) : null}
                                    </TableCell>
                                    {/* Satuan PR */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {isFirstPRItem ? (
                                        typeof item.satuanPR === "string"
                                          ? item.satuanPR.toUpperCase()
                                          : item.satuanPR ?? ""
                                      ) : null}
                                    </TableCell>
                                    {/* No. MR */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase font-bold text-left align-top">
                                      {isFirstPRItem ? (item.noMR || "").toUpperCase() : null}
                                    </TableCell>
                                    {/* Keterangan PR */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {isFirstPRItem ? (
                                        <KeteranganPopover text={typeof item.keteranganPR === "string" ? item.keteranganPR.toUpperCase() : ""} max={20} />
                                      ) : null}
                                    </TableCell>
                                    {/* Divisi */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {isFirstPRItem ? (
                                        typeof item.divisi === "string"
                                          ? item.divisi.toUpperCase()
                                          : item.divisi ?? ""
                                      ) : null}
                                    </TableCell>
                                    {/* Dibuat Oleh */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {isFirstPRItem ? (
                                        typeof item.dibuatOleh === "string"
                                          ? item.dibuatOleh.replace(/_/g, " ").toUpperCase()
                                          : item.dibuatOleh ?? ""
                                      ) : null}
                                    </TableCell>
                                    {/* Target Tanggal PO */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {isFirstPRItem ? (
                                        typeof item.targetTanggalPO === "string"
                                          ? formatTanggalDisplay(item.targetTanggalPO).toUpperCase()
                                          : item.targetTanggalPO ?? ""
                                      ) : null}
                                    </TableCell>
                                    {/* Status */}
                                    {/* Status - Per Item */}
                                    <TableCell
                                      className={`px-3 py-1 border-b border-r border-gray-300 relative group uppercase align-top ${currentUserRole === 4 || currentUserId === 112 || currentUserId === 113 || currentUserId === 168 || currentUserId === 169 ? "" : "cursor-pointer"} ${editingStatusId === item.id
                                        ? "bg-gray-200"
                                        : getStatusBg(item.status)
                                        }`}
                                      onClick={currentUserRole === 4 || currentUserId === 112 || currentUserId === 113 || currentUserId === 168 || currentUserId === 169 ? undefined : () => handleStatusEditClick(item)}
                                      style={{ opacity: editingStatusLoading && editingStatusId === item.id ? 0.5 : 1 }}
                                      title={currentUserRole === 4 || currentUserId === 112 || currentUserId === 113 || currentUserId === 168 || currentUserId === 169 ? "Tidak dapat mengedit status" : "Klik untuk edit status"}
                                    >
                                      {editingStatusId === item.id && currentUserRole !== 4 && currentUserId !== 112 && currentUserId !== 113 && currentUserId !== 168 && currentUserId !== 169 ? (
                                        <Popover open={true} onOpenChange={(open) => { if (!open) setEditingStatusId(null); }}>
                                          <PopoverTrigger asChild>
                                            <div className="cursor-pointer">{item.status || "Pilih Status"}</div>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-56 p-2 bg-white shadow-lg border rounded-md z-50">
                                            {editingStatusValue === "Custom..." ? (
                                              <form
                                                onSubmit={(e) => {
                                                  e.preventDefault();
                                                  handleCustomStatusSubmit(item);
                                                }}
                                                className="space-y-2"
                                              >
                                                <Label className="text-xs font-medium">Status Custom</Label>
                                                <Input
                                                  autoFocus
                                                  className="h-8 text-xs uppercase"
                                                  placeholder="Isi status..."
                                                  value={customStatusInput}
                                                  onChange={(e) => setCustomStatusInput(e.target.value)}
                                                  onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="flex justify-end gap-2">
                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-xs"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setEditingStatusValue("");
                                                      setCustomStatusInput("");
                                                    }}
                                                  >
                                                    Batal
                                                  </Button>
                                                  <Button
                                                    type="submit"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    disabled={!customStatusInput.trim()}
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    Simpan
                                                  </Button>
                                                </div>
                                              </form>
                                            ) : (
                                              <div className="space-y-1">
                                                <Label className="text-xs font-medium px-2 text-muted-foreground">
                                                  Pilih Status
                                                </Label>
                                                {statusOptions.map((opt) => {
                                                  const isActive = item.status === opt;
                                                  return (
                                                    <div
                                                      key={opt}
                                                      className={`text-sm px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center justify-between ${isActive ? "bg-accent font-medium text-accent-foreground" : ""
                                                        }`}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStatusChange(opt, item);
                                                      }}
                                                    >
                                                      {opt.toUpperCase()}
                                                      {isActive && <span className="text-xs">âœ“</span>}
                                                    </div>
                                                  );
                                                })}
                                                <div className="pt-2 mt-2 border-t flex justify-end">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs text-muted-foreground"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setEditingStatusId(null);
                                                    }}
                                                  >
                                                    Batal
                                                  </Button>
                                                </div>
                                              </div>
                                            )}
                                          </PopoverContent>
                                        </Popover>
                                      ) : (
                                        <span>{(item.status || "").toUpperCase()}</span>
                                      )}
                                    </TableCell>
                                    {/* Skema PR */}
                                    {isFirstPR ? (
                                      <TableCell
                                        className="px-3 py-1 border-b border-r border-gray-300 hidden uppercase"
                                        rowSpan={prGroup.rowSpan}
                                      >
                                        {typeof item.skemaPRLabel === "string"
                                          ? item.skemaPRLabel.toUpperCase()
                                          : item.skemaPRLabel ?? ""}
                                      </TableCell>
                                    ) : null}
                                    {/* Periode PO */}

                                    {/* No. PO */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {isFirstPO ? (
                                        <span
                                          className={`font-bold text-black ${currentUserRole === 4 || currentUserId === 112 || currentUserId === 113 || currentUserId === 168 || currentUserId === 169 ? "" : "cursor-pointer hover:text-blue-600 hover:underline"}`}
                                          onClick={() => {
                                            if (currentUserRole === 4 || currentUserId === 112 || currentUserId === 113 || currentUserId === 168 || currentUserId === 169) return;
                                            if (item.noPO) {
                                              window.location.href = `/po/monitoring?highlight=${encodeURIComponent(item.noPO)}`;
                                            }
                                          }}
                                        >
                                          {(item.noPO || "").toUpperCase()}
                                        </span>
                                      ) : null}
                                    </TableCell>
                                    {/* Tanggal PO */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {isFirstPO ? formatTanggalDisplay(item.tanggalPO).toUpperCase() : null}
                                    </TableCell>
                                    {/* Supplier */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {isFirstPO ? (
                                        typeof item.supplier === "string"
                                          ? item.supplier.toUpperCase()
                                          : item.supplier ?? ""
                                      ) : null}
                                    </TableCell>
                                    {/* Quantity Awal PO */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">{formatInt(item.quantityAwalPO)}</TableCell>
                                    {/* Satuan PO */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {typeof item.satuanPO === "string"
                                        ? item.satuanPO.toUpperCase()
                                        : item.satuanPO ?? ""}
                                    </TableCell>
                                    {/* Harga Satuan PO */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 text-right uppercase align-top">
                                      {item.hargaSatuanPO !== undefined && item.hargaSatuanPO !== null && item.hargaSatuanPO !== ""
                                        ? formatRupiahFull(item.hargaSatuanPO).toUpperCase()
                                        : ""}
                                    </TableCell>
                                    {/* Diskon (%) */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">{(item.diskonPersen || "").toUpperCase()}</TableCell>
                                    {/* Diskon (Rp) */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">{formatRupiahFull(item.diskonRp).toUpperCase()}</TableCell>
                                    {/* PPN (%) */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">{(item.ppnPersen || "").toUpperCase()}</TableCell>
                                    {/* PPN (Rp) */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">{formatRupiahFull(item.ppnRp).toUpperCase()}</TableCell>
                                    {/* Total Harga */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">{formatRupiahFull(item.totalHarga).toUpperCase()}</TableCell>
                                    {/* Status Pengiriman */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {isFirstPO ? (
                                        typeof item.statusPengiriman === "string"
                                          ? item.statusPengiriman.toUpperCase()
                                          : item.statusPengiriman ?? ""
                                      ) : null}
                                    </TableCell>
                                    {/* Tanggal Estimasi Diterima */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {isFirstPO ? formatTanggalDisplay(item.tanggalEstimasiDiterima).toUpperCase() : null}
                                    </TableCell>
                                    {/* Diinput Oleh */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {typeof item.diinputOleh === "string"
                                        ? item.diinputOleh.toUpperCase()
                                        : item.diinputOleh ?? ""}
                                    </TableCell>
                                    {/* Diorder Oleh */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {isFirstPO ? (
                                        typeof item.diorderOleh === "string"
                                          ? item.diorderOleh.replace(/_/g, " ").toUpperCase()
                                          : item.diorderOleh ?? ""
                                      ) : null}
                                    </TableCell>
                                    {/* Termin Pembayaran */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {isFirstPO ? (item.terminPembayaran || "").toUpperCase() : null}
                                    </TableCell>
                                    {/* Target Pencapaian PO */}
                                    <TableCell
                                      className={`px-3 py-1 border-b border-r border-gray-300 ${getTargetPencapaianPoBg(item.targetPencapaianPO)} ${currentUserRole === 4 || currentUserId === 112 || currentUserId === 113 || currentUserId === 168 || currentUserId === 169 ? "" : "cursor-pointer"} uppercase`}
                                      onClick={currentUserRole === 4 || currentUserId === 112 || currentUserId === 113 || currentUserId === 168 || currentUserId === 169 ? undefined : () => handleTargetEditClick(item)}
                                      style={{
                                        opacity:
                                          updatingTargetId &&
                                            String(item.noBTB) &&
                                            rekapData.find(r => r.noBTB === item.noBTB && String(r.id).endsWith(updatingTargetId))
                                            ? 0.5
                                            : 1
                                      }}
                                      title={currentUserRole === 4 || currentUserId === 112 || currentUserId === 113 || currentUserId === 168 || currentUserId === 169 ? "Tidak dapat mengedit target" : "Klik untuk update Target Pencapaian PO"}
                                    >
                                      {editingTargetId === item.id && currentUserRole !== 4 && currentUserId !== 112 && currentUserId !== 113 && currentUserId !== 168 && currentUserId !== 169 ? (
                                        <Popover open={true} onOpenChange={(open) => { if (!open) setEditingTargetId(null); }}>
                                          <PopoverTrigger asChild>
                                            <div className="cursor-pointer">{item.targetPencapaianPO || "Pilih Target"}</div>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-56 p-2 bg-white shadow-lg border rounded-md z-50">
                                            {editingTargetValue === "Custom..." ? (
                                              <form
                                                onSubmit={(e) => {
                                                  e.preventDefault();
                                                  handleCustomTargetSubmit(item);
                                                }}
                                                className="space-y-2"
                                              >
                                                <Label className="text-xs font-medium">Target Custom</Label>
                                                <Input
                                                  autoFocus
                                                  className="h-8 text-xs uppercase"
                                                  placeholder="Isi target..."
                                                  value={customTargetInput}
                                                  onChange={(e) => setCustomTargetInput(e.target.value)}
                                                  onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="flex justify-end gap-2">
                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-xs"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setEditingTargetValue("");
                                                      setCustomTargetInput("");
                                                    }}
                                                  >
                                                    Batal
                                                  </Button>
                                                  <Button
                                                    type="submit"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    disabled={!customTargetInput.trim()}
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    Simpan
                                                  </Button>
                                                </div>
                                              </form>
                                            ) : (
                                              <div className="space-y-1">
                                                <Label className="text-xs font-medium px-2 text-muted-foreground">
                                                  Pilih Target
                                                </Label>
                                                {targetOptions.map((opt) => {
                                                  const isActive = item.targetPencapaianPO === opt;
                                                  return (
                                                    <div
                                                      key={opt}
                                                      className={`text-sm px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center justify-between ${isActive ? "bg-accent font-medium text-accent-foreground" : ""
                                                        }`}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleTargetChange(opt, item);
                                                      }}
                                                    >
                                                      {opt.toUpperCase()}
                                                      {isActive && <span className="text-xs">âœ“</span>}
                                                    </div>
                                                  );
                                                })}
                                                <div className="pt-2 mt-2 border-t flex justify-end">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs text-muted-foreground"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setEditingTargetId(null);
                                                    }}
                                                  >
                                                    Batal
                                                  </Button>
                                                </div>
                                              </div>
                                            )}
                                          </PopoverContent>
                                        </Popover>
                                      ) : (
                                        <span className="text-black">{(item.targetPencapaianPO || "").toUpperCase()}</span>
                                      )}
                                    </TableCell>
                                    {/* Delay - Ungrouped / Per Row */}
                                    <TableCell
                                      className={`px-3 py-1 border-b border-r border-gray-300 uppercase ${currentUserRole === 4 || currentUserId === 112 || currentUserId === 113 || currentUserId === 168 || currentUserId === 169 ? "" : "cursor-pointer"}`}
                                      onClick={currentUserRole === 4 || currentUserId === 112 || currentUserId === 113 || currentUserId === 168 || currentUserId === 169 ? undefined : () => handleDelayEditClick(item)}
                                      title={currentUserRole === 4 || currentUserId === 112 || currentUserId === 113 || currentUserId === 168 || currentUserId === 169 ? "Tidak dapat mengedit delay" : "Klik untuk update Delay"}
                                    >
                                      {editingDelayId === item.id && currentUserRole !== 4 && currentUserId !== 112 && currentUserId !== 113 && currentUserId !== 168 && currentUserId !== 169 ? (
                                        <Popover open={true} onOpenChange={(open) => { if (!open) setEditingDelayId(null); }}>
                                          <PopoverTrigger asChild>
                                            <div className="cursor-pointer">{item.delay || "Set Delay"}</div>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-56 p-2 bg-white shadow-lg border rounded-md z-50">
                                            <form
                                              onSubmit={(e) => {
                                                e.preventDefault();
                                                handleCustomDelaySubmit(item);
                                              }}
                                              className="space-y-2"
                                            >
                                              <Label className="text-xs font-medium">Input Delay/Status</Label>
                                              <Input
                                                autoFocus
                                                className="h-8 text-xs uppercase"
                                                placeholder="Isi delay..."
                                                value={customDelayInput}
                                                onChange={(e) => setCustomDelayInput(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                              <div className="flex justify-end gap-2">
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant="ghost"
                                                  className="h-7 text-xs"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingDelayId(null);
                                                    setCustomDelayInput("");
                                                  }}
                                                >
                                                  Batal
                                                </Button>
                                                <Button
                                                  type="submit"
                                                  size="sm"
                                                  className="h-7 text-xs"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  Simpan
                                                </Button>
                                              </div>
                                            </form>
                                          </PopoverContent>
                                        </Popover>
                                      ) : (
                                        <span>{(item.delay || "").toUpperCase()}</span>
                                      )}
                                    </TableCell>
                                    {/* Quantity PO */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">{formatInt(item.quantityPO)}</TableCell>
                                    {/* Skema PO */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 hidden uppercase">
                                      {isFirstPO ? (item.skemaPO || "").toUpperCase() : null}
                                    </TableCell>
                                    {/* Periode BTB */}

                                    {/* No. BTB */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {isFirstBTB ? (
                                        <span
                                          className="cursor-pointer font-bold text-black hover:text-blue-600 hover:underline"
                                          onClick={() => {
                                            if (item.noBTB) {
                                              window.location.href = `/btb/monitoring?highlight=${encodeURIComponent(item.noBTB)}`;
                                            }
                                          }}
                                        >
                                          {(item.noBTB || "").toUpperCase()}
                                        </span>
                                      ) : null}
                                    </TableCell>
                                    {/* Tanggal BTB */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {isFirstBTB ? (item.tanggalBTB || "").toUpperCase() : null}
                                    </TableCell>
                                    {/* Quantity BTB */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">{formatInt(item.quantityBTB)}</TableCell>
                                    {/* Satuan BTB */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {typeof item.satuanBTB === "string"
                                        ? item.satuanBTB.toUpperCase()
                                        : item.satuanBTB ?? ""}
                                    </TableCell>
                                    {/* Biaya BTB */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">{formatRupiahFull(item.biayaBTB).toUpperCase()}</TableCell>
                                    {/* Sisa Stok BTB */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">{formatInt(item.sisaStokBTB)}</TableCell>
                                    {/* Diterima Oleh */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {isFirstBTB ? (
                                        typeof item.diterimaOleh === "string"
                                          ? item.diterimaOleh.replace(/_/g, " ").toUpperCase()
                                          : item.diterimaOleh ?? ""
                                      ) : null}
                                    </TableCell>
                                                                        {/* Plan */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                      {typeof item.plan === "string"
                                        ? item.plan.toUpperCase()
                                        : item.plan ?? ""}
                                    </TableCell>
                                    {/* STATUS PR */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top font-bold text-center">
                                      {typeof item.statusPR_closed === "string"
                                        ? item.statusPR_closed.toUpperCase()
                                        : item.statusPR_closed ?? ""}
                                    </TableCell>
                                    {/* Skema BTB */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 hidden uppercase align-top">
                                      {isFirstBTB ? (
                                        typeof item.skemaBTB === "string"
                                          ? item.skemaBTB.toUpperCase()
                                          : item.skemaBTB ?? ""
                                      ) : null}
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )
                          )
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            {/* Pagination dihilangkan, tampilkan semua data sesuai rentang tanggal */}
          </Card>
        )}
      </div>
    </MainLayout >
  );
}
