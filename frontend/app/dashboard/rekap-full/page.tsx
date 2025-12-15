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
  { key: "quantityPR", label: "Quantity Belum PR" },
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
  { key: "delay", label: "Delay" },
  { key: "quantityPO", label: "Quantity Belum PO" },
  { key: "skemaPO", label: "Skema PO" },
  { key: "periodeBTB", label: "Periode" },
  { key: "noBTB", label: "No. BTB" },
  { key: "tanggalBTB", label: "Tanggal Terima" },
  { key: "quantityBTB", label: "Quantity BTB" },
  { key: "satuanBTB", label: "Satuan BTB" }, // <-- Tambahkan kolom ini
  { key: "biayaBTB", label: "Biaya BTB" },
  { key: "sisaStokBTB", label: "Quantity Belum BTB" },
  { key: "diterimaOleh", label: "Diterima Oleh" },
  { key: "statusPermintaanByPR", label: "Status Permintaan By PR" }, // baru
  { key: "plan", label: "Plan" }, // baru
  { key: "noPlan", label: "No Plan" }, // baru
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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
            // Normalize id_PRItem
            const prItemId = String(item.id_PRItem || item.id_pritem || item.idPRItem || item.id);

            // Cari semua PO Items yang terkait dengan PR Item ini
            let poItemsForPRItem = poItemData.filter((poi: any) => {
              const poiPRItemId = String(poi.id_PRItem || poi.id_pritem || poi.idPRItem || "");
              return poiPRItemId === prItemId;
            });

            // FALLBACK: jika tidak ada, cocokkan nama barang
            if (poItemsForPRItem.length === 0) {
              poItemsForPRItem = poItemData.filter((poi: any) => {
                const poiName = (poi.namaBarang || "").toLowerCase().trim();
                const itemName = (item.namaBarang || "").toLowerCase().trim();
                return poiName === itemName;
              });
            }

            // Jika tidak ada PO sama sekali, tetap push satu baris (tanpa PO)
            if (poItemsForPRItem.length === 0) {
              rekapRows.push({
                id: pr.id_PR + "-" + idx,
                id_PR: pr.id_PR,
                periodePR: pr.tanggalPR ? `${getMonthName(pr.tanggalPR)} ${getYear(pr.tanggalPR)}` : "", // <-- Tambahkan baris ini
                tahunPR: getYear(pr.tanggalPR),
                bulanPR: getMonthName(pr.tanggalPR),
                noPR: pr.noPR,
                tanggalPR: (() => {
                  if (!pr.tanggalPR) return "";
                  const d = new Date(pr.tanggalPR);
                  return `${d.getDate().toString().padStart(2, "0")}-${(
                    d.getMonth() + 1
                  ).toString().padStart(2, "0")}-${d.getFullYear()}`;
                })(),
                hariPR: getDayName(pr.tanggalPR),
                daftarBarangPR: item.namaBarang,
                quantityAwalPR: item.quantityAwalPR,
                periodeBTB: "",
                quantityPR: item.jumlah,
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
                targetTanggalPO: pr.tanggalPR
                  ? (() => {
                      const d = new Date(pr.tanggalPR);
                      d.setDate(d.getDate() + 3);
                      return `${String(d.getDate()).padStart(
                        2,
                        "0"
                      )}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
                    })()
                  : "",
                delay:
                  pr.tanggalPR && po?.tanggalPO
                    ? countWorkingDaysBetween(pr.tanggalPR, po.tanggalPO) + " Days"
                    : "",
                status: pr.status ?? "",
                noPO: "",
                tanggalPO: "",
                periodePO: "",
                supplier: "",
                quantityAwalPO: "",
                satuanPO: "",
                diskonPersen: "",
                diskonRp: "",
                ppnPersen: "",
                ppnRp: "",
                totalHarga: "",
                tanggalEstimasiDiterima: "",
                statusPengiriman: "",
                diorderOleh: "",
                diinputOleh: "", // <-- Tambahkan di sini
                skemaPO: "",
                noBTB: "",
                tanggalBTB: "",
                periodeBTB: "",
                namaSupplierBTB: "",
                namaBarangBTB: "",
                quantityBTB: "",
                satuanBTB: item.id_satuan
                  ? satuanMap[String(item.id_satuan)] || ""
                  : "",
                sisaStokBTB: "",
                statusPermintaanByPR: "", // baru
                plan: "", // baru
                noPlan: "", // baru
                biayaBTB: "",
                diterimaOleh: "",
                skemaBTB: "",
              });
            } else {
              // Untuk setiap PO Item yang terkait, buat satu baris
              poItemsForPRItem.forEach((poItem: any) => {
                const po = poData.find((p: any) => String(p.id_PO || p.id) === String(poItem.id_PO || poItem.id));

                // Cari BTB Item dan BTB terkait
                let btbItemRow = null;
                let btbRow = null;
                if (poItem) {
                  const poItemId = String(poItem.id_POItem || poItem.id);

                  // Priority 1: Match by id_POItem
                  btbItemRow = btbItemData.find(
                    (bi: any) => String(bi.id_POItem || bi.idPOItem || "") === poItemId
                  );

                  // Priority 2 (Fallback): Match by item name + same supplier
                  if (!btbItemRow && po) {
                    const btbsForSupplier = btbData.filter(
                      (b: any) => String(b.id_supplier) === String(po.id_supplier)
                    );
                    for (const btb of btbsForSupplier) {
                      const matchingItem = btbItemData.find(
                        (bi: any) =>
                          String(bi.id_btb) === String(btb.id_btb) &&
                          bi.nama_barang &&
                          poItem.namaBarang &&
                          bi.nama_barang.toLowerCase().trim() ===
                            poItem.namaBarang.toLowerCase().trim()
                      );
                      if (matchingItem) {
                        btbItemRow = matchingItem;
                        btbRow = btb;
                        break;
                      }
                    }
                  }

                  // If btbItemRow is found, find related btbRow
                  if (btbItemRow && !btbRow) {
                    btbRow = btbData.find(
                      (b: any) => String(b.id_btb) === String(btbItemRow.id_btb)
                    );
                  }
                }

                rekapRows.push({
                  id: pr.id_PR + "-" + idx + "-" + (poItem.id_POItem || poItem.id || ""),
                  id_PR: pr.id_PR,
                  periodePR: pr.tanggalPR ? `${getMonthName(pr.tanggalPR)} ${getYear(pr.tanggalPR)}` : "",
                  tahunPR: getYear(pr.tanggalPR),
                  bulanPR: getMonthName(pr.tanggalPR),
                  noPR: pr.noPR,
                  tanggalPR: (() => {
                    if (!pr.tanggalPR) return "";
                    const d = new Date(pr.tanggalPR);
                    return `${d.getDate().toString().padStart(2, "0")}-${(
                      d.getMonth() + 1
                    ).toString().padStart(2, "0")}-${d.getFullYear()}`;
                  })(),
                  hariPR: getDayName(pr.tanggalPR),
                  daftarBarangPR: item.namaBarang,
                  quantityAwalPR: item.quantityAwalPR,
                  periodeBTB: btbRow?.tanggal_btb
                    ? `${getMonthName(btbRow.tanggal_btb)} ${getYear(btbRow.tanggal_btb)}`
                    : "",
                  quantityPR: item.jumlah,
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
                  targetTanggalPO: pr.tanggalPR
                    ? (() => {
                        const d = new Date(pr.tanggalPR);
                        d.setDate(d.getDate() + 3);
                        return `${String(d.getDate()).padStart(
                          2,
                          "0"
                        )}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
                      })()
                    : "",
                  delay:
                    pr.tanggalPR && po?.tanggalPO
                      ? countWorkingDaysBetween(pr.tanggalPR, po.tanggalPO) + " Days"
                      : "",
                  status: pr.status ?? "",
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
                          // dd-mm-yyyy
                          const [day, month, year] = po.tanggalPO.split("-");
                          d = new Date(`${year}-${month}-${day}`);
                        } else {
                          // yyyy-mm-dd atau format lain
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
satuanPO: poItem?.id_satuan

                    ? satuanMap[String(poItem.id_satuan)] || poItem.id_satuan
                    : item.id_satuan
                    ? satuanMap[String(item.id_satuan)] || item.id_satuan
                    : "",
                  hargaSatuanPO: poItem?.hargaSatuan ?? "", // <-- Tambahkan ini
                  diskonPersen:
                    poItem?.diskonPersen !== undefined && poItem?.diskonPersen !== null
                      ? (Number(poItem.diskonPersen) % 1 === 0
                          ? Number(poItem.diskonPersen).toString()
                          : Number(poItem.diskonPersen).toFixed(2)
                        ) + "%"
                      : "",
                  ppnPersen:
                    poItem?.ppnPersen !== undefined && poItem?.ppnPersen !== null
                      ? (Number(poItem.ppnPersen) % 1 === 0
                          ? Number(poItem.ppnPersen).toString()
                          : Number(poItem.ppnPersen).toFixed(2)
                        ) + "%"
                      : "",
                  diskonRp: po?.originalDiskon ?? "",
                  ppnRp: po?.ppnAmount ?? "",
                  totalHarga: po?.totalPembayaran ?? "",
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
                  diinputOleh: poItem?.namaPembeli ?? "", // <-- Ambil dari po_item.namaPembeli
                  skemaPO: po?.id_skema ? skemaMap[String(po.id_skema)] || "" : "",
                  noBTB: btbRow?.no_btb || "",
                  tanggalBTB: btbRow?.tanggal_btb
                    ? (() => {
                        const d = new Date(btbRow.tanggal_btb);
                        return `${d.getDate().toString().padStart(2, "0")}-${(
                          d.getMonth() + 1
                        ).toString().padStart(2, "0")}-${d.getFullYear()}`;
                      })()
                    : "",
                  periodeBTB: btbRow?.tanggal_btb
                    ? `${getMonthName(btbRow.tanggal_btb)} ${getYear(btbRow.tanggal_btb)}`
                    : "",
                  namaSupplierBTB: btbRow?.id_supplier
                    ? supplierMap[String(btbRow.id_supplier)] || ""
                    : "",
                  namaBarangBTB: btbItemRow?.nama_barang || "",
                  quantityBTB: btbItemRow?.jumlah_diterima ?? "",
                  satuanBTB: item.id_satuan
                    ? satuanMap[String(item.id_satuan)] || ""
                    : "",
                  sisaStokBTB: btbItemRow?.qty_sisa ?? "",
                  statusPermintaanByPR: "", // baru
                  plan: "", // baru
                  noPlan: "", // baru
                  biayaBTB: btbRow?.biaya ?? "",
                  diterimaOleh: btbRow?.id_user
                    ? userMap[String(btbRow.id_user)] || ""
                    : "",
                  skemaBTB: btbRow?.id_skema ? skemaMap[String(btbRow.id_skema)] || "" : "",
                });
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

  // Filtered data (bandingkan id skema, bukan label)
  const filteredData = sortRekapRows(
    rekapData.filter((row) => {
    // Filter skemaPR sesuai user login (bandingkan id)
    if (userSkemaId && String(row.skemaPR) !== userSkemaId) {
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

  // Pagination
  const pagedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
    // Helper: parse number or empty string
    function parseNumber(val: any) {
      if (val === undefined || val === null || val === "") return "";
      const num = Number(val);
      return Number.isNaN(num) ? "" : num;
    }

    // Group exportData by PR (Periode, No. PR, Tanggal PR, Hari, Divisi, Dibuat Oleh, Target Tanggal PO, Status)
    const groupKeys = [
      "periodePR",
      "noPR",
      "tanggalPR",
      "hariPR",
      "divisi",
      "dibuatOleh",
      "targetTanggalPO",
      "status"
    ];
    // Group rows by the above keys
    const grouped = {};
    exportData.forEach((row) => {
      const groupId = groupKeys.map((k) => row[k]).join("||");
      if (!grouped[groupId]) grouped[groupId] = [];
      grouped[groupId].push(row);
    });

    Object.values(grouped).forEach((rows) => {
      rows.forEach((row, idx) => {
        worksheet.addRow(
          columns.map((col) => {
            // If this column is a group column and not the first row in group, return empty string
            if (groupKeys.includes(col.key) && idx > 0) return "";
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
            // Format quantity (as number)
            if (
              [
                "quantityAwalPR",
                "quantityPR",
                "quantityPO",
                "quantityBTB",
                "sisaStokBTB",
                "quantityAwalPO",
              ].includes(col.key)
            ) {
              return parseNumber(row[col.key]);
            }
            // Format harga satuan, total, biaya, diskon, ppn (as number)
            if (
              [
                "hargaSatuanPO",
                "totalHarga",
                "biayaBTB",
                "diskonRp",
                "ppnRp",
              ].includes(col.key)
            ) {
              return parseNumber(row[col.key]);
            }
            // Format diskon persen, ppn persen (as number, not string with %)
            if (["diskonPersen", "ppnPersen"].includes(col.key)) {
              if (row[col.key] && typeof row[col.key] === "string") {
                const num = Number(row[col.key].replace("%", "").trim());
                return Number.isNaN(num) ? "" : num / 100;
              }
              return parseNumber(row[col.key]);
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
    });

    // Set Excel number format for relevant columns
    columns.forEach((col, idx) => {
      const colIdx = idx + 1;
      if (
        [
          "hargaSatuanPO",
          "totalHarga",
          "biayaBTB",
          "diskonRp",
          "ppnRp",
        ].includes(col.key)
      ) {
        worksheet.getColumn(colIdx).numFmt = '#,##0';
      }
      if (
        [
          "quantityAwalPR",
          "quantityPR",
          "quantityPO",
          "quantityBTB",
          "sisaStokBTB",
          "quantityAwalPO",
        ].includes(col.key)
      ) {
        worksheet.getColumn(colIdx).numFmt = '#,##0';
      }
      if (["diskonPersen", "ppnPersen"].includes(col.key)) {
        worksheet.getColumn(colIdx).numFmt = '0.00%';
      }
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
                    {/* Status */}
                    {isFirstPR ? (
                      <TableCell className="px-6 py-3 border-b border-r border-gray-300" rowSpan={prGroup.rowSpan}>
                        {item.status}
                      </TableCell>
                    ) : null}
                    {/* Sisa Quantity PR */}
                    <TableCell className="px-6 py-3 border-b border-r border-gray-300">{formatInt(item.quantityPR)}</TableCell>
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
                        {item.tanggalPO}
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
                        {item.tanggalEstimasiDiterima}
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
                    {/* Target Pencapaian PO */}
                    <TableCell className="px-6 py-3 border-b border-r border-gray-300">
                      {/* Biarkan kosong */}
                    </TableCell>
                    {/* Delay (tetap di posisi aslinya, setelah Status) */}
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
                    {/* Status Permintaan By PR */}
                    <TableCell className="px-6 py-3 border-b border-r border-gray-300">
                      {/* kosong */}
                    </TableCell>
                    {/* Plan */}
                    <TableCell className="px-6 py-3 border-b border-r border-gray-300">
                      {/* kosong */}
                    </TableCell>
                    {/* No Plan */}
                    <TableCell className="px-6 py-3 border-b border-r border-gray-300">
                      {/* kosong */}
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

// Tambahkan parser No. PR (E-WALK + PENTACITY)
function parseNoPR(noPR: string | null | undefined) {
  if (!noPR || typeof noPR !== "string") return null;
  const s = noPR.trim().toUpperCase();
  // PR/E-WALK/25/XI/001
  const regexEwalk = /^PR\/E-?WALK\/(\d{2})\/([IVXLCDM]{1,4})\/(\d{1,5})$/;
  // PR/PRQ/25/XI/00001
  const regexPenta = /^PR\/PRQ\/(\d{2})\/([IVXLCDM]{1,4})\/(\d{1,5})$/;

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

// Fungsi sorting rekapRows
function sortRekapRows(rows: any[]) {
  const allValid = rows.every(
    (row) => typeof row.noPR === "string" && parseNoPR(row.noPR)
  );
  if (allValid) {
    return [...rows].sort((a, b) => {
      const pa = parseNoPR(a.noPR)!;
      const pb = parseNoPR(b.noPR)!;
      if (pb.tahun !== pa.tahun) return pb.tahun - pa.tahun;
      if (pb.bulan !== pa.bulan) return pb.bulan - pa.bulan;
      return pb.urut - pa.urut;
    });
  }
  // Fallback: urutkan berdasarkan tanggal PR terbaru
  return [...rows].sort((a, b) => {
    const ta = a.tanggalPR ? a.tanggalPR.replace(/-/g, "") : "";
    const tb = b.tanggalPR ? b.tanggalPR.replace(/-/g, "") : "";
    return tb.localeCompare(ta);
  });
}
