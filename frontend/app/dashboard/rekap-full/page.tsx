"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
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
  { key: "daftarBarangPR", label: "Daftar Barang PR" },
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
  { key: "tanggalEstimasiDiterima", label: "Tanggal Estimasi Diterima" },
  { key: "diorderOleh", label: "Diorder Oleh" },
  { key: "diinputOleh", label: "Diinput Oleh" },
  { key: "targetPencapaianPO", label: "Target Pencapaian PO" },
  { key: "delay", label: "Status" },
  { key: "quantityPO", label: "Quantity Belum PR" },
  { key: "skemaPO", label: "Skema PO" },
  { key: "periodeBTB", label: "Periode" },
  { key: "noBTB", label: "No. BTB" },
  { key: "tanggalBTB", label: "Tanggal Terima" },
  { key: "quantityBTB", label: "Quantity BTB" },
  { key: "satuanBTB", label: "Satuan BTB" }, // <-- Tambahkan kolom ini
  { key: "biayaBTB", label: "Biaya BTB" },
  { key: "sisaStokBTB", label: "Quantity Belum PO" },
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
        fetch("http://192.168.10.10:5000/api/pr").then((r) => r.json()),
        fetch("http://192.168.10.10:5000/api/pr-item").then((r) => r.json()),
        fetch("http://192.168.10.10:5000/api/po").then((r) => r.json()),
        fetch("http://192.168.10.10:5000/api/po-item").then((r) => r.json()),
        fetch("http://192.168.10.10:5000/api/btb").then((r) => r.json()),
        fetch("http://192.168.10.10:5000/api/btb-item").then((r) => r.json()),
        fetch("http://192.168.10.10:5000/api/bkb").then((r) => r.json()),
        fetch("http://192.168.10.10:5000/api/bkb-item").then((r) => r.json()),
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
        fetch("http://192.168.10.10:5000/api/supplier").then((r) => r.json()),
        fetch("http://192.168.10.10:5000/api/user").then((r) => r.json()),
        fetch("http://192.168.10.10:5000/api/skema").then((r) => r.json()),
        fetch("http://192.168.10.10:5000/api/status-pengiriman").then((r) =>
          r.json()
        ),
        fetch("http://192.168.10.10:5000/api/status-permintaan").then((r) =>
          r.json()
        ),
        fetch("http://192.168.10.10:5000/api/satuan").then((r) => r.json()),
        fetch("http://192.168.10.10:5000/api/divisi").then((r) => r.json()),
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
          fetch("http://192.168.10.10:5000/api/pr").then((r) => r.json()),
          fetch("http://192.168.10.10:5000/api/pr-item").then((r) => r.json()),
          fetch("http://192.168.10.10:5000/api/po").then((r) => r.json()),
          fetch("http://192.168.10.10:5000/api/po-item").then((r) => r.json()),
          fetch("http://192.168.10.10:5000/api/btb").then((r) => r.json()),
          fetch("http://192.168.10.10:5000/api/btb-item").then((r) => r.json()),
          fetch("http://192.168.10.10:5000/api/bkb").then((r) => r.json()),
          fetch("http://192.168.10.10:5000/api/bkb-item").then((r) => r.json()),
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
                status: pr.status ?? "", // <-- tetap pakai pr.status jika belum ada PO
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
                    delay: pr.tanggalPR && po?.tanggalPO
                      ? countWorkingDaysBetween(pr.tanggalPR, po.tanggalPO) + " Days"
                      : "",
                    status: po?.statusterima ?? pr.status ?? "", // <-- ambil dari po.statusterima
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
                    quantityPO: item.jumlah ?? "", // <-- ambil dari pr_item.jumlah
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
                      delay: btb?.delay ?? (pr.tanggalPR && po?.tanggalPO
                        ? countWorkingDaysBetween(pr.tanggalPR, po.tanggalPO) + " Days"
                        : ""),
                      status: po?.statusterima ?? pr.status ?? "", // <-- ambil dari po.statusterima
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
                      quantityPO: item.jumlah ?? "",
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
                      targetPencapaianPO: btb?.targetPencapaianPo ?? "",
                      // === BTB mapping end ===
                    });
                  });
                }
              });
            }
          });
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
          const tglStart = parseTanggalToDate(exportStartDate);
          const tglEnd = parseTanggalToDate(exportEndDate);
          if (!tglPR || !tglStart || !tglEnd) return false;
          if (tglPR < tglStart || tglPR > tglEnd) return false;
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
    return Object.entries(grouped).map(([id_PR, items]) => {
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
    const exportData = getExportData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rekap Full");

    // Header sesuai urutan tabel rekap full
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

    // Helper format tanggal ke dd-mm-yyyy
    function formatTanggalExcel(tgl: string, key?: string) {
      if (!tgl) return "";
      // Jika sudah dd-mm-yyyy, ubah ke Date dulu
      if (/^\d{2}-\d{2}-\d{4}$/.test(tgl)) {
        const [d, m, y] = tgl.split("-");
        let dateObj = new Date(`${y}-${m}-${d}`);
        if (key === "tanggalPO" || key === "tanggalEstimasiDiterima") {
          dateObj.setDate(dateObj.getDate() + 2);
          const day = String(dateObj.getDate()).padStart(2, "0");
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const year = dateObj.getFullYear();
          return `${day}-${month}-${year}`;
        }
        return tgl;
      }
      // Jika yyyy-mm-dd
      const [y, m, d] = tgl.split("-");
      if (y && m && d) {
        let dateObj = new Date(tgl);
        if (key === "tanggalPO" || key === "tanggalEstimasiDiterima") {
          dateObj.setDate(dateObj.getDate() + 2);
          const day = String(dateObj.getDate()).padStart(2, "0");
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const year = dateObj.getFullYear();
          return `${day}-${month}-${year}`;
        }
        return `${d}-${m}-${y}`;
      }
      return tgl;
    }
    // Helper format quantity
    function formatQtyExcel(val: any) {
      const num = Number(val);
      if (Number.isNaN(num)) return "";
      return num % 1 === 0 ? num.toString() : num.toString();
    }
    // Helper format rupiah
    function formatRupiahFull(val: any) {
      if (val === undefined || val === "" || isNaN(val)) return "";
      return "Rp. " + Number(val).toLocaleString("id-ID");
    }

    // Add data rows persis seperti tampilan tabel
    exportData.forEach((row) => {
      worksheet.addRow(
        columns.map((col) => {
          // Format tanggal
          if (
            [
              "tanggalPR",
              "tanggalPO",
              "tanggalEstimasiDiterima",
              "tanggalBTB",
              "tanggalBKB",
              "targetTanggalPO",
            ].includes(col.key)
          ) {
            return formatTanggalExcel(row[col.key], col.key);
          }
          // Format quantity
          if (
            [
              "quantityAwalPR",
              "quantityPR",
              "quantityPO",
              "quantityBTB",
              "sisaStokBTB",
              "quantityAwalPO", // <--- pastikan formatInt juga untuk kolom baru
            ].includes(col.key)
          ) {
            return formatInt(row[col.key]);
          }
          // Format rupiah
          if (
            ["biayaBTB", "totalHarga", "ppnRp", "diskonRp"].includes(col.key)
          ) {
            return formatRupiahFull(row[col.key]);
          }
          // Skema kolom: tampilkan label jika ada
          if (col.key === "skemaPR") {
            return row.skemaPRLabel ?? row.skemaPR ?? "";
          }
          if (col.key === "skemaPO") {
            return row.skemaPO ?? "";
          }
          if (col.key === "skemaBTB") {
            return row.skemaBTB ?? "";
          }
          if (col.key === "skemaBKB") {
            return row.skemaBKB ?? "";
          }
          // Keterangan: potong 20 karakter
          if (
            col.key === "keteranganPR" ||
            col.key === "keteranganPO" ||
            col.key === "keteranganBKB"
          ) {
            return typeof row[col.key] === "string" && row[col.key].length > 20
              ? row[col.key].slice(0, 20) + "..."
              : row[col.key];
          }
          return row[col.key];
        })
      );
    });

    // Autofit columns
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
    "SCHEDULE (Tercapai)",
    "Tidak Tercapai",
    "Custom..."
  ];

  // Opsi target pencapaian yang diizinkan (sesuai permintaan)
  const targetOptions = [
    "Tercapai",
    "Tidak Tercapai",
    "WakGeng",
    "Cihuyanjaymabar",
    "Custom...",
  ];

  // Handler klik kolom status: buka dropdown
  function handleStatusEditClick(item: any) {
    if (!item.noPO) return;
    setEditingStatusId(item.noPO);
    setEditingStatusValue(item.status || "");
    setCustomStatusInput("");
  }

  // Handler klik kolom target pencapaian: buka dropdown
  function handleTargetEditClick(item: any) {
    if (!item.noBTB) return;
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
    setEditingStatusId(item.noPO); // lock editing
    setEditingStatusLoading(true);
    try {
      // Cari id_PO dari noPO
      const poRes = await fetch("http://192.168.10.10:5000/api/po");
      const poList = await poRes.json();
      const po = poList.find((p: any) => String(p.noPO) === String(item.noPO));
      if (!po) {
        alert("PO tidak ditemukan");
        setEditingStatusId(null);
        setEditingStatusLoading(false);
        return;
      }
      // Update statusterima di backend
      await fetch(`http://192.168.10.10:5000/api/po/${po.id_PO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusterima: newStatus }),
      });
      // Update di frontend (refresh data)
      setRekapData((prev) =>
        prev.map((row) =>
          row.noPO === item.noPO ? { ...row, status: newStatus } : row
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
      setCustomTargetInput(item.targetPencapaianPO || ""); // isi dengan nilai lama jika ada
      return;
    }
    setEditingTargetValue(newTarget);
    setEditingTargetId(item.id);
    setEditingTargetLoading(true);
    try {
      const btbRes = await fetch("http://192.168.10.10:5000/api/btb");
      const btbList = await btbRes.json();
      const btb = btbList.find((b: any) => String(b.no_btb) === String(item.noBTB));
      if (!btb) {
        alert("BTB tidak ditemukan");
        setEditingTargetId(null);
        setEditingTargetLoading(false);
        return;
      }
      await fetch(`http://192.168.10.10:5000/api/btb/${btb.id_btb}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPencapaianPo: newTarget }),
      });
      setRekapData((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, targetPencapaianPO: newTarget } : row
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
      // Cari id_PO dari noPO
      const poRes = await fetch("http://192.168.10.10:5000/api/po");
      const poList = await poRes.json();
      const po = poList.find((p: any) => String(p.noPO) === String(item.noPO));
      if (!po) {
        alert("PO tidak ditemukan");
        setEditingStatusId(null);
        setEditingStatusLoading(false);
        return;
      }
      await fetch(`http://192.168.10.10:5000/api/po/${po.id_PO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusterima: customVal }),
      });
      setRekapData((prev) =>
        prev.map((row) =>
          row.noPO === item.noPO ? { ...row, status: customVal } : row
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
    try {
      const btbRes = await fetch("http://192.168.10.10:5000/api/btb");
      const btbList = await btbRes.json();
      const btb = btbList.find((b: any) => String(b.no_btb) === String(item.noBTB));
      if (!btb) {
        alert("BTB tidak ditemukan");
        setEditingTargetId(null);
        setEditingTargetLoading(false);
        return;
      }
      await fetch(`http://192.168.10.10:5000/api/btb/${btb.id_btb}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPencapaianPo: customVal }),
      });
      setRekapData((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, targetPencapaianPO: customVal } : row
        )
      );
    } catch (err) {
      alert("Gagal update Target Pencapaian PO");
    }
    setEditingTargetId(null);
    setEditingTargetLoading(false);
  }

  // Handler klik target pencapaian PO: update targetPencapaianPo di backend (BTB)
  async function handleTargetPencapaianClick(item: any) {
    // Hanya update jika ada id_btb dan targetPencapaianPO bukan "woke bos"
    if (!item.noBTB || !item.targetPencapaianPO || item.targetPencapaianPO === "woke bos") return;
    // id_btb bisa didapat dari item.noBTB dengan mencari di btbData, tapi di rekapRows sudah ada id_btb (dari BTB group)
    // Namun, pada item, id_btb tidak selalu ada, jadi kita cari dari btbData jika perlu
    let id_btb = null;
    if (item.noBTB) {
      // Cari id_btb dari rekapData yang punya noBTB sama
      const found = rekapData.find(r => r.noBTB === item.noBTB && r.id_PR === item.id_PR);
      if (found && found.id) {
        // id format: ...-...-...-id_btb
        const parts = String(found.id).split("-");
        id_btb = parts[parts.length - 1];
      }
    }
    if (!id_btb) return;
    setUpdatingTargetId(id_btb);
    try {
      await fetch(`http://192.168.10.10:5000/api/btb/${id_btb}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPencapaianPo: "woke bos" }),
      });
      setRekapData(prev =>
        prev.map(row =>
          row.noBTB === item.noBTB
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
    if (!status) return "bg-red-100";
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
    if (s === "SCHEDULE (TERCAPAI)") return "bg-green-100";
    if (s === "TIDAK TERCAPAI") return "bg-red-100";
    return "";
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
      const poRes = await fetch("http://192.168.10.10:5000/api/po");
      const poList = await poRes.json();
      const po = poList.find((p: any) => String(p.noPO) === String(item.noPO));
      if (!po) {
        alert("PO tidak ditemukan");
        setUpdatingStatusId(null);
        return;
      }
      // Update statusterima di backend
      await fetch(`http://192.168.10.10:5000/api/po/${po.id_PO}`, {
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
        {/* Tambahkan input tanggal PR di atas tabel */}
        <div className="flex items-center gap-2 mb-2">
          <Label className="text-sm font-medium">Rentang Tanggal Rekap:</Label>
          <Input
            type="date"
            value={exportStartDate}
            onChange={(e) => {
              setExportStartDate(e.target.value);
            }}
            className="w-[140px]"
            placeholder="Tanggal Mulai"
          />
          <span>-</span>
          <Input
            type="date"
            value={exportEndDate}
            onChange={(e) => {
              setExportEndDate(e.target.value);
            }}
            className="w-[140px]"
            placeholder="Tanggal Akhir"
          />
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
              <div className="overflow-x-auto">
                <Table className="border-collapse border border-gray-300 table-auto">
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead key={col.key} className="text-left px-6 py-3 border-b border-r border-gray-300">
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
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={prGroup.rowSpan}>
                                        {item.periodePR}
                                      </TableCell>
                                    ) : null}
                                    {/* No. PR */}
                                    {isFirstPR ? (
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={prGroup.rowSpan}>
                                        {item.noPR}
                                      </TableCell>
                                    ) : null}
                                    {/* Tanggal PR */}
                                    {isFirstPR ? (
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={prGroup.rowSpan}>
                                        {item.tanggalPR}
                                      </TableCell>
                                    ) : null}
                                    {/* Hari PR */}
                                    {isFirstPR ? (
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={prGroup.rowSpan}>
                                        {item.hariPR}
                                      </TableCell>
                                    ) : null}
                                    {/* Daftar Barang PR */}
                                    {isFirstPRItem ? (
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={prItemGroup.rowSpan}>
                                        {item.daftarBarangPR}
                                      </TableCell>
                                    ) : null}
                                    {/* Quantity Awal PR */}
                                    {isFirstPRItem ? (
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300 text-right" rowSpan={prItemGroup.rowSpan}>
                                        {formatInt(item.quantityAwalPR)}
                                      </TableCell>
                                    ) : null}
                                    {/* Satuan PR */}
                                    {isFirstPRItem ? (
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={prItemGroup.rowSpan}>
                                        {item.satuanPR}
                                      </TableCell>
                                    ) : null}
                                    {/* Keterangan PR */}
                                    {isFirstPRItem ? (
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={prItemGroup.rowSpan}>
                                        <KeteranganPopover text={item.keteranganPR || ""} max={20} />
                                      </TableCell>
                                    ) : null}
                                    {/* Divisi */}
                                    {isFirstPR ? (
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={prGroup.rowSpan}>
                                        {item.divisi}
                                      </TableCell>
                                    ) : null}
                                    {/* Dibuat Oleh */}
                                    {isFirstPR ? (
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={prGroup.rowSpan}>
                                        {item.dibuatOleh}
                                      </TableCell>
                                    ) : null}
                                    {/* Target Tanggal PO */}
                                    {isFirstPR ? (
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={prGroup.rowSpan}>
                                        {item.targetTanggalPO}
                                      </TableCell>
                                    ) : null}
                                    {/* Status (gabung per PR) */}
                                    {isFirstPR ? (
                                      <TableCell
                                        className={`px-6 py-3 border-b border-r border-gray-300 relative group ${isEditableRow ? "cursor-pointer" : ""} ${
                                          editingStatusId === item.noPO
                                            ? "bg-gray-200"
                                            : getStatusBg(item.status)
                                        }`}
                                        rowSpan={prGroup.rowSpan}
                                        onClick={isEditableRow ? () => handleStatusEditClick(item) : undefined}
                                        style={{ opacity: updatingStatusId === item.noPO ? 0.5 : 1 }}
                                        title={isEditableRow ? "Klik untuk edit status" : ""}
                                      >
                                        {isEditableRow && editingStatusId === item.noPO ? (
                                          editingStatusValue === "Custom..." ? (
                                            <form
                                              onSubmit={e => {
                                                e.preventDefault();
                                                handleCustomStatusSubmit(item);
                                              }}
                                              style={{ display: "flex", alignItems: "center", gap: 4 }}
                                            >
                                              <input
                                                autoFocus
                                                className="border rounded px-2 py-1 text-sm bg-white"
                                                placeholder="Isi status custom"
                                                value={customStatusInput}
                                                onChange={e => setCustomStatusInput(e.target.value)}
                                                onBlur={() => {
                                                  if (customStatusInput.trim()) {
                                                    handleCustomStatusSubmit(item);
                                                  } else {
                                                    setEditingStatusId(null);
                                                  }
                                                }}
                                                onKeyDown={e => {
                                                  if (e.key === "Escape") setEditingStatusId(null);
                                                }}
                                                disabled={editingStatusLoading}
                                              />
                                              <Button
                                                type="submit"
                                                size="sm"
                                                className="ml-1"
                                                disabled={editingStatusLoading || !customStatusInput.trim()}
                                              >
                                                Simpan
                                              </Button>
                                            </form>
                                          ) : (
                                            <div className="bg-gray-200 rounded w-fit">
                                              <Select
                                                value={editingStatusValue}
                                                onValueChange={(val) => handleStatusChange(val, item)}
                                                open
                                              >
                                                <SelectTrigger className="w-[180px] h-8 bg-gray-200 !bg-opacity-100">
                                                  <SelectValue placeholder="Pilih status" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-gray-200">
                                                  {statusOptions.map((opt) => (
                                                    <SelectItem key={opt} value={opt}>
                                                      {opt}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          )
                                        ) : (
                                          <span>{item.status}</span>
                                        )}
                                      </TableCell>
                                    ) : null}
                                    {/* Skema PR */}
                                    {isFirstPR ? (
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={prGroup.rowSpan}>
                                        {item.skemaPRLabel}
                                      </TableCell>
                                    ) : null}
                                    {/* Periode PO */}
                                    {isFirstPO ? (
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={poGroup.rowSpan}>
                                        {item.periodePO}
                                      </TableCell>
                                    ) : null}
                                    {/* No. PO */}
                                    {isFirstPO ? (
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={poGroup.rowSpan}>
                                        {item.noPO}
                                      </TableCell>
                                    ) : null}
                                    {/* Tanggal PO */}
                                    {isFirstPO ? (
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={poGroup.rowSpan}>
                                        {/* Hapus plusDays=1 */}
                                        {formatTanggalDisplay(item.tanggalPO)}
                                      </TableCell>
                                    ) : null}
                                    {/* Supplier */}
                                    {isFirstPO ? (
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={poGroup.rowSpan}>
                                        {item.supplier}
                                      </TableCell>
                                    ) : null}
                                    {/* Quantity Awal PO */}
                                    <TableCell className="px-6 py-3 border-b border-r border-gray-300">{formatInt(item.quantityAwalPO)}</TableCell>
                                    {/* Satuan PO */}
                                    <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.satuanPO}</TableCell>
                                    {/* Harga Satuan PO */}
                                    <TableCell className="px-6 py-3 border-b border-r border-gray-300 text-right">
                                      {item.hargaSatuanPO !== undefined && item.hargaSatuanPO !== null && item.hargaSatuanPO !== ""
                                        ? "Rp. " + Number(item.hargaSatuanPO).toLocaleString("id-ID")
                                        : ""}
                                    </TableCell>
                                    {/* Diskon (%) */}
                                    <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.diskonPersen}</TableCell>
                                    {/* Diskon (Rp) */}
                                    <TableCell className="px-6 py-3 border-b border-r border-gray-300">{formatRupiahFull(item.diskonRp)}</TableCell>
                                    {/* PPN (%) */}
                                    <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.ppnPersen}</TableCell>
                                    {/* PPN (Rp) */}
                                    <TableCell className="px-6 py-3 border-b border-r border-gray-300">{formatRupiahFull(item.ppnRp)}</TableCell>
                                    {/* Total Harga */}
                                    <TableCell className="px-6 py-3 border-b border-r border-gray-300">{formatRupiahFull(item.totalHarga)}</TableCell>
                                    {/* Status Pengiriman */}
                                    {isFirstPO ? (
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={poGroup.rowSpan}>
                                        {item.statusPengiriman}
                                      </TableCell>
                                    ) : null}
                                    {/* Tanggal Estimasi Diterima */}
                                    {isFirstPO ? (
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={poGroup.rowSpan}>
                                        {/* Hapus plusDays=1 */}
                                        {formatTanggalDisplay(item.tanggalEstimasiDiterima)}
                                      </TableCell>
                                    ) : null}
                                    {/* Diorder Oleh */}
                                    {isFirstPO ? (
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={poGroup.rowSpan}>
                                        {item.diorderOleh}
                                      </TableCell>
                                    ) : null}
                                    {/* Diinput Oleh */}
                                    <TableCell className="px-6 py-3 border-b border-r border-gray-300">
                                      {item.diinputOleh}
                                    </TableCell>
                                    {/* Target Pencapaian PO (gabung per BTB) */}
                                    {isFirstBTB ? (
                                      <TableCell
                                        className={`px-6 py-3 border-b border-r border-gray-300 ${getTargetPencapaianPoBg(item.targetPencapaianPO)} ${isEditableRow ? "cursor-pointer" : ""}`}
                                        rowSpan={btbGroup.rowSpan}
                                        onClick={isEditableRow ? () => handleTargetEditClick(item) : undefined}
                                        style={{
                                          opacity:
                                            updatingTargetId &&
                                            String(item.noBTB) &&
                                            rekapData.find(r => r.noBTB === item.noBTB && String(r.id).endsWith(updatingTargetId))
                                              ? 0.5
                                              : 1
                                        }}
                                        title={isEditableRow ? "Klik untuk update Target Pencapaian PO" : ""}
                                      >
                                        {isEditableRow && editingTargetId === item.id ? (
                                          editingTargetValue === "Custom..." ? (
                                            <form
                                              onSubmit={e => {
                                                e.preventDefault();
                                                handleCustomTargetSubmit(item);
                                              }}
                                              style={{ display: "flex", alignItems: "center", gap: 4 }}
                                            >
                                              <input
                                                autoFocus
                                                className="border rounded px-2 py-1 text-sm bg-white"
                                                placeholder="Isi target custom"
                                                value={customTargetInput}
                                                onChange={e => setCustomTargetInput(e.target.value)}
                                                onBlur={() => {
                                                  if (customTargetInput.trim()) {
                                                    handleCustomTargetSubmit(item);
                                                  } else {
                                                    setEditingTargetId(null);
                                                  }
                                                }}
                                                onKeyDown={e => {
                                                  if (e.key === "Escape") setEditingTargetId(null);
                                                }}
                                                disabled={editingTargetLoading}
                                              />
                                              <Button
                                                type="submit"
                                                size="sm"
                                                className="ml-1"
                                                disabled={editingTargetLoading || !customTargetInput.trim()}
                                              >
                                                Simpan
                                              </Button>
                                            </form>
                                          ) : (
                                            <div className="bg-gray-200 rounded w-fit">
                                              <Select
                                                value={editingTargetValue}
                                                onValueChange={(val) => handleTargetChange(val, item)}
                                                open
                                              >
                                                <SelectTrigger className="w-[180px] h-8 bg-gray-200 !bg-opacity-100">
                                                  <SelectValue placeholder="Pilih Target" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-gray-200">
                                                  {targetOptions.map((opt) => (
                                                    <SelectItem key={opt} value={opt}>
                                                      {opt}
                                                    </SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          )
                                        ) : (
                                          <span className="text-black">{item.targetPencapaianPO}</span>
                                        )}
                                      </TableCell>
                                    ) : null}
                                    {/* Delay (gabung per PR, setelah Status) */}
                                    {isFirstPR ? (
                                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={prGroup.rowSpan}>
                                        {item.delay}
                                      </TableCell>
                                    ) : null}
                  {/* Quantity PO */}
                  <TableCell className="px-6 py-3 border-b border-r border-gray-300">{formatInt(item.quantityPO)}</TableCell>
                  {/* Skema PO */}
                  {isFirstPO ? (
                    <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={poGroup.rowSpan}>
                      {item.skemaPO}
                    </TableCell>
                  ) : null}
                  {/* Periode BTB */}
                  {isFirstBTB ? (
                    <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={btbGroup.rowSpan}>
                      {item.periodeBTB}
                    </TableCell>
                  ) : null}
                  {/* No. BTB */}
                  {isFirstBTB ? (
                    <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={btbGroup.rowSpan}>
                      {item.noBTB}
                    </TableCell>
                  ) : null}
                  {/* Tanggal BTB */}
                  {isFirstBTB ? (
                    <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={btbGroup.rowSpan}>
                      {item.tanggalBTB}
                    </TableCell>
                  ) : null}
                  {/* Quantity BTB */}
                  <TableCell className="px-6 py-3 border-b border-r border-gray-300">{formatInt(item.quantityBTB)}</TableCell>
                  {/* Satuan BTB */}
                  <TableCell className="px-6 py-3 border-b border-r border-gray-300">
                    {item.satuanBTB}
                  </TableCell>
                  {/* Biaya BTB */}
                  <TableCell className="px-6 py-3 border-b border-r border-gray-300">{formatRupiahFull(item.biayaBTB)}</TableCell>
                  {/* Sisa Stok BTB */}
                  <TableCell className="px-6 py-3 border-b border-r border-gray-300">{formatInt(item.sisaStokBTB)}</TableCell>
                  {/* Diterima Oleh */}
                  {isFirstBTB ? (
                    <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={btbGroup.rowSpan}>
                      {item.diterimaOleh}
                    </TableCell>
                  ) : null}
                  {/* Plan */}
                  <TableCell className="px-6 py-3 border-b border-r border-gray-300">
                    {item.plan}
                  </TableCell>
                  {/* Skema BTB */}
                  {isFirstBTB ? (
                    <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={btbGroup.rowSpan}>
                      {item.skemaBTB}
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
    </MainLayout>
  );
}