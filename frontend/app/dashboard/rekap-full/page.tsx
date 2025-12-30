"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
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

import { ChevronDown } from "lucide-react";
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

import ExcelJS from "exceljs";

// Tambahkan helper untuk popover keterangan
import {
  Popover as HoverPopover,
  PopoverTrigger as HoverPopoverTrigger,
  PopoverContent as HoverPopoverContent,
} from "@/components/ui/popover";

// Kolom sesuai urutan permintaan (Periode, No. PR, dst)
// Kembalikan urutan kolom seperti sebelumnya, delay tetap kosong dan di posisi aslinya (setelah status)
const columns = [
  { key: "periodePR", label: "Periode" },
  { key: "noPR", label: "No. PR" },
  { key: "tanggalPR", label: "Tanggal PR" },
  { key: "hariPR", label: "Hari" },
  { key: "daftarBarangPR", label: "Daftar Barang" },
  { key: "quantityAwalPR", label: "Quantity PR" },
  { key: "satuanPR", label: "Satuan" },
  { key: "keteranganPR", label: "Keterangan" },
  { key: "divisi", label: "Divisi" },
  { key: "dibuatOleh", label: "Dibuat Oleh" },
  { key: "targetTanggalPO", label: "Target Tanggal PO" },
  { key: "status", label: "Status" },
  { key: "skemaPR", label: "Skema PR" },
  { key: "periodePO", label: "Periode" },
  { key: "noPO", label: "No. PO" },
  { key: "tanggalPO", label: "Tanggal PO" },
  { key: "supplier", label: "Nama Supplier" },
  { key: "quantityAwalPO", label: "Quantity PO" },
  { key: "satuanPO", label: "Satuan" },
  { key: "hargaSatuanPO", label: "Harga Satuan" },
  { key: "diskonPersen", label: "Diskon (%)" },
  { key: "diskonRp", label: "Diskon (RP)" },
  { key: "ppnPersen", label: "PPN (%)" },
  { key: "ppnRp", label: "PPN (Rp)" },
  { key: "totalHarga", label: "Total Harga" },
  { key: "statusPengiriman", label: "Status Pengiriman" },
  { key: "tanggalEstimasiDiterima", label: "Estimasi Diterima" },
  { key: "diorderOleh", label: "Diorder Oleh" },
  { key: "diinputOleh", label: "Diinput Oleh" },
  { key: "targetPencapaianPO", label: "Target Pencapaian PO" },
  { key: "delay", label: "Status" },
  { key: "quantityPO", label: "Quantity Belum PO" },
  { key: "skemaPO", label: "Skema PO" },
  { key: "periodeBTB", label: "Periode" },
  { key: "noBTB", label: "No. BTB" },
  { key: "tanggalBTB", label: "Tanggal Terima" },
  { key: "quantityBTB", label: "Quantity BTB" },
  { key: "satuanBTB", label: "Satuan BTB" }, // <-- Tambahkan kolom ini
  { key: "biayaBTB", label: "Biaya BTB" },
  { key: "sisaStokBTB", label: "Quantity Belum BTB" },
  { key: "diterimaOleh", label: "Diterima Oleh" },// baru
  { key: "plan", label: "Plan / No Plan" }, // baru
  { key: "skemaBTB", label: "Skema BTB" },
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

  return Number.isFinite(total) ? Math.round(total) : total;
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
        // Fetch PR data, PR Items, PO data, PO Items, BTB data, BTB Items, BKB data, BKB Items
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

        // Log the fetched data for verification
        console.log("Fetched PR Data:", prRes);
        console.log("Fetched PR Items Data:", prItemRes);
        console.log("Fetched PO Data:", poRes);
        console.log("Fetched PO Items Data:", poItemRes);
        console.log("Fetched BTB Data:", btbRes);
        console.log("Fetched BTB Items Data:", btbItemRes);
        console.log("Fetched BKB Data:", bkbRes);
        console.log("Fetched BKB Items Data:", bkbItemRes);

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

        prData.forEach((pr) => {
          const items = prItemData.filter((item: any) => item.id_PR === pr.id_PR);

          items.forEach((item: any, idx: number) => {
            const poItems = poItemData.filter((poi: any) => String(poi.id_PRItem) === String(item.id_PRItem));

            if (poItems.length === 0) {
              rekapRows.push({
                id: pr.id_PR + "-" + idx,
                id_PR: pr.id_PR,
                noPR: pr.noPR,
                // Add other fields...
              });

              // Log data for this PR item when no PO exists
              console.log("PR Item (No PO):", {
                prId: pr.id_PR,
                prNo: pr.noPR,
                prItem: item,
                // Other relevant fields
              });
            } else {
              poItems.forEach((poItem: any) => {
                const po = poData.find((p: any) => String(p.id_PO) === String(poItem.id_PO));

                // Log PO Item Data
                console.log("PO Item Data:", poItem);

                const btbItems = btbItemData.filter((bi: any) => String(bi.id_POItem) === String(poItem.id_POItem));

                if (btbItems.length === 0) {
                  rekapRows.push({
                    id: pr.id_PR + "-" + idx + "-" + (poItem.id_POItem || ""),
                    noPO: po?.noPO || "",
                    // Add other fields...
                  });

                  // Log data for this PR-PO Item pair when no BTB exists
                  console.log("PR-PO Item (No BTB):", {
                    prId: pr.id_PR,
                    prNo: pr.noPR,
                    poItem,
                    poNo: po?.noPO,
                    // Other relevant fields
                  });
                } else {
                  btbItems.forEach((btbItem: any) => {
                    const btb = btbData.find((b: any) => String(b.id_btb) === String(btbItem.id_btb));

                    // Log BTB Item Data
                    console.log("BTB Item Data:", btbItem);

                    rekapRows.push({
                      id: pr.id_PR + "-" + idx + "-" + (poItem.id_POItem || "") + "-" + (btbItem.id_btb || ""),
                      noBTB: btb?.no_btb || "",
                      // Add other fields...
                    });
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
          // Regex: \/(\d{2})\/([IVX]+)\/
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

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch PR data, PR Items, PO data, PO Items, BTB data, BTB Items, BKB data, BKB Items
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

        prData.forEach((pr) => {
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
                daftarBarangPR: item.namaBarang,
                quantityAwalPR: item.quantityAwalPR ?? item.jumlah ?? "",
                quantityPR: item.jumlah ?? "",
                satuanPR: item.id_satuan
                  ? satuanMap[String(item.id_satuan)] || item.id_satuan
                  : "",
                keteranganPR: item.keterangan || "",
                divisi: pr.id_divisi
                  ? divisiMap[String(pr.id_divisi)] || pr.id_divisi
                  : "",
                dibuatOleh: pr.dibuatOleh,
                skemaPR: pr.id_skema ?? "",
                skemaPRLabel: pr.id_skema
                  ? skemaMap[String(pr.id_skema)] || pr.id_skema
                  : "",
                targetTanggalPO: pr.estimasipo || "",
                delay: "",
                status:
                  pr.status &&
                    !["Menunggu", "Gantung", "Diproses"].includes(pr.status)
                    ? pr.status
                    : "", // <-- request user: jangan tampilkan status otomatis (Gantung/Menunggu) jika belum ada PO
                // PO & BTB kosong
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
                plan: pr.plan || "",
                noPlan: "",
                biayaBTB: "",
                diterimaOleh: "",
                skemaBTB: "",
                targetPencapaianPO: "", // <-- tambahkan kolom ini, kosong jika belum ada PO/BTB
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
                      ? satuanMap[String(item.id_satuan)] || item.id_satuan
                      : "",
                    keteranganPR: item.keterangan || "",
                    divisi: pr.id_divisi
                      ? divisiMap[String(pr.id_divisi)] || pr.id_divisi
                      : "",
                    dibuatOleh: pr.dibuatOleh,
                    skemaPR: pr.id_skema ?? "",
                    skemaPRLabel: pr.id_skema
                      ? skemaMap[String(pr.id_skema)] || pr.id_skema
                      : "",
                    targetTanggalPO: pr.estimasipo || "",
                    delay: "",
                    status: poItem?.statusTerima ?? po?.statusterima ?? pr.status ?? "", // <-- ambil dari item.statusTerima
                    id_POItem: poItem?.id_POItem || "", // <-- Pass item ID
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
                      ? supplierMap[String(po.id_supplier)] || ""
                      : "",
                    quantityAwalPO: poItem?.jumlahAsli ?? poItem?.originalJumlah ?? "",
                    quantityPO: poItem?.jumlahPO ?? poItem?.jumlah_po ?? "", // <-- ambil dari po_item.jumlahPO
                    satuanPO:
                      item.id_satuan
                        ? satuanMap[String(item.id_satuan)] || item.id_satuan
                        : "",
                    hargaSatuanPO: poItem?.hargaSatuan ?? "",
                    diskonPersen: poItem?.diskonPersen !== undefined && poItem?.diskonPersen !== null
                      ? (Number(poItem.diskonPersen) % 1 === 0
                        ? Number(poItem.diskonPersen).toString()
                        : Number(poItem.diskonPersen).toFixed(2)
                      ) + "%"
                      : "",
                    diskonRp: po?.originalDiskon ?? "",
                    ppnPersen: poItem?.ppnPersen !== undefined && poItem?.ppnPersen !== null
                      ? (Number(poItem.ppnPersen) % 1 === 0
                        ? Number(poItem.ppnPersen).toString()
                        : Number(poItem.ppnPersen).toFixed(2)
                      ) + "%"
                      : "",
                    ppnRp: po?.ppnAmount ?? "",
                    // total per item (hitung dari hargaSatuan & jumlah serta diskon/ppn di POItem)
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
                      ? statusPengirimanMap[String(po.id_statusPengiriman)] || ""
                      : "",
                    diorderOleh: po?.orderedBy
                      ? userMap[String(po.orderedBy)] || ""
                      : "",
                    diinputOleh: poItem?.namaPembeli ?? "",
                    skemaPO: po?.id_skema ? skemaMap[String(po.id_skema)] || "" : "",
                    // BTB kosong
                    noBTB: "",
                    tanggalBTB: "",
                    periodeBTB: "",
                    namaSupplierBTB: "",
                    namaBarangBTB: "",
                    quantityBTB: "",
                    satuanBTB: "",
                    sisaStokBTB: "",
                    statusPermintaanByPR: "",
                    plan: pr.plan || "",
                    noPlan: "",
                    biayaBTB: "",
                    diterimaOleh: "",
                    skemaBTB: "",
                    targetPencapaianPO: "", // <-- tetap kosong jika belum ada BTB
                    id_btb_item: "", // <-- No BTB item
                  });
                } else {
                  // Untuk setiap BTB Item yang terkait, cari BTB
                  btbItems.forEach((btbItem: any) => {
                    const btb = btbData.find((b: any) => String(b.id_btb) === String(btbItem.id_btb));

                    // Ambil langsung dari btb.targetPencapaianPo
                    rekapRows.push({
                      id: pr.id_PR + "-" + idx + "-" + (poItem.id_POItem || "") + "-" + (btbItem.id_btb || ""),
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
                      daftarBarangPR: item.namaBarang,
                      quantityAwalPR: item.quantityAwalPR ?? item.jumlah ?? "",
                      quantityPR: item.jumlah ?? "",
                      satuanPR: item.id_satuan
                        ? satuanMap[String(item.id_satuan)] || item.id_satuan
                        : "",
                      keteranganPR: item.keterangan || "",
                      divisi: pr.id_divisi
                        ? divisiMap[String(pr.id_divisi)] || pr.id_divisi
                        : "",
                      dibuatOleh: pr.dibuatOleh,
                      skemaPR: pr.id_skema ?? "",
                      skemaPRLabel: pr.id_skema
                        ? skemaMap[String(pr.id_skema)] || pr.id_skema
                        : "",
                      targetTanggalPO: pr.estimasipo || "",
                      delay: po?.estimasiTanggalTerima && btb?.tanggal_btb
                        ? (() => {
                          const days = countCalendarDaysBetween(po.estimasiTanggalTerima, btb.tanggal_btb);
                          return String(days);
                        })()
                        : "",
                      id_POItem: poItem.id_POItem, // <-- Penting untuk edit status (was missing)
                      status: (() => {
                        // 1. Prioritas: Status Item Manual (poItem.statusTerima)
                        if (poItem?.statusTerima) return poItem.statusTerima;

                        // 2. Jika tidak ada manual, hitung otomatis dari tanggal (jika lengkap)
                        if (pr.estimasipo && po?.tanggalPO) {
                          const delay = countWorkingDaysBetween(pr.estimasipo, po.tanggalPO);
                          return delay <= 0 ? "SCHEDULE" : "TIDAK TERCAPAI";
                        }

                        // 3. Fallback ke status level header / PR
                        return po?.statusterima ?? pr.status ?? "";
                      })(),
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
                        ? supplierMap[String(po.id_supplier)] || ""
                        : "",
                      quantityAwalPO: poItem?.jumlahAsli ?? poItem?.originalJumlah ?? "",
                      quantityPO: poItem?.jumlahPO ?? poItem?.jumlah_po ?? "",
                      satuanPO:
                        item.id_satuan
                          ? satuanMap[String(item.id_satuan)] || item.id_satuan
                          : "",
                      hargaSatuanPO: poItem?.hargaSatuan ?? "",
                      diskonPersen: poItem?.diskonPersen !== undefined && poItem?.diskonPersen !== null
                        ? (Number(poItem.diskonPersen) % 1 === 0
                          ? Number(poItem.diskonPersen).toString()
                          : Number(poItem.diskonPersen).toFixed(2)
                        ) + "%"
                        : "",
                      diskonRp: po?.originalDiskon ?? "",
                      ppnPersen: poItem?.ppnPersen !== undefined && poItem?.ppnPersen !== null
                        ? (Number(poItem.ppnPersen) % 1 === 0
                          ? Number(poItem.ppnPersen).toString()
                          : Number(poItem.ppnPersen).toFixed(2)
                        ) + "%"
                        : "",
                      ppnRp: po?.ppnAmount ?? "",
                      // total per item (hitung dari hargaSatuan & jumlah serta diskon/ppn di POItem)
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
                        ? statusPengirimanMap[String(po.id_statusPengiriman)] || ""
                        : "",
                      diorderOleh: po?.orderedBy
                        ? userMap[String(po.orderedBy)] || ""
                        : "",
                      diinputOleh: poItem?.namaPembeli ?? "",
                      skemaPO: po?.id_skema ? skemaMap[String(po.id_skema)] || "" : "",
                      // === BTB mapping start ===
                      noBTB: btb?.no_btb || "",
                      id_btb: btb?.id_btb || "", // <-- Add id_btb
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
                          ? satuanMap[String(btbItem.id_satuan)] || btbItem.id_satuan
                          : "",
                      biayaBTB: btbItem?.biaya ?? btb?.biaya ?? "",
                      sisaStokBTB: btbItem?.qty_sisa ?? "",
                      diterimaOleh: btb?.diterima_oleh
                        ? userMap[String(btb.diterima_oleh)] || btb.diterima_oleh
                        : "",
                      plan: pr.plan || "",
                      skemaBTB: btb?.id_skema
                        ? skemaMap[String(btb.id_skema)] || btb.id_skema
                        : "",
                      targetPencapaianPO: (() => {
                        // 1. Prioritas: Manual Item (btbItem.targetPencapaianPo)
                        if (btbItem?.targetPencapaianPo) return btbItem.targetPencapaianPo;

                        // 2. RETIRED: Fallback to Header (removed to avoid "Full Delivery" logic)

                        // 3. Hitung otomatis hanya jika BELUM ada manual dan tanggal lengkap
                        if (po?.estimasiTanggalTerima && btb?.tanggal_btb) {
                          const days = countCalendarDaysBetween(po.estimasiTanggalTerima, btb.tanggal_btb);
                          return days <= 0 ? "TERCAPAI" : "TIDAK TERCAPAI";
                        }

                        return "";
                      })(),
                      id_btb_item: btbItem?.id_btb_item || "", // <-- Pass btb item ID
                      // === BTB mapping end ===
                    });
                  });
                }
              });
            }
          });
        });

        // SORTING: TANGGAL PR (TERLAMA -> TERBARU) & NO PR (TERKECIL -> TERBESAR)
        // SORTING: NO PR (TERKECIL -> TERBESAR) & TANGGAL PR (TERLAMA -> TERBARU)
        // User request: "002, 004, 005" (Strict Numeric Sequence)
        rekapRows.sort((a, b) => {
          // 1. Prioritas Utama: Nomor PR (Sequence: Kecil ke Besar / 001 -> 002)
          const getSeq = (str: string) => {
            const match = (str || "").trim().match(/(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
          };
          const seqDiff = getSeq(a.noPR) - getSeq(b.noPR);
          if (seqDiff !== 0) return seqDiff;

          // 2. Prioritas Kedua: Tanggal PR (Periode: Terlama ke Terbaru)
          const dateA = a.tanggalPR ? new Date(a.tanggalPR).getTime() : 0;
          const dateB = b.tanggalPR ? new Date(b.tanggalPR).getTime() : 0;
          return dateA - dateB;
        });

        setRekapData(rekapRows); // <-- JANGAN groupRowsForTable di sini!
      } catch (err) {
        setRekapData([]);
      }
    }
    fetchData();

    // Ensure dependency array is up-to-date
  }, [
    supplierMap,
    userMap,
    skemaMap,
    statusPengirimanMap,
    statusPermintaanMap,
    satuanMap,
  ]);


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
    // Jika tanggal belum diisi, return []
    if (!exportStartDate || !exportEndDate) return [];
    return (
      rekapData.filter((row) => {
        // Filter skemaPR sesuai user login (bandingkan id)
        if (userSkemaId && String(row.skemaPR) !== userSkemaId) {
          return false;
        }
        // Filter tanggal PR
        if (row.tanggalPR) {
          const tglPR = parseTanggalToDate(row.tanggalPR);
          if (!tglPR || !exportStartDate || !exportEndDate) return false;
          // Bandingkan dengan exportStartDate/exportEndDate (Date)
          if (tglPR < exportStartDate || tglPR > exportEndDate) return false;
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
        // Regex: \/(\d{2})\/([IVX]+)\/
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
    // 1. Dapatkan data yang akan diexport (sudah difilter)
    const exportDataRaw = getExportData();

    // 2. Lakukan grouping persis seperti di tabel UI
    //    agar kita bisa melakukan merge cell (rowSpan) di Excel
    const groupedData = groupRowsForTable(exportDataRaw);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rekap Full");

    // 3. Header
    // Kita ambil label dari columns definition
    const headers = columns.map((col) => col.label);
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

              columns.forEach((col, colIdx) => {
                // Excel columns 1-indexed
                const excelColIdx = colIdx + 1;
                let val = rowDetail[col.key];

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
                    // Excel custom format for Rp
                    cell.numFmt = '_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)';
                  } else {
                    cell.value = val;
                  }
                }
                // 3. Dates -> They are already strings "DD-MM-YYYY" in rekapData.
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

            // Merge BTB Level columns
            // Columns: periodeBTB, noBTB, tanggalBTB, quantityBTB, satuanBTB, biayaBTB, sisaStokBTB, diterimaOleh, plan, skemaBTB
            // Cek key di columns definition
            if (btbGroup.rowSpan > 1) {
              const btbEndRow = btbStartRow + btbGroup.rowSpan - 1;
              // List key untuk BTB level
              const btbKeys = ["periodeBTB", "noBTB", "tanggalBTB", "quantityBTB", "satuanBTB", "biayaBTB", "sisaStokBTB", "diterimaOleh", "plan", "skemaBTB", "dikeluarkanOleh"];
              btbKeys.forEach(k => {
                const idx = columns.findIndex(c => c.key === k);
                if (idx >= 0) {
                  try {
                    worksheet.mergeCells(btbStartRow, idx + 1, btbEndRow, idx + 1);
                  } catch (e) { }
                }
              });
            }
          }); // end btbGroups

          // Merge PO Level columns
          // Columns: periodePO, noPO, tanggalPO, supplier, quantityAwalPO, satuanPO, hargaSatuanPO, diskonPersen, diskonRp, ppnPersen, ppnRp, totalHarga, statusPengiriman, tanggalEstimasiDiterima, diorderOleh, diinputOleh, targetPencapaianPO, delay, quantityPO, skemaPO
          if (poGroup.rowSpan > 1) {
            const poEndRow = poStartRow + poGroup.rowSpan - 1;
            const poKeys = ["periodePO", "noPO", "tanggalPO", "supplier", "quantityAwalPO", "satuanPO", "hargaSatuanPO", "diskonPersen", "diskonRp", "ppnPersen", "ppnRp", "totalHarga", "statusPengiriman", "tanggalEstimasiDiterima", "diorderOleh", "diinputOleh", "targetPencapaianPO", "delay", "quantityPO", "skemaPO"];
            poKeys.forEach(k => {
              const idx = columns.findIndex(c => c.key === k);
              if (idx >= 0) {
                try {
                  worksheet.mergeCells(poStartRow, idx + 1, poEndRow, idx + 1);
                } catch (e) { }
              }
            });
          }

        }); // end poGroups

        // Merge PR Item Level columns
        // Columns: daftarBarangPR, quantityAwalPR, satuanPR, keteranganPR
        if (prItemGroup.rowSpan > 1) {
          const prItemEndRow = prItemStartRow + prItemGroup.rowSpan - 1;
          const prItemKeys = ["daftarBarangPR", "quantityAwalPR", "satuanPR", "keteranganPR", "quantityPR"]; // quantityPR seems to represent Sisa Qty field in some contexts or current qty
          prItemKeys.forEach(k => {
            const idx = columns.findIndex(c => c.key === k);
            if (idx >= 0) {
              try {
                worksheet.mergeCells(prItemStartRow, idx + 1, prItemEndRow, idx + 1);
              } catch (e) { }
            }
          });
        }
      }); // end prItemGroups

      // Merge PR Level columns
      // Columns: periodePR, noPR, tanggalPR, hariPR, divisi, dibuatOleh, targetTanggalPO, status, skemaPR
      if (prGroup.rowSpan > 1) {
        const prEndRow = prStartRow + prGroup.rowSpan - 1;
        const prKeys = ["periodePR", "noPR", "tanggalPR", "hariPR", "divisi", "dibuatOleh", "targetTanggalPO", "status", "skemaPR"];
        prKeys.forEach(k => {
          const idx = columns.findIndex(c => c.key === k);
          if (idx >= 0) {
            try {
              worksheet.mergeCells(prStartRow, idx + 1, prEndRow, idx + 1);
            } catch (e) { }
          }
        });
      }

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
    columns.forEach((col, idx) => {
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

  // Opsi status yang diizinkan
  const statusOptions = [
    "SCHEDULE",
    "Tidak Tercapai",
    "Custom..."
  ];

  // Opsi target pencapaian yang diizinkan (sesuai permintaan)
  const targetOptions = [
    "Tercapai",
    "Tidak Tercapai",
    "WAITING DELIVERY",
    "WAITING PAYMENT",
    "Custom...",
  ];

  // Handler klik kolom status: buka dropdown
  function handleStatusEditClick(item: any) {
    if (!item.id_POItem) return;
    setEditingStatusId(item.id);
    setEditingStatusValue(item.status || "");
    setCustomStatusInput("");
  }

  // Handler klik kolom target pencapaian: buka dropdown
  function handleTargetEditClick(item: any) {
    if (!item.id_btb_item) return; // Use item ID check
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

      // Update statusTerima di po_item (backend)
      await fetch(`http://localhost:5000/api/po-item/${item.id_POItem}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusTerima: newStatus }),
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

    let targetId = item.id_btb_item; // Use item ID

    if (!targetId) {
      alert("BTB Item ID tidak ditemukan");
      setEditingTargetId(null);
      setEditingTargetLoading(false);
      return;
    }

    try {
      await fetch(`http://localhost:5000/api/btb-item/${targetId}`, {
        method: "PUT", // PUT for item update
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPencapaianPo: newTarget }),
      });
      // Update all rows with same id_btb_item
      setRekapData((prev) =>
        prev.map((row) =>
          row.id_btb_item === item.id_btb_item ? { ...row, targetPencapaianPO: newTarget } : row
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

      await fetch(`http://localhost:5000/api/po-item/${item.id_POItem}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusTerima: customVal }),
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
  // Handler submit custom target
  async function handleCustomTargetSubmit(item: any) {
    const customVal = customTargetInput.trim();
    if (!customVal) return;
    setEditingTargetLoading(true);

    let targetId = item.id_btb_item;

    if (!targetId) {
      alert("BTB Item ID tidak ditemukan");
      setEditingTargetId(null);
      setEditingTargetLoading(false);
      return;
    }

    try {
      await fetch(`http://localhost:5000/api/btb-item/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPencapaianPo: customVal }),
      });
      setRekapData((prev) =>
        prev.map((row) =>
          row.id_btb_item === item.id_btb_item ? { ...row, targetPencapaianPO: customVal } : row
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
      await fetch(`http://localhost:5000/api/btb-item/${item.id_btb_item}`, {
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
    if (!status) return "";
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
    if (!status) return "";
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
      const poRes = await fetch("http://localhost:5000/api/po");
      const poList = await poRes.json();
      const po = poList.find((p: any) => String(p.noPO) === String(item.noPO));
      if (!po) {
        alert("PO tidak ditemukan");
        setUpdatingStatusId(null);
        return;
      }
      // Update statusterima di backend
      await fetch(`http://localhost:5000/api/po/${po.id_PO}`, {
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
                  <SelectItem value="range">Rentang Tanggal Rekap</SelectItem>
                </SelectContent>
              </Select>
              {exportMode === "range" && (
                <div className="flex items-center gap-2 ml-2">
                  <Label className="text-xs font-medium">Tanggal PR</Label>
                  <DatePicker
                    selected={exportStartDate}
                    onChange={(date) => setExportStartDate(date)}
                    selectsStart
                    startDate={exportStartDate}
                    endDate={exportEndDate}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Mulai"
                    className="w-[110px] px-2 py-1 border rounded-md bg-white text-xs"
                    maxDate={exportEndDate || undefined}
                    isClearable
                  />
                  <span className="mx-1">-</span>
                  <DatePicker
                    selected={exportEndDate}
                    onChange={(date) => setExportEndDate(date)}
                    selectsEnd
                    startDate={exportStartDate}
                    endDate={exportEndDate}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Akhir"
                    className="w-[110px] px-2 py-1 border rounded-md bg-white text-xs"
                    minDate={exportStartDate || undefined}
                    isClearable
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
        {!exportStartDate || !exportEndDate ? (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Daftar Rekap Full</CardTitle>
              <CardDescription>

                Pilih rentang tanggal PR terlebih dahulu untuk menampilkan data.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
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
                                    className="hover:bg-gray-50 transition-colors"
                                  >
                                    {/* Periode PR */}
                                    {isFirstPR ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={prGroup.rowSpan}>
                                        {(item.periodePR || "").toUpperCase()}
                                      </TableCell>
                                    ) : null}
                                    {/* No. PR */}
                                    {isFirstPR ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={prGroup.rowSpan}>
                                        <span
                                          className="cursor-pointer text-blue-600 hover:underline"
                                          onClick={() => {
                                            if (item.noPR) {
                                              window.location.href = `/pr/monitoring?highlight=${encodeURIComponent(item.noPR)}`;
                                            }
                                          }}
                                        >
                                          {(item.noPR || "").toUpperCase()}
                                        </span>
                                      </TableCell>
                                    ) : null}
                                    {/* Tanggal PR */}
                                    {isFirstPR ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={prGroup.rowSpan}>
                                        {(item.tanggalPR || "").toUpperCase()}
                                      </TableCell>
                                    ) : null}
                                    {/* Hari PR */}
                                    {isFirstPR ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={prGroup.rowSpan}>
                                        {(item.hariPR || "").toUpperCase()}
                                      </TableCell>
                                    ) : null}
                                    {/* Daftar Barang PR */}
                                    {isFirstPRItem ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={prItemGroup.rowSpan}>
                                        {(item.daftarBarangPR || "").toUpperCase()}
                                      </TableCell>
                                    ) : null}
                                    {/* Quantity Awal PR */}
                                    {isFirstPRItem ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 text-right uppercase" rowSpan={prItemGroup.rowSpan}>
                                        {formatInt(item.quantityAwalPR)}
                                      </TableCell>
                                    ) : null}
                                    {/* Satuan PR */}
                                    {isFirstPRItem ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={prItemGroup.rowSpan}>
                                        {typeof item.satuanPR === "string"
                                          ? item.satuanPR.toUpperCase()
                                          : item.satuanPR ?? ""}
                                      </TableCell>
                                    ) : null}
                                    {/* Keterangan PR */}
                                    {isFirstPRItem ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={prItemGroup.rowSpan}>
                                        {/* KeteranganPopover sudah handle string, tambahkan .toUpperCase() */}
                                        <KeteranganPopover text={typeof item.keteranganPR === "string" ? item.keteranganPR.toUpperCase() : ""} max={20} />
                                      </TableCell>
                                    ) : null}
                                    {/* Divisi */}
                                    {isFirstPR ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={prGroup.rowSpan}>
                                        {typeof item.divisi === "string"
                                          ? item.divisi.toUpperCase()
                                          : item.divisi ?? ""}
                                      </TableCell>
                                    ) : null}
                                    {/* Dibuat Oleh */}
                                    {isFirstPR ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={prGroup.rowSpan}>
                                        {typeof item.dibuatOleh === "string"
                                          ? item.dibuatOleh.toUpperCase()
                                          : item.dibuatOleh ?? ""}
                                      </TableCell>
                                    ) : null}
                                    {/* Target Tanggal PO */}
                                    {isFirstPR ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={prGroup.rowSpan}>
                                        {typeof item.targetTanggalPO === "string"
                                          ? item.targetTanggalPO.toUpperCase()
                                          : item.targetTanggalPO ?? ""}
                                      </TableCell>
                                    ) : null}
                                    {/* Status */}
                                    {/* Status - Per Item */}
                                    <TableCell
                                      className={`px-3 py-1 border-b border-r border-gray-300 relative group uppercase cursor-pointer ${editingStatusId === item.id
                                        ? "bg-gray-200"
                                        : getStatusBg(item.status)
                                        }`}
                                      onClick={() => handleStatusEditClick(item)}
                                      style={{ opacity: editingStatusLoading && editingStatusId === item.id ? 0.5 : 1 }}
                                      title="Klik untuk edit status"
                                    >
                                      {editingStatusId === item.id ? (
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
                                                      {isActive && <span className="text-xs">✓</span>}
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
                                    {isFirstPO ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={poGroup.rowSpan}>
                                        {(item.periodePO || "").toUpperCase()}
                                      </TableCell>
                                    ) : null}
                                    {/* No. PO */}
                                    {isFirstPO ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={poGroup.rowSpan}>
                                        <span
                                          className="cursor-pointer text-blue-600 hover:underline"
                                          onClick={() => {
                                            if (item.noPO) {
                                              window.location.href = `/po/monitoring?highlight=${encodeURIComponent(item.noPO)}`;
                                            }
                                          }}
                                        >
                                          {(item.noPO || "").toUpperCase()}
                                        </span>
                                      </TableCell>
                                    ) : null}
                                    {/* Tanggal PO */}
                                    {isFirstPO ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={poGroup.rowSpan}>
                                        {formatTanggalDisplay(item.tanggalPO).toUpperCase()}
                                      </TableCell>
                                    ) : null}
                                    {/* Supplier */}
                                    {isFirstPO ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={poGroup.rowSpan}>
                                        {typeof item.supplier === "string"
                                          ? item.supplier.toUpperCase()
                                          : item.supplier ?? ""}
                                      </TableCell>
                                    ) : null}
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
                                        ? ("Rp. " + Number(item.hargaSatuanPO).toLocaleString("id-ID")).toUpperCase()
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
                                    {isFirstPO ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={poGroup.rowSpan}>
                                        {typeof item.statusPengiriman === "string"
                                          ? item.statusPengiriman.toUpperCase()
                                          : item.statusPengiriman ?? ""}
                                      </TableCell>
                                    ) : null}
                                    {/* Tanggal Estimasi Diterima */}
                                    {isFirstPO ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={poGroup.rowSpan}>
                                        {formatTanggalDisplay(item.tanggalEstimasiDiterima).toUpperCase()}
                                      </TableCell>
                                    ) : null}
                                    {/* Diorder Oleh */}
                                    {isFirstPO ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={poGroup.rowSpan}>
                                        {typeof item.diorderOleh === "string"
                                          ? item.diorderOleh.toUpperCase()
                                          : item.diorderOleh ?? ""}
                                      </TableCell>
                                    ) : null}
                                    {/* Diinput Oleh */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">
                                      {typeof item.diinputOleh === "string"
                                        ? item.diinputOleh.toUpperCase()
                                        : item.diinputOleh ?? ""}
                                    </TableCell>
                                    {/* Target Pencapaian PO */}
                                    <TableCell
                                      className={`px-3 py-1 border-b border-r border-gray-300 ${getTargetPencapaianPoBg(item.targetPencapaianPO)} cursor-pointer uppercase`}
                                      onClick={() => handleTargetEditClick(item)}
                                      style={{
                                        opacity:
                                          updatingTargetId &&
                                            String(item.noBTB) &&
                                            rekapData.find(r => r.noBTB === item.noBTB && String(r.id).endsWith(updatingTargetId))
                                            ? 0.5
                                            : 1
                                      }}
                                      title="Klik untuk update Target Pencapaian PO"
                                    >
                                      {editingTargetId === item.id ? (
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
                                                      {isActive && <span className="text-xs">✓</span>}
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
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">
                                      {(item.delay || "").toUpperCase()}
                                    </TableCell>
                                    {/* Quantity PO */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">{formatInt(item.quantityPO)}</TableCell>
                                    {/* Skema PO */}
                                    {isFirstPO ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 hidden uppercase" rowSpan={poGroup.rowSpan}>
                                        {(item.skemaPO || "").toUpperCase()}
                                      </TableCell>
                                    ) : null}
                                    {/* Periode BTB */}
                                    {isFirstBTB ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={btbGroup.rowSpan}>
                                        {(item.periodeBTB || "").toUpperCase()}
                                      </TableCell>
                                    ) : null}
                                    {/* No. BTB */}
                                    {isFirstBTB ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={btbGroup.rowSpan}>
                                        <span
                                          className="cursor-pointer text-blue-600 hover:underline"
                                          onClick={() => {
                                            if (item.noBTB) {
                                              window.location.href = `/btb/monitoring?highlight=${encodeURIComponent(item.noBTB)}`;
                                            }
                                          }}
                                        >
                                          {(item.noBTB || "").toUpperCase()}
                                        </span>
                                      </TableCell>
                                    ) : null}
                                    {/* Tanggal BTB */}
                                    {isFirstBTB ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={btbGroup.rowSpan}>
                                        {(item.tanggalBTB || "").toUpperCase()}
                                      </TableCell>
                                    ) : null}
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
                                    {isFirstBTB ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase" rowSpan={btbGroup.rowSpan}>
                                        {typeof item.diterimaOleh === "string"
                                          ? item.diterimaOleh.toUpperCase()
                                          : item.diterimaOleh ?? ""}
                                      </TableCell>
                                    ) : null}
                                    {/* Plan */}
                                    <TableCell className="px-3 py-1 border-b border-r border-gray-300 uppercase">
                                      {typeof item.plan === "string"
                                        ? item.plan.toUpperCase()
                                        : item.plan ?? ""}
                                    </TableCell>
                                    {/* Skema BTB */}
                                    {isFirstBTB ? (
                                      <TableCell className="px-3 py-1 border-b border-r border-gray-300 hidden uppercase" rowSpan={btbGroup.rowSpan}>
                                        {typeof item.skemaBTB === "string"
                                          ? item.skemaBTB.toUpperCase()
                                          : item.skemaBTB ?? ""}
                                      </TableCell>
                                    ) : null}
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