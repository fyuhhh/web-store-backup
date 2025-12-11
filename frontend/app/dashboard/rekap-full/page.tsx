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
const columns = [
  { key: "periodePR", label: "Periode" },
  { key: "noPR", label: "No. PR" },
  { key: "tanggalPR", label: "Tanggal PR" },
  { key: "hariPR", label: "Hari PR" },
  { key: "daftarBarangPR", label: "Daftar Barang PR" },
  { key: "quantityAwalPR", label: "Quantity Awal PR" },
  { key: "satuanPR", label: "Satuan PR" },
  { key: "keteranganPR", label: "Keterangan PR" },
  { key: "divisi", label: "Divisi" },
  { key: "dibuatOleh", label: "Dibuat Oleh" },
  { key: "skemaPR", label: "Skema PR" },
  { key: "targetTanggalPO", label: "Target Tanggal PO" },
  { key: "status", label: "Status" }, // <-- Tambah kolom Status
  { key: "delay", label: "Delay" },
  { key: "quantityPR", label: "Sisa Quantity PR" }, // <-- Pindah ke sini
  { key: "periodePO", label: "Periode PO" }, // Tambahkan kolom "periode PO" di sini
  { key: "noPO", label: "No. PO" },
  { key: "tanggalPO", label: "Tanggal PO" },
  { key: "daftarBarangPO", label: "Daftar Barang PO" },
  { key: "quantityPO", label: "Quantity PO" },
  { key: "quantityAwalPO", label: "Quantity Awal PO" },
  { key: "satuanPO", label: "Satuan PO" },
  { key: "keteranganPO", label: "Keterangan PO" },
  { key: "diskonPersen", label: "Diskon (%)" },
  { key: "diskonRp", label: "Diskon (RP)" },
  { key: "ppnPersen", label: "PPN (%)" },
  { key: "ppnRp", label: "PPN (Rp)" },
  { key: "totalHarga", label: "Total Harga" },
  { key: "tanggalEstimasiDiterima", label: "Tanggal Estimasi Diterima" },
  { key: "statusPengiriman", label: "Status Pengiriman" },
  { key: "supplier", label: "Supplier" },
  { key: "diorderOleh", label: "Diorder Oleh" },
  { key: "skemaPO", label: "Skema PO" },
    { key: "periodeBTB", label: "Periode BTB" },
  { key: "noBTB", label: "No. BTB" },
  { key: "tanggalBTB", label: "Tanggal BTB" },
  { key: "namaSupplierBTB", label: "Nama Supplier BTB" },
  { key: "namaBarangBTB", label: "Nama Barang BTB" },
  { key: "quantityBTB", label: "Quantity BTB" },
  { key: "sisaStokBTB", label: "Sisa Stok BTB" },
  { key: "biayaBTB", label: "Biaya BTB" },
  { key: "diterimaOleh", label: "Diterima Oleh" },
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

          // Find PO Items related to this PR Item (priority: by id_PRItem)
          let poItemsForPRItem = poItemData.filter((poi: any) => {
            const poiPRItemId = String(poi.id_PRItem || poi.id_pritem || poi.idPRItem || "");
            return poiPRItemId === prItemId;
          });

          // FALLBACK: if no match, try to match by item name
          if (poItemsForPRItem.length === 0) {
            poItemsForPRItem = poItemData.filter((poi: any) => {
              const poiName = (poi.namaBarang || "").toLowerCase().trim();
              const itemName = (item.namaBarang || "").toLowerCase().trim();
              return poiName === itemName;
            });
          }

          // Find related PO (if any)
          const poItem = poItemsForPRItem[0] ?? null;
          const po = poItem
            ? poData.find((p: any) => String(p.id_PO || p.id) === String(poItem.id_PO || poItem.id))
            : null;

          // Find BTB Items related to PO Item
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
            id: pr.id_PR + "-" + idx,
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
              : "", // Period for BTB
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
            daftarBarangPO: poItem?.namaBarang || item.namaBarang || "",
            quantityPO: poItem?.jumlahPO ?? poItem?.jumlah ?? "",
            quantityAwalPO: poItem?.jumlahAsli ?? poItem?.originalJumlah ?? "",
            satuanPO: poItem?.id_satuan
              ? satuanMap[String(poItem.id_satuan)] || poItem.id_satuan
              : item.id_satuan
              ? satuanMap[String(item.id_satuan)] || item.id_satuan
              : "",
            keteranganPO: poItem?.keterangan ?? item.keterangan ?? "",
            diskonPersen: po?.diskon ?? "",
            diskonRp: po?.originalDiskon ?? "",
            ppnPersen: po?.ppn ?? "",
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
            supplier: po?.id_supplier
              ? supplierMap[String(po.id_supplier)] || ""
              : "",
            diorderOleh: po?.orderedBy
              ? userMap[String(po.orderedBy)] || ""
              : "",
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
              : "", // Period for BTB
            namaSupplierBTB: btbRow?.id_supplier
              ? supplierMap[String(btbRow.id_supplier)] || ""
              : "",
            namaBarangBTB: btbItemRow?.nama_barang || "",
            quantityBTB: btbItemRow?.jumlah_diterima ?? "",
            satuanBTB: btbItemRow?.id_satuan
              ? satuanMap[String(btbItemRow.id_satuan)] || ""
              : "",
            sisaStokBTB: btbItemRow?.qty_sisa ?? "",
            biayaBTB: btbRow?.biaya ?? "",
            diterimaOleh: btbRow?.id_user
              ? userMap[String(btbRow.id_user)] || ""
              : "",
            skemaBTB: btbRow?.id_skema ? skemaMap[String(btbRow.id_skema)] || "" : "",
          });
        });
      });

      setRekapData(groupRowsForTable(rekapRows));
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
  const filteredData = rekapData.filter((prGroup) => {
    // prGroup.main adalah baris utama PR
    const row = prGroup.main;
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
      ) ||
      prGroup.items.some((item) =>
        columns.some((col) =>
          String(item[col.key] ?? "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      );
    // Filter dropdown
    const matchesFilters = Object.entries(filters).every(([key, val]) => {
      if (!val || (Array.isArray(val) && val.length === 0)) return true;
      if (Array.isArray(val)) {
        return val.includes(row[key]) || prGroup.items.some((item) => val.includes(item[key]));
      }
      return (
        String(row[key] ?? "")
          .toLowerCase()
          .includes(String(val).toLowerCase()) ||
        prGroup.items.some((item) =>
          String(item[key] ?? "")
            .toLowerCase()
            .includes(String(val).toLowerCase())
        )
      );
    });
    return matchesSearch && matchesFilters;
  });

  // Log id_PR, skemaPR, skemaPRLabel yang tampil di rekap full
  useEffect(() => {
    if (userSkemaId) {
      console.log(
        "Filtered Rekap PRs (id_PR, skemaPR, skemaPRLabel):",
        filteredData.map((row) => ({
          id_PR: row.noPR,
          skemaPR: row.skemaPR,
          skemaPRLabel: row.skemaPRLabel,
        }))
      );
    }
  }, [filteredData, userSkemaId]);

  // Pagination
  const pagedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle filter change
  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

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

  // Group rekapRows by noPR, and keep items per PR
  function groupRowsForTable(rows: any[]) {
    const grouped: { [noPR: string]: any[] } = {};
    rows.forEach((row) => {
      const key = row.noPR;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });
    return Object.entries(grouped).map(([noPR, items]) => ({
      noPR,
      items,
      main: items[0], // Use first item for PR info
      rowSpan: items.length,
    }));
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
      {/* Existing Header Cells with Gray Borders between each column */}
      {columns.map((col) => (
        <TableHead key={col.key} className="text-left px-6 py-3 border-b border-r border-gray-300">
          {col.label}
        </TableHead>
      ))}
    </TableRow>
  </TableHeader>

  <TableBody>
    {pagedData.map((prGroup, prIdx) => {
      const items = prGroup.items;
      if (!items || items.length === 0) return null;
      return (
        <React.Fragment key={prGroup.noPR}>
          {items.map((item, idx) => (
            <TableRow key={`${prGroup.noPR}-item-${idx}`} className="hover:bg-gray-50 transition-colors">
            <TableCell className="px-6 py-3 border-b border-r border-gray-300">
  {prGroup.main.tanggalPR ? `${getMonthName(prGroup.main.tanggalPR)} ${getYear(prGroup.main.tanggalPR)}` : ""}
</TableCell>


              {/* Table Cells */}
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.noPR}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.tanggalPR}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.hariPR}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.daftarBarangPR}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300 text-right">{formatInt(item.quantityAwalPR)}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.satuanPR}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">
                <KeteranganPopover text={item.keteranganPR || ""} max={20} />
              </TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.divisi}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.dibuatOleh}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.skemaPRLabel}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.targetTanggalPO}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.status}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.delay}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{formatInt(item.quantityPR)}</TableCell>
           {/* Kolom Periode PO */}
<TableCell className="px-6 py-3 border-b border-r border-gray-300">
  {item.tanggalPO ? `${getMonthName(item.tanggalPO)} ${getYear(item.tanggalPO)}` : ""}
</TableCell>


              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.noPO}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.tanggalPO}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.daftarBarangPO}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{formatInt(item.quantityPO)}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{formatInt(item.quantityAwalPO)}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.satuanPO}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">
                <KeteranganPopover text={item.keteranganPO || ""} max={20} />
              </TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.diskonPersen}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{formatRupiahFull(item.diskonRp)}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.ppnPersen}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{formatRupiahFull(item.ppnRp)}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{formatRupiahFull(item.totalHarga)}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.tanggalEstimasiDiterima}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.statusPengiriman}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.supplier}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.diorderOleh}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.skemaPO}</TableCell>

              {/* New Column for No. BTB */}
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">
  {item.periodeBTB}
</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.noBTB}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.tanggalBTB}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.namaSupplierBTB}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.namaBarangBTB}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{formatInt(item.quantityBTB)}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{formatInt(item.sisaStokBTB)}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{formatRupiahFull(item.biayaBTB)}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.diterimaOleh}</TableCell>
              <TableCell className="px-6 py-3 border-b border-r border-gray-300">{item.skemaBTB}</TableCell>
            </TableRow>
          ))}
        </React.Fragment>
      );
    })}
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
