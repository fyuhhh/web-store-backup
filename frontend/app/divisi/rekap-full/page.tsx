"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import DatePicker from "react-datepicker";
import { toast } from "sonner"; // Import from sonner
import dayjs from "dayjs";
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



import { Label } from "@/components/ui/label";
import { ChevronDown, Calendar as CalendarIcon, FileSpreadsheet, Download } from "lucide-react";
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
  { key: "noMR", label: "NO. MR" },
  { key: "noPR", label: "NO. PR" },
  { key: "tanggalPR", label: "TANGGAL PR" },
  { key: "hariPR", label: "HARI" },
  { key: "daftarBarangPR", label: "DAFTAR BARANG" },
  { key: "quantityAwalPR", label: "QUANTITY PR" },
  { key: "satuanPR", label: "SATUAN" },
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
  { key: "delay", label: "STATUS DELAY" },
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

function computeStatusPRClosed(quantityBelumPO: any, quantityBelumBTB: any) {
  const q1 = (quantityBelumPO !== "" && quantityBelumPO !== null && quantityBelumPO !== undefined) ? Number(quantityBelumPO) : -1;
  const q2 = (quantityBelumBTB !== "" && quantityBelumBTB !== null && quantityBelumBTB !== undefined) ? Number(quantityBelumBTB) : -1;
  if (q1 === 0 && q2 === 0) return "CLOSED";
  return "";
}

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
function formatTanggalTambahSehari(tgl: string) {
  if (!tgl) return "";
  // Jika sudah dd-mm-yyyy, ubah ke Date dulu
  let dateObj;
  if (/^\d{2}-\d{2}-\d{4}$/.test(tgl)) {
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
  return `${day}-${month}-${year}`;
}

// Helper format tanggal dd-mm-yyyy +2 hari (fix: handle dd-mm-yyyy and yyyy-mm-dd)
function formatTanggalTambahDuaHari(tgl: string) {
  if (!tgl) return "";
  let dateObj;
  if (/^\d{2}-\d{2}-\d{4}$/.test(tgl)) {
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
  return `${day}-${month}-${year}`;
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

  // Check current user role and division
  const [currentUserRole, setCurrentUserRole] = useState<number | null>(null);
  const [currentUserDivisi, setCurrentUserDivisi] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("userData");
      if (saved) {
        try {
          const p = JSON.parse(saved);
          setCurrentUserRole(Number(p.id_peran || p.role));
          if (p.id_divisi) {
            setCurrentUserDivisi(Number(p.id_divisi));
          }
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


  // Gabungan fetch data & references
  useEffect(() => {
    async function fetchData() {
      // 1. Get User Division from localStorage & Backend
      let userDivisiId: string | number | null = null;
      let debugSource = "None";

      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("userData");
        if (saved) {
          try {
            const p = JSON.parse(saved);
            userDivisiId = p.id_divisi;
            debugSource = "LocalStorage";

            // FETCH FRESH USER DATA to be sure (syncs with Header logic)
            const userId = p.id ?? p.id_user;
            if (userId) {
              try {
                const uRes = await fetch(`${API_BASE_URL}/api/user/${userId}`);
                const uData = await uRes.json();
                if (uData && uData.id_divisi) {
                  userDivisiId = uData.id_divisi;
                  debugSource = "Backend API";
                }
              } catch (e) {
                console.error("Backend user fetch failed", e);
              }
            }
          } catch { }
        }
      }

      console.log("Rekap Full Filtering - Source:", debugSource, "ID:", userDivisiId);

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
                noMR: item.noMR || "",
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
                status:
                  pr.status &&
                    !["Menunggu", "Gantung", "Diproses"].includes(pr.status)
                    ? pr.status
                    : "",
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
                biayaBTB: "",
                sisaStokBTB: "",
                diterimaOleh: "",
                quantityPO: item.jumlah ?? "",
                statusPR_closed: computeStatusPRClosed(item.jumlah, -1),
                plan: pr.plan || "",
                skemaBTB: "",
                targetPencapaianPO: "",
              });
            } else {
              // Untuk setiap PO Item yang terkait, cari PO dan BTB
              poItems.forEach((poItem: any) => {
                const po = poData.find((p: any) => String(p.id_PO) === String(poItem.id_PO));
                // Cari BTB Item yang terkait PO Item ini
                const btbItems = btbItemData.filter((bi: any) => String(bi.id_POItem) === String(poItem.id_POItem));
                if (btbItems.length === 0) {
                  // Jika tidak ada BTB, tetap tampilkan baris PR-PRItem-POItem
                  rekapRows.push({
                    id: pr.id_PR + "-" + idx + "-" + (poItem.id_POItem || ""),
                    id_PR: pr.id_PR,
                    periodePR: pr.tanggalPR ? `${getMonthName(pr.tanggalPR)} ${getYear(pr.tanggalPR)}` : "",
                    tahunPR: getYear(pr.tanggalPR),
                    bulanPR: getMonthName(pr.tanggalPR),
                    noMR: item.noMR || "",
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
                    status: poItem?.statusTerima ?? po?.statusterima ?? pr.status ?? "",
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
                    quantityPO: 0,
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
                    biayaBTB: "",
                    sisaStokBTB: poItem?.jumlahPO || poItem?.jumlah_po || "",
                    diterimaOleh: "",
                    statusPR_closed: computeStatusPRClosed(0, poItem?.jumlahPO || poItem?.jumlah_po),
                    plan: pr.plan || "",
                    skemaBTB: "",
                    targetPencapaianPO: "",
                  });
                } else {
                  // Untuk tiap BTB Item, tampilkan baris lengkap
                  btbItems.forEach((btbItem: any, btbIdx: number) => {
                    const btb = btbData.find((b: any) => String(b.id_btb) === String(btbItem.id_btb));
                    const isFirstBTB = btbIdx === 0;

                    rekapRows.push({
                      id: pr.id_PR + "-" + idx + "-" + (poItem.id_POItem || "") + "-" + (btbItem.id_btb_item || ""),
                      id_PR: pr.id_PR,
                      periodePR: pr.tanggalPR ? `${getMonthName(pr.tanggalPR)} ${getYear(pr.tanggalPR)}` : "",
                      tahunPR: getYear(pr.tanggalPR),
                      bulanPR: getMonthName(pr.tanggalPR),
                      noMR: item.noMR || "",
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
                      delay: po?.estimasiTanggalTerima && btb?.tanggal_btb
                        ? (() => {
                          const days = countCalendarDaysBetween(po.estimasiTanggalTerima, btb.tanggal_btb);
                          return String(days);
                        })()
                        : "",
                      status: isFirstBTB ? (poItem?.statusTerima ?? po?.statusterima ?? pr.status ?? "") : "",
                      targetPencapaianPO: isFirstBTB ? (() => {
                        if (btbItem?.targetPencapaianPo) return btbItem.targetPencapaianPo;
                        if (po?.estimasiTanggalTerima && btb?.tanggal_btb) {
                          const days = countCalendarDaysBetween(po.estimasiTanggalTerima, btb.tanggal_btb);
                          return days <= 0 ? "TERCAPAI" : "TIDAK TERCAPAI";
                        }
                        return (po?.noPO ? "WAITING DELIVERY" : "WAITING PROGRESS PO");
                      })() : "",
                      id_POItem: poItem?.id_POItem || "",
                      noPO: isFirstBTB ? (po?.noPO || "") : "",
                      tanggalPO: isFirstBTB && po?.tanggalPO
                        ? (() => {
                          const d = new Date(po.tanggalPO);
                          return `${d.getDate().toString().padStart(2, "0")}-${(
                            d.getMonth() + 1
                          ).toString().padStart(2, "0")}-${d.getFullYear()}`;
                        })()
                        : "",
                      periodePO: isFirstBTB && po?.tanggalPO
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
                      supplier: isFirstBTB && po?.id_supplier
                        ? localSupplierMap[String(po.id_supplier)] || ""
                        : "",
                      quantityAwalPO: isFirstBTB ? (poItem?.jumlahAsli || poItem?.jumlahPO || poItem?.jumlah_po || "") : "",
                      quantityPO: 0,
                      satuanPO: isFirstBTB ? (
                        item.id_satuan
                          ? localSatuanMap[String(item.id_satuan)] || item.id_satuan
                          : "") : "",
                      hargaSatuanPO: isFirstBTB ? (poItem?.hargaSatuan ?? "") : "",
                      diskonPersen: isFirstBTB ? (poItem?.diskonPersen !== undefined && poItem?.diskonPersen !== null
                        ? (typeof poItem.diskonPersen === "string" && poItem.diskonPersen.includes("+")
                          ? poItem.diskonPersen
                          : (Number(poItem.diskonPersen) % 1 === 0
                            ? Number(poItem.diskonPersen).toString()
                            : Number(poItem.diskonPersen).toFixed(2)
                          ) + "%"
                        )
                        : "") : "",
                      diskonRp: isFirstBTB ? (poItem?.diskonRupiah ?? "") : "",
                      ppnPersen: isFirstBTB ? (poItem?.ppnPersen !== undefined && poItem?.ppnPersen !== null
                        ? (Number(poItem.ppnPersen) % 1 === 0
                          ? Number(poItem.ppnPersen).toString()
                          : Number(poItem.ppnPersen).toFixed(2)
                        ) + "%"
                          : "") : "",
                      ppnRp: isFirstBTB ? (po?.ppnAmount ?? "") : "",
                      totalHarga: isFirstBTB ? (poItem?.totalPerItem ?? computeItemTotal(po, poItem)) : "",
                      tanggalEstimasiDiterima: isFirstBTB && po?.estimasiTanggalTerima
                        ? (() => {
                          const d = new Date(po.estimasiTanggalTerima);
                          return `${d.getDate().toString().padStart(2, "0")}-${(
                            d.getMonth() + 1
                          ).toString().padStart(2, "0")}-${d.getFullYear()}`;
                        })()
                        : "",
                      statusPengiriman: isFirstBTB && po?.id_statusPengiriman
                        ? localStatusPengirimanMap[String(po.id_statusPengiriman)] || ""
                        : "",
                      diorderOleh: isFirstBTB && po?.orderedBy
                        ? localUserMap[String(po.orderedBy)] || po.orderedBy
                        : "",
                      diinputOleh: isFirstBTB ? (poItem?.namaPembeli ?? "") : "",
                      terminPembayaran: isFirstBTB ? (po?.termin || po?.id_termin || "") : "",
                      skemaPO: isFirstBTB ? (po?.id_skema ? localSkemaMap[String(po.id_skema)] || "" : "") : "",
                      noBTB: btb?.no_btb || "",
                      id_btb: btb?.id_btb || "",
                      tanggalBTB: btb?.tanggal_btb
                        ? (() => {
                          const d = new Date(btb.tanggal_btb);
                          return `${d.getDate().toString().padStart(2, "0")}-${(
                            d.getMonth() + 1
                          ).toString().padStart(2, "0")}-${d.getFullYear()}`;
                        })()
                        : "",
                      periodeBTB: btb?.tanggal_btb
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
                      quantityBTB: btbItem?.jumlah_diterima ?? "",
                      satuanBTB:
                        btbItem?.id_satuan
                          ? localSatuanMap[String(btbItem.id_satuan)] || btbItem.id_satuan
                          : "",
                      biayaBTB: btbItem?.biaya ?? btb?.biaya ?? "",
                      sisaStokBTB: 0,
                      diterimaOleh: btb?.diterima_oleh
                        ? localUserMap[String(btb.diterima_oleh)] || btb.diterima_oleh
                        : "",
                      statusPR_closed: isFirstBTB ? computeStatusPRClosed(0, 0) : "",
                      plan: pr.plan || "",
                      skemaBTB: btb?.id_skema
                        ? localSkemaMap[String(btb.id_skema)] || btb.id_skema
                        : "",
                      id_btb_item: btbItem?.id_btb_item || "",
                    });
                  });
                }
              });
            }
          });
        });

        rekapRows.sort((a, b) => {
          const getSeq = (str: string) => {
            const match = (str || "").trim().match(/(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
          };
          const seqDiff = getSeq(a.noPR) - getSeq(b.noPR);
          if (seqDiff !== 0) return seqDiff;

          const dateA = a.tanggalPR ? new Date(a.tanggalPR).getTime() : 0;
          const dateB = b.tanggalPR ? new Date(b.tanggalPR).getTime() : 0;
          return dateA - dateB;
        });

        // --- FILTER BY DIVISION NAME (NAME-BASED) ---
        let finalRows = rekapRows;

        if (userDivisiId) {
          const userDivName = localDivisiMap[String(userDivisiId)];
          if (userDivName) {
            finalRows = rekapRows.filter(row => row.divisi === userDivName);
          } else {
            finalRows = rekapRows.filter(row => String(row.divisi) === String(userDivisiId));
          }
        }

        setRekapData(finalRows);
      } catch (err) {
        console.error("FETCH ERROR:", err);
        setRekapData([]);
      }
    }
    fetchData();

  }, []);



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
        // Log id_skema yang diterima
        console.log(
          "User id_skema (from localStorage):",
          parsed.id_skema ?? parsed.skema ?? ""
        );
      } catch {
        setUserSkemaId(null);
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
        // Filter skemaPR sesuai user login (bandingkan id), KECUALI Admin (id_peran 1)
        if (currentUserRole !== 1 && userSkemaId && String(row.skemaPR) !== userSkemaId) {
          return false;
        }
        // Filter tanggal PR
        if (row.tanggalPR) {
          const tglPR = parseTanggalToDate(row.tanggalPR);
          if (!tglPR) return false;

          let afterStart = true;
          let beforeEnd = true;

          if (exportStartDate) {
            const start = dayjs(exportStartDate).startOf('day');
            if (dayjs(tglPR).isBefore(start)) afterStart = false; // logic flip: if PR BEFORE start, then fail
          }

          if (exportEndDate) {
            const end = dayjs(exportEndDate).endOf('day');
            if (dayjs(tglPR).isAfter(end)) beforeEnd = false; // logic flip: if PR AFTER end, then fail
          }

          if (!afterStart || !beforeEnd) return false;
        } else {
          // If no date on row, decide policy. Let's assume include if no filter, exclude if filter active?
          // Or usually safe to exclude if we are date filtering.
          // If filters are active, exclude rows without date.
          if (exportStartDate || exportEndDate) return false;
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
      // Group by PR Item (by daftarBarangPR + satuanPR + quantityAwalPR)
      const prItemGroups: { [prItemKey: string]: any[] } = {};
      items.forEach((item) => {
        // Use daftarBarangPR + satuanPR + quantityAwalPR as key
        const prItemKey =
          String(item.daftarBarangPR) +
          "|" +
          String(item.satuanPR) +
          "|" +
          String(item.quantityAwalPR);
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
    // Kita ambil label dari columns definition
    // 3. Header
    // Kita ambil label dari columns definition
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
          const poStartRow = currentRowIdx;

          poGroup.btbGroups.forEach((btbGroup) => {
            const btbStartRow = currentRowIdx;

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
                const isFirstPO = currentRowIdx === poStartRow;
                const isFirstBTB = currentRowIdx === btbStartRow;

                // Columns mapped to their respective hierarchy levels in Divisi portal
                const prCols = ["noMR", "noPR", "tanggalPR", "hariPR", "skemaPR", "plan"];
                const prItemCols = [
                  "daftarBarangPR", "quantityAwalPR", "satuanPR", "keteranganPR", 
                  "divisi", "dibuatOleh", "targetTanggalPO", "status", "statusPR_closed"
                ];
                const poCols = [
                  "noPO", "tanggalPO", "supplier", "quantityAwalPO", "satuanPO", "hargaSatuanPO",
                  "diskonPersen", "diskonRp", "ppnPersen", "ppnRp", "totalHarga", "statusPengiriman",
                  "tanggalEstimasiDiterima", "diorderOleh", "diinputOleh", "terminPembayaran",
                  "targetPencapaianPO", "skemaPO", "delay"
                ];
                const btbCols = ["noBTB", "tanggalBTB", "quantityBTB", "satuanBTB", "biayaBTB", "sisaStokBTB", "diterimaOleh", "skemaBTB"];

                if (!isFirstPR && prCols.includes(col.key)) val = "";
                if (!isFirstPRItem && prItemCols.includes(col.key)) val = "";
                if (!isFirstPO && poCols.includes(col.key)) val = "";
                if (!isFirstBTB && btbCols.includes(col.key)) val = "";

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
                  cell.value = String(val || "0"); // Force string
                  // @ts-ignore
                  cell.ignoredErrors = { numberStoredAsText: true };
                }
                // 3. Usernames -> Remove underscores and Uppercase
                else if (["dibuatOleh", "diorderOleh", "diterimaOleh", "diinputOleh"].includes(col.key)) {
                  cell.value = val ? String(val).replace(/_/g, " ").toUpperCase() : "";
                }
                // 4. Dates -> They are already strings "DD-MM-YYYY" in rekapData.
                // Just use them as string or parse to Date if calculation needed.
                // User said "misal 15-10-2025". Frontend string is fine.
                // Prevent Excel from auto-converting to US date if possible, but DD-MM is distinct > 12.
                // Best to keep as string or explicitly set as Text if ambiguous?
                // Actually Excel usually handles DD-MM-YYYY fine if system region matches, or if we send it as string.
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
      noBTB: 18,
      terminPembayaran: 20
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


  // Helper: mapping status Target Pencapaian PO ke warna background cell
  function getTargetPencapaianPoBg(status: string | undefined | null) {
    if (!status || status.trim() === "") return "";
    const s = status.trim().toUpperCase();
    if (s === "TERCAPAI") return "bg-green-100";
    if (s === "TIDAK TERCAPAI") return "bg-red-100";
    if (s === "WAITING PAYMENT") return "bg-yellow-100";
    if (s === "WAITING DELIVERY") return "bg-orange-100";
    if (s === "INDENT PART") return "bg-blue-100";
    // Jika typo atau status lain, tetap merah muda
    return "bg-red-100";
  }

  // Helper: mapping status ke warna background cell (untuk kolom Status)
  function getStatusBg(status: string | undefined | null) {
    if (!status || status.trim() === "") return "";
    const s = status.trim().toUpperCase();
    if (s === "SCHEDULE (TERCAPAI)" || s === "SCHEDULE") return "bg-green-100";
    return "bg-red-100";
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



  // TEMP DEBUGGING
  let debugUserDivisiIdRender: any = "Loading...";
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("userData");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        debugUserDivisiIdRender = p.id_divisi || "Undefined in LS";
      } catch { debugUserDivisiIdRender = "Error Parsing LS"; }
    } else {
      debugUserDivisiIdRender = "No userData in LS";
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
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
                  </div>
                </PopoverContent>
              </Popover>
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
        {/* Always Show Table */}
        <Card className="bg-card border-border">
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
                  {groupedTableData.map((prGroup) => (
                    <React.Fragment key={prGroup.id_PR}>
                      {/* For each PR Item group inside PR group */}
                      {prGroup.prItemGroups.map((prItemGroup) =>
                        prItemGroup.poGroups.map((poGroup) =>
                          poGroup.btbGroups.map((btbGroup) =>
                            btbGroup.items.map((item, idx) => {
                              // Find index of this item in prItemGroup.items (for PR Item rowSpan logic)
                              const prItemIdx = prItemGroup.items.indexOf(item);
                              // For PO rowSpan, only show on first item in PO group
                              const isFirstPO = poGroup.items.indexOf(item) === 0;
                              // For PR Item rowSpan, only show on first item in PR Item group
                              const isFirstPRItem = prItemIdx === 0;
                              // For PR rowSpan, only show on first item in PR group
                              const prIdx = prGroup.items.indexOf(item);
                              const isFirstPR = prIdx === 0;
                              // For BTB rowSpan, only show on first item in BTB group
                              const isFirstBTB = idx === 0;
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

                                  {/* No. MR */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                    {isFirstPR ? (
                                      <span className="font-bold text-black">
                                        {(item.noMR || "").toUpperCase()}
                                      </span>
                                    ) : null}
                                  </TableCell>
                                  {/* No. PR */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                    {isFirstPR ? (
                                      <span className="font-bold text-black">
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
                                    className={`px-3 py-1 border-b border-r border-gray-300 uppercase ${getStatusBg(item.status)}`}
                                  >
                                    <span>{(item.status || "").toUpperCase()}</span>
                                  </TableCell>
                                  {/* Skema PR */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 hidden uppercase align-top">
                                    {isFirstPR ? (
                                      typeof item.skemaPRLabel === "string"
                                        ? item.skemaPRLabel.toUpperCase()
                                        : item.skemaPRLabel ?? ""
                                    ) : null}
                                  </TableCell>
                                  {/* Periode PO */}

                                  {/* No. PO */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                    {isFirstPO ? (
                                      <span className="font-bold text-black">
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
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">{formatInt(item.quantityAwalPO)}</TableCell>
                                  {/* Satuan PO */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">
                                    {typeof item.satuanPO === "string"
                                      ? item.satuanPO.toUpperCase()
                                      : item.satuanPO ?? ""}
                                  </TableCell>
                                  {/* Harga Satuan PO */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 text-right uppercase">
                                    {item.hargaSatuanPO !== undefined && item.hargaSatuanPO !== null && item.hargaSatuanPO !== ""
                                      ? formatRupiahFull(item.hargaSatuanPO).toUpperCase()
                                      : ""}
                                  </TableCell>
                                  {/* Diskon (%) */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">{(item.diskonPersen || "").toUpperCase()}</TableCell>
                                  {/* Diskon (Rp) */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">{formatRupiahFull(item.diskonRp).toUpperCase()}</TableCell>
                                  {/* PPN (%) */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">{(item.ppnPersen || "").toUpperCase()}</TableCell>
                                  {/* PPN (Rp) */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">{formatRupiahFull(item.ppnRp).toUpperCase()}</TableCell>
                                  {/* Total Harga */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">{formatRupiahFull(item.totalHarga).toUpperCase()}</TableCell>
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
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">
                                    {typeof item.diinputOleh === "string"
                                      ? item.diinputOleh.replace(/_/g, " ").toUpperCase()
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
                                    className={`px-3 py-1 border-b border-r border-gray-300 ${getTargetPencapaianPoBg(item.targetPencapaianPO)} uppercase`}
                                  >
                                    <span className="text-black">{(item.targetPencapaianPO || "").toUpperCase()}</span>
                                  </TableCell>
                                  {/* Delay - Ungrouped / Per Row */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">
                                    {(item.delay || "").toUpperCase()}
                                  </TableCell>
                                  {/* Quantity PO */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">{formatInt(item.quantityPO)}</TableCell>
                                  {/* Skema PO */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 hidden uppercase align-top">
                                    {isFirstPO ? (item.skemaPO || "").toUpperCase() : null}
                                  </TableCell>
                                  {/* Periode BTB */}

                                  {/* No. BTB */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                    {isFirstBTB ? (
                                      <span className="font-bold text-black">
                                        {(item.noBTB || "").toUpperCase()}
                                      </span>
                                    ) : null}
                                  </TableCell>
                                  {/* Tanggal BTB */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                    {isFirstBTB ? (item.tanggalBTB || "").toUpperCase() : null}
                                  </TableCell>
                                  {/* Quantity BTB */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">{formatInt(item.quantityBTB)}</TableCell>
                                  {/* Satuan BTB */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">
                                    {typeof item.satuanBTB === "string"
                                      ? item.satuanBTB.toUpperCase()
                                      : item.satuanBTB ?? ""}
                                  </TableCell>
                                  {/* Biaya BTB */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">{formatRupiahFull(item.biayaBTB).toUpperCase()}</TableCell>
                                  {/* Sisa Stok BTB */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">{formatInt(item.sisaStokBTB)}</TableCell>
                                  {/* Diterima Oleh */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase align-top">
                                    {isFirstBTB ? (
                                      typeof item.diterimaOleh === "string"
                                        ? item.diterimaOleh.replace(/_/g, " ").toUpperCase()
                                        : item.diterimaOleh ?? ""
                                    ) : null}
                                  </TableCell>
                                  {/* Plan */}
                                  <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">
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

      </div>
    </MainLayout >
  );
}
