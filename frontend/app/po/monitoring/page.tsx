"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
// Tambahkan import react-datepicker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Import exceljs for Excel export with style support
import * as ExcelJS from "exceljs";

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

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import { Badge } from "@/components/ui/badge";
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
  Plus,
  Edit,
  Trash2,
import { useSearchParams } from "next/navigation";
Download,
  ChevronDown,
} from "lucide-react";

import { type POData, type PRData } from "@/lib/dummy-data";
import { truncateText } from "@/lib/utils";
function formatTanggal(tgl: string) {
  if (!tgl) return "";
  // Tampilkan tanggal asli tanpa modifikasi
  let dateObj = dayjs(tgl);
  if (!dateObj.isValid() && /^\d{2}-\d{2}-\d{4}$/.test(tgl)) {
    const [d, m, y] = tgl.split("-");
    dateObj = dayjs(`${y}-${m}-${d}`);
  }
  if (dateObj.isValid()) {
    return dateObj.format("DD-MM-YYYY");
  }
  return tgl ?? "";
}


// Tambahkan kembali fungsi sortPOList
function parseNoPO(noPO: string | null | undefined) {
  if (!noPO || typeof noPO !== "string") return { year: 0, month: 0, urut: 0 };
  const s = noPO.trim().toUpperCase();

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

// Tambahkan parseNoPR untuk sorting
function parseNoPR(noPR: string | null | undefined) {
  if (!noPR || typeof noPR !== "string") return { year: 0, month: 0, urut: 0 };
  const s = noPR.trim().toUpperCase();

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

function sortPOList(filteredPOData: any[]) {
  return [...filteredPOData].sort((a, b) => {
    const pa = parseNoPO(a.noPO);
    const pb = parseNoPO(b.noPO);

    // 1. Sort by Year (ASC)
    if (pa.year !== pb.year) return pa.year - pb.year;
    // 2. Sort by Month (ASC)
    if (pa.month !== pb.month) return pa.month - pb.month;
    // 3. Sort by Sequence (ASC)
    return pa.urut - pb.urut;
  });
}

export default function MonitoringPOPage() {
  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight");

  const [poData, setPoData] = useState<POData[]>([]);
  const [prData, setPrData] = useState<PRData[]>([]);
  const [selectedPOs, setSelectedPOs] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  // Filter states
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);

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

  useEffect(() => {
    if (highlight && poData.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(highlight);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
    }
  }, [highlight, poData]);

  const [filterNamaBarang, setFilterNamaBarang] = useState("");
  const [filterQtyMin, setFilterQtyMin] = useState<number | "">("");
  const [filterQtyMax, setFilterQtyMax] = useState<number | "">("");
  const [filterSatuan, setFilterSatuan] = useState<string[]>([]);
  const [satuanSearchTerm, setSatuanSearchTerm] = useState("");
  const [filterKeterangan, setFilterKeterangan] = useState("");
  const [filterHargaSatuanMin, setFilterHargaSatuanMin] = useState<number | "">(
    ""
  );
  const [filterHargaSatuanMax, setFilterHargaSatuanMax] = useState<number | "">(
    ""
  );
  const [filterTotalMin, setFilterTotalMin] = useState<number | "">("");
  const [filterTotalMax, setFilterTotalMax] = useState<number | "">("");
  const [filterTanggalPO, setFilterTanggalPO] = useState<string[]>([]);
  const [tanggalPOSearchTerm, setTanggalPOSearchTerm] = useState("");
  const [filterEstimasiDiterima, setFilterEstimasiDiterima] = useState<
    string[]
  >([]);
  const [estimasiDiterimaSearchTerm, setEstimasiDiterimaSearchTerm] =
    useState("");
  const [filterSupplier, setFilterSupplier] = useState<string[]>([]);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [filterKode, setFilterKode] = useState<string[]>([]);
  const [kodeSearchTerm, setKodeSearchTerm] = useState("");
  const [filterStatusPengiriman, setFilterStatusPengiriman] = useState<
    string[]
  >([]);
  const [statusPengirimanSearchTerm, setStatusPengirimanSearchTerm] =
    useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [statusSearchTerm, setStatusSearchTerm] = useState("");
  const [filterDiorderOleh, setFilterDiorderOleh] = useState<string[]>([]);
  const [diorderOlehSearchTerm, setDiorderOlehSearchTerm] = useState("");
  const [skemaSearchTerm, setSkemaSearchTerm] = useState("");
  const [filterSkema, setFilterSkema] = useState<string[]>([]);

  // Pagination states
  // Pagination removed
  // const [currentPage, setCurrentPage] = useState(1);
  // const [itemsPerPage] = useState(10);
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

  // User schema state
  const [userSkema, setUserSkema] = useState<string>("");
  const [userSkemaId, setUserSkemaId] = useState<string>("");
  const [skemaMap, setSkemaMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [
        poRes,
        poItemRes,
        prItemRes,
        prRes,
        supRes,
        statusPermintaanRes,
        statusPengirimanRes,
        skemaRes,
        userRes, // <-- tambahkan fetch user
      ] = await Promise.all([
        fetch("http://localhost:5000/api/po"),
        fetch("http://localhost:5000/api/po-item"),
        fetch("http://localhost:5000/api/pr-item"),
        fetch("http://localhost:5000/api/pr"),
        fetch("http://localhost:5000/api/supplier"),
        fetch("http://localhost:5000/api/status-permintaan"),
        fetch("http://localhost:5000/api/status-pengiriman"),
        fetch("http://localhost:5000/api/skema"),
        fetch("http://localhost:5000/api/user"), // <-- fetch user
      ]);

      const [
        poList,
        poItemList,
        prItemList,
        prList,
        supplierList,
        statusPermintaanList,
        statusPengirimanList,
        skemaList,
        userList, // <-- userList
      ] = await Promise.all([
        poRes.json(),
        poItemRes.json(),
        prItemRes.json(),
        prRes.json(),
        supRes.json(),
        statusPermintaanRes.json(),
        statusPengirimanRes.json(),
        skemaRes.json(),
        userRes.json(), // <-- userList
      ]);

      // LOG: Data PO raw dari backend
      console.log("PO RAW dari backend:", poList);

      // Build helper maps
      const prMap = Object.fromEntries(
        prList.map((p: any) => [String(p.id_PR), p.noPR])
      );
      const prItemMap = Object.fromEntries(
        prItemList.map((pi: any) => [String(pi.id_PRItem), pi])
      );
      const supplierMap = Object.fromEntries(
        supplierList.map((s: any) => [String(s.id_supplier), s.namaSupplier])
      );
      const statusPermintaanMap = Object.fromEntries(
        statusPermintaanList.map((s: any) => [
          String(s.id_statusPermintaan),
          s.status_permintaan,
        ])
      );
      const statusPengirimanMap = Object.fromEntries(
        statusPengirimanList.map((s: any) => [
          String(s.id_statusPengiriman),
          s.status_pengiriman,
        ])
      );
      const skemaMapObj = Object.fromEntries(
        skemaList.map((s: any) => [String(s.id_skema), s.skema])
      );
      setSkemaMap(skemaMapObj);
      const userMap = Object.fromEntries(
        userList.map((u: any) => [String(u.id_user), u.nama_pengguna])
      );

      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      const userSkemaVal = userData.skema || "";
      const userSkemaIdVal = String(userData.id_skema ?? userData.skema ?? "");
      setUserSkema(userSkemaVal);
      setUserSkemaId(userSkemaIdVal);

      // Helper to normalize dates:
      const toISOFromPossibleDDMMYYYY = (val: any) => {
        if (!val) return "";
        if (typeof val !== "string") return String(val);
        const parts = val.split("-");
        if (parts.length === 3 && parts[0].length === 2) {
          // dd-mm-yyyy -> yyyy-mm-dd
          return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(
            2,
            "0"
          )}`;
        }
        return val;
      };

      // Map each PO
      const mappedPOs = (poList || []).map((po: any) => {
        // --- LOG: tipe dan isi tanggal dari backend ---
        console.log(
          `[MONITORING PO] typeof tanggalPO:`,
          typeof po.tanggalPO,
          "| value:",
          po.tanggalPO,
          "| typeof estimasiTanggalTerima:",
          typeof po.estimasiTanggalTerima,
          "| value:",
          po.estimasiTanggalTerima
        );
        // --- LOG: tanggal raw dari backend ---
        console.log(
          `[MONITORING PO] Tanggal PO raw:`,
          po.tanggalPO,
          "| Estimasi Diterima raw:",
          po.estimasiTanggalTerima
        );
        // --- LOG: tanggal yang akan ditampilkan di frontend ---
        console.log(
          `[MONITORING PO] Tanggal PO tampil:`,
          formatTanggal(po.tanggalPO),
          "| Estimasi Diterima tampil:",
          formatTanggal(po.estimasiTanggalTerima)
        );

        // ISO for range filtering
        const prMap = Object.fromEntries(
          prList.map((p: any) => [String(p.id_PR), p.noPR])
        );
        const prItemMap = Object.fromEntries(
          prItemList.map((pi: any) => [String(pi.id_PRItem), pi])
        );
        const supplierMap = Object.fromEntries(
          supplierList.map((s: any) => [String(s.id_supplier), s.namaSupplier])
        );
        const statusPermintaanMap = Object.fromEntries(
          statusPermintaanList.map((s: any) => [
            String(s.id_statusPermintaan),
            s.status_permintaan,
          ])
        );
        const statusPengirimanMap = Object.fromEntries(
          statusPengirimanList.map((s: any) => [
            String(s.id_statusPengiriman),
            s.status_pengiriman,
          ])
        );
        const skemaMap = Object.fromEntries(
          skemaList.map((s: any) => [String(s.id_skema), s.skema])
        );

        // --- TAMBAHAN: Map Tanggal PR untuk sorting Group ---
        const prDateMap = Object.fromEntries(
          prList.map((p: any) => [String(p.id_PR), p.tanggalPR])
        );

        // Group items by PR (noPR)
        const itemsForPO = (poItemList || []).filter(
          (pi: any) => String(pi.id_PO) === String(po.id_PO || po.id)
        );
        const poItemsGrouped: any[] = [];
        const groupMap: Record<string, number> = {};

        itemsForPO.forEach((pi: any) => {
          const prItem = prItemMap[String(pi.id_PRItem)] || {};
          const prId = String(prItem.id_PR || prItem.id_pr || pi.id_PR || "");
          const noPR = prMap[prId] || prItem.noPR || prItem.id_PR || "";
          const item = {
            // --- mapping id_POItem asli dari backend ---
            id_POItem: pi.id_POItem, // <-- ini id yang dipakai untuk hapus
            id_PRItem: prItem.id_PRItem ?? prItem.id ?? pi.id_PRItem ?? null,
            namaBarang: prItem.namaBarang ?? prItem.namabarang ?? "",
            // --- Ubah: Quantity PO ambil dari jumlahAsli ---
            jumlahPO: Number(pi.jumlahAsli) || Number(pi.jumlah) || 0,
            jumlahAsli: Number(pi.jumlahAsli) || Number(pi.jumlah) || 0,
            satuan:
              prItem.satuanLabel || prItem.satuan || prItem.id_satuan || "",
            hargaSatuan: Number(pi.hargaSatuan) || 0,
            keterangan: pi.keterangan || prItem.keterangan || "",
            // --- Ambil field diskon/ppn dari kolom baru backend ---
            diskonPersen: pi.diskonPersen ?? 0, // Diskon (%) dari po_item
            diskonNominal: pi.diskonRupiah ?? 0, // Diskon (Rp) dari po_item
            ppnItem: pi.ppnPersen ?? 0, // PPN (%) dari po_item
            ppnAmount: pi.ppnRupiah ?? 0, // PPN (Rp) dari po_item
            // --- Tambahkan mapping totalPerItem dari backend ---
            totalPerItem:
              typeof pi.totalPerItem !== "undefined" && pi.totalPerItem !== null
                ? Number(pi.totalPerItem)
                : undefined,
            // --- TAMBAHAN: mapping namaPembeli dari po_item ---
            namaPembeli: pi.namaPembeli ?? "",
          };
          const key = String(noPR || prId || "__noPR__");
          if (groupMap[key] === undefined) {
            groupMap[key] = poItemsGrouped.length;
            poItemsGrouped.push({
              prId: prId || "",
              noPR: key,
              items: [item],
            });
          } else {
            poItemsGrouped[groupMap[key]].items.push(item);
          }
        });

        // --- SORTING GROUP: Berdasarkan No PR (ASC) agar urut sesuai input ---
        poItemsGrouped.sort((a, b) => {
          const pa = parseNoPR(a.noPR);
          const pb = parseNoPR(b.noPR);

          if (pa.year !== pb.year) return pa.year - pb.year;
          if (pa.month !== pb.month) return pa.month - pb.month;
          return pa.urut - pb.urut;
        });

        // --- SORTING ITEM dalam Group: Berdasarkan ID Item (ASC) ---
        // Agar "Barang 2, Kotak 2, Kotak 3" tidak acak
        poItemsGrouped.forEach((group) => {
          group.items.sort(
            (a: any, b: any) => Number(a.id_PRItem ?? 0) - Number(b.id_PRItem ?? 0)
          );
        });

        // Build labels using maps (prefer label maps, fallback to existing fields)
        const statusPermintaanLabel =
          statusPermintaanMap[String(po.id_statusPermintaan)] ||
          po.statusPermintaan ||
          String(po.id_statusPermintaan || "");
        const statusPengirimanLabel =
          statusPengirimanMap[String(po.id_statusPengiriman)] ||
          po.statusPengiriman ||
          String(po.id_statusPengiriman || "");

        // Ambil nama user dari userMap berdasarkan orderedBy (id_user)
        const orderedByName =
          userMap[String(po.orderedBy)] || po.orderedBy || po.dipesanOleh || "";

        return {
          id: po.id_PO ?? po.id,
          noPO: po.noPO ?? "",
          tanggalPO: po.tanggalPO ?? "", // simpan mentah dari backend
          estimasiTanggalTerima: po.estimasiTanggalTerima ?? "",
          supplier:
            supplierMap[String(po.id_supplier)] ||
            po.supplier ||
            String(po.id_supplier || ""),
          poItems: poItemsGrouped,
          totalPembayaran: Number(po.totalPembayaran) || 0,
          statusPermintaan: statusPermintaanLabel,
          statusPengiriman: statusPengirimanLabel,
          status: po.status ?? "Menunggu",
          orderedBy: orderedByName, // <-- tampilkan nama user
          skema: po.id_skema ?? "", // <-- simpan id_skema, bukan label
          rawSkemaId: po.id_skema ?? null, // <-- id_skema untuk filter
        };
      });

      // Filter by user skema (id_skema, bukan label)
      const validated = mappedPOs.filter(
        (p: any) =>
          !userSkemaVal || String(p.rawSkemaId) === String(userSkemaVal)
      );
      // LOG: Data PO hasil mapping sebelum ditampilkan
      console.log("PO hasil mapping (frontend):", validated);

      setPoData(validated);
    } catch (err) {
      console.error("Gagal memuat data PO:", err);
      setPoData([]); // fallback
    }
  };

  const handleEdit = (po: POData) => {
    // Redirect to input page for editing
    window.location.href = "/po/input";
  };

  // --- Tambah state untuk modal konfirmasi dan toast ---
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastError, setToastError] = useState(false); // <-- Tambahkan state warna toast

  // --- Tambah state untuk modal hapus item PO ---
  const [deleteItemModalOpen, setDeleteItemModalOpen] = useState(false);
  const [selectedPOItemsForDelete, setSelectedPOItemsForDelete] = useState<
    { poId: string; items: any[] }[]
  >([]);
  const [selectedItemIdsToDelete, setSelectedItemIdsToDelete] = useState<
    string[]
  >([]);

  // --- Add auto-close for toast ---
  useEffect(() => {
    if (toastOpen) {
      const timer = setTimeout(() => setToastOpen(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastOpen]);

  // --- Komponen Modal dan Toast ---
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
    return createPortal(
      <div className="fixed bottom-6 right-6 z-50">
        <div
          className={`border shadow-lg rounded px-3 py-1 flex items-center gap-2 animate-fade-in ${toastError
            ? "bg-red-600 text-white border-red-600"
            : "bg-white border-gray-200 text-green-600"
            }`}
        >
          <span className="font-medium">{message}</span>
          <Button size="sm" variant="ghost" onClick={onClose}>
            ×
          </Button>
        </div>
      </div>,
      document.body
    );
  }

  // --- Perbaiki handleDelete agar bisa multi dan pakai modal ---
  const handleDelete = async (ids: string[] | string) => {
    const idList = Array.isArray(ids) ? ids : [ids];
    // Siapkan data item dari PO yang dipilih
    const poItems = poData
      .filter((po) => idList.includes(po.id))
      .map((po) => ({
        poId: po.id,
        items:
          po.poItems?.flatMap((poItem: any) =>
            poItem.items.map((item: any) => ({
              ...item,
              poId: po.id,
              poItemId: item.id_POItem,
            }))
          ) ?? [],
      }));
    setSelectedPOItemsForDelete(poItems);
    setSelectedItemIdsToDelete([]);
    setDeleteItemModalOpen(true);
  };

  // --- Fungsi hapus item PO yang dipilih ---
  // Tambahkan parameter mode: "permanent" | "restore"
  const confirmDeleteItems = async (mode: "permanent" | "restore") => {
    setDeleteItemModalOpen(false);
    let restoreError = false;
    try {
      // --- Kumpulkan id_PR dan id_PO sebelum proses hapus ---
      const prIdsToUpdate = new Set<string>();
      const poIdsToCheck = new Set<string>();
      const poItemsData: Record<string, any> = {};

      for (const itemId of selectedItemIdsToDelete) {
        if (!itemId) continue;
        if (mode === "restore") {
          // Ambil data PO item sebelum dihapus
          const poItemRes = await fetch(
            `http://localhost:5000/api/po-item/${itemId}`
          );
          if (!poItemRes.ok) continue;
          const poItem = await poItemRes.json();
          poItemsData[itemId] = poItem;
          // --- Ambil id_PR dari id_PRItem (mapping ke prItem) ---
          let prId = null;
          if (poItem.id_PR) {
            prId = String(poItem.id_PR);
          } else if (poItem.id_PRItem) {
            // Fetch PR Item untuk dapatkan id_PR
            const prItemRes = await fetch(
              `http://localhost:5000/api/pr-item/${poItem.id_PRItem}`
            );
            if (prItemRes.ok) {
              const prItem = await prItemRes.json();
              if (prItem && prItem.id_PR) {
                prId = String(prItem.id_PR);
              }
            }
          }
          if (prId) prIdsToUpdate.add(prId);
          poItemsData[itemId].__id_PR = prId;
          // --- Simpan id_PO untuk pengecekan setelah restore ---
          if (poItem.id_PO) poIdsToCheck.add(String(poItem.id_PO));
        }
      }

      // Proses hapus/restore
      for (const itemId of selectedItemIdsToDelete) {
        if (!itemId) continue;
        if (mode === "permanent") {
          // Hapus item PO secara permanen
          await fetch(`http://localhost:5000/api/po-item/${itemId}`, {
            method: "DELETE",
          });
        } else if (mode === "restore") {
          // --- RESTORE: Kembalikan item ke PR ---
          // Ambil data PO item
          const poItemRes = await fetch(
            `http://localhost:5000/api/po-item/${itemId}`
          );
          const poItem = await poItemRes.json();

          // Hapus item PO (cek error BTB)
          const delRes = await fetch(`http://localhost:5000/api/po-item/${itemId}`, {
            method: "DELETE",
          });
          if (!delRes.ok) {
            const err = await delRes.json();
            if (
              err.message &&
              err.message.includes("Item PO tidak bisa dikembalikan ke PR karena sudah diproses menjadi BTB")
            ) {
              restoreError = true;
              setToastMsg(
                "Item PO tidak bisa dikembalikan ke PR karena sudah diproses menjadi BTB. Silakan kembalikan/dihapus BTB terlebih dahulu."
              );
              setToastError(true); // <-- warna merah
              setToastOpen(true);
              continue;
            } else {
              restoreError = true;
              setToastMsg("Gagal menghapus item PO.");
              setToastError(true);
              setToastOpen(true);
              continue;
            }
          }
          const prId = poItem.__id_PR;
          const prItemId = poItem.id_PRItem;
          // Cek apakah PRItem masih ada
          const prItemRes = await fetch(
            `http://localhost:5000/api/pr-item/${prItemId}`
          );
          let prItem = null;
          if (prItemRes.ok) {
            prItem = await prItemRes.json();
          }
          if (prItem && prItem.id_PRItem) {
            const newJumlah = Number(prItem.jumlah) + Number(poItem.jumlahPO);
            await fetch(`http://localhost:5000/api/pr-item/${prItemId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...prItem,
                jumlah: newJumlah,
              }),
            });
          } else {
            // PRItem sudah tidak ada, buat ulang
            await fetch(`http://localhost:5000/api/pr-item`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id_PR: prId,
                namaBarang: poItem.namaBarang,
                jumlah: poItem.jumlahPO,
                originalJumlah: poItem.jumlahPO,
                quantityAwalPR: poItem.jumlahPO,
                id_satuan: poItem.id_satuan,
                keterangan: poItem.keterangan || "",
              }),
            });
          }
        }
      }

      // --- Setelah semua proses, update status PR ke "Gantung" ---
      if (mode === "restore") {
        for (const prId of prIdsToUpdate) {
          if (!prId || prId === "undefined") continue;
          // --- Tambahkan log sebelum fetch ---
          console.log("[DEBUG] Akan fetch PR untuk update status:", prId);
          // Ambil data PR lama
          const prRes = await fetch(`http://localhost:5000/api/pr/${prId}`);
          if (prRes.ok) {
            const prData = await prRes.json();
            // Kirim semua field PR lama + status baru "Gantung"
            // Pastikan field status dikirim dan tidak kosong
            await fetch(`http://localhost:5000/api/pr/${prId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...prData,
                status: "Gantung",
              }),
            });
          } else {
            setToastMsg(
              `PR id ${prId} tidak ditemukan. Tidak dapat mengubah status.`
            );
            setToastOpen(true);
          }
        }
        // --- Tambahkan: cek PO yang sudah tidak punya item, hapus PO ---
        for (const poId of poIdsToCheck) {
          // Fetch semua item PO dari backend
          const poItemRes = await fetch(
            `http://localhost:5000/api/po-item`
          );
          if (poItemRes.ok) {
            const poItems = await poItemRes.json();
            // Filter item PO dengan id_PO = poId dan jumlahPO > 0
            const itemsMasihAda = poItems.filter(
              (item: any) =>
                String(item.id_PO) === String(poId) &&
                Number(item.jumlahPO) > 0
            );
            if (itemsMasihAda.length === 0) {
              // Hapus PO dari backend
              await fetch(`http://localhost:5000/api/po/${poId}`, {
                method: "DELETE",
              });
            }
          }
        }
      }

      if (!restoreError) {
        setToastMsg(
          mode === "permanent"
            ? "Item PO berhasil dihapus permanen."
            : "Item PO berhasil dikembalikan ke PR."
        );
        setToastError(false); // <-- warna hijau
        setToastOpen(true);
      }
      // --- Tambahkan auto refresh data PO setelah update ---
      await fetchAll();
    } catch (err) {
      setToastMsg("Gagal menghapus item PO.");
      setToastError(true);
      setToastOpen(true);
      // --- Tambahkan auto refresh data PO setelah error juga ---
      await fetchAll();
    }
    setSelectedItemIdsToDelete([]);
  };

  // --- Perbaiki handleSelectAll agar hanya memilih PO yang sedang dipaging ---
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPOs(paginatedData.map((po) => po.id));
    } else {
      setSelectedPOs([]);
    }
  };

  // Filter data
  const filteredPOData = poData
    // Filter hanya PO dengan id_skema sesuai user login
    .filter((po) => !userSkemaId || String(po.skema) === String(userSkemaId))
    .map((po) => {
      let status = po.status || "Menunggu";
      return { ...po, status };
    })
    .filter(
      (po) => {
        // --- Tambahkan pencarian global ---
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          po.noPO.toLowerCase().includes(searchLower) ||
          po.supplier.toLowerCase().includes(searchLower) ||
          po.poItems.some((poItem) =>
            poItem.items
              .filter((item) => item.jumlahPO > 0)
              .some((item) =>
                item.namaBarang.toLowerCase().includes(searchLower)
              )
          );

        const matchesNamaBarang =
          !filterNamaBarang ||
          po.poItems.some((poItem) =>
            poItem.items.some((item) =>
              item.namaBarang
                .toLowerCase()
                .includes(filterNamaBarang.toLowerCase())
            )
          );

        const matchesQty =
          (filterQtyMin === "" ||
            po.poItems.some((poItem) =>
              poItem.items.some((item) => item.jumlahPO >= Number(filterQtyMin))
            )) &&
          (filterQtyMax === "" ||
            po.poItems.some((poItem) =>
              poItem.items.some((item) => item.jumlahPO <= Number(filterQtyMax))
            ));

        const matchesSatuan =
          filterSatuan.length === 0 ||
          po.poItems.some((poItem) =>
            poItem.items.some((item) => filterSatuan.includes(item.satuan))
          );

        const matchesKeterangan =
          !filterKeterangan ||
          po.poItems.some((poItem) =>
            poItem.items.some((item) =>
              item.keterangan
                ?.toLowerCase()
                .includes(filterKeterangan.toLowerCase())
            )
          );

        const matchesHargaSatuan =
          (filterHargaSatuanMin === "" ||
            po.poItems.some((poItem) =>
              poItem.items.some(
                (item) => item.hargaSatuan >= Number(filterHargaSatuanMin)
              )
            )) &&
          (filterHargaSatuanMax === "" ||
            po.poItems.some((poItem) =>
              poItem.items.some(
                (item) => item.hargaSatuan <= Number(filterHargaSatuanMax)
              )
            ));

        const matchesTotal =
          (filterTotalMin === "" ||
            po.totalPembayaran >= Number(filterTotalMin)) &&
          (filterTotalMax === "" ||
            po.totalPembayaran <= Number(filterTotalMax));

        const matchesTanggalPO =
          filterTanggalPO.length === 0 ||
          filterTanggalPO.includes(po.tanggalPO);

        const matchesEstimasiDiterima =
          filterEstimasiDiterima.length === 0 ||
          filterEstimasiDiterima.includes(po.estimasiTanggalDiterima);

        const matchesSupplier =
          filterSupplier.length === 0 || filterSupplier.includes(po.supplier);

        const matchesKode =
          filterKode.length === 0 ||
          filterKode.includes(po.statusPermintaan || "");

        const matchesStatusPengiriman =
          filterStatusPengiriman.length === 0 ||
          filterStatusPengiriman.includes(po.statusPengiriman || "");

        const matchesStatus =
          filterStatus.length === 0 || filterStatus.includes(po.status);

        const matchesDiorderOleh =
          filterDiorderOleh.length === 0 ||
          filterDiorderOleh.includes(po.orderedBy || "");

        // --- FILTER BY TANGGAL RENTANG (pakai DatePicker) ---
        let matchesDateRange = true;
        if (filterStartDate && filterEndDate) {
          // po.tanggalPO format: yyyy-mm-dd atau yyyy-mm-ddTHH:mm:ss
          const tglStr = (po.tanggalPO || "").split("T")[0];
          if (tglStr) {
            const parts = tglStr.split("-");
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
          matchesNamaBarang &&
          matchesQty &&
          matchesSatuan &&
          matchesKeterangan &&
          matchesHargaSatuan &&
          matchesTotal &&
          matchesTanggalPO &&
          matchesEstimasiDiterima &&
          matchesSupplier &&
          matchesKode &&
          matchesStatusPengiriman &&
          matchesStatus &&
          matchesDiorderOleh &&
          matchesDateRange // <-- tambahkan ini
        );
      }
      // Pada filter data PO, hapus filter yang menghilangkan item dengan jumlahPO = 0
      // Ganti bagian ini:
      // .filter((po) =>
      //   po.poItems.some((poItem) =>
      //     poItem.items.some((item) => item.jumlahPO > 0)
      //   )
      // );
      // Menjadi:
      // ...jangan filter berdasarkan jumlahPO...
    );

  // --- SORTING: PO TERBARU → TERLAMA (PAKAI PARSER) ---
  const sortedPOData = sortPOList(filteredPOData);

  // Pagination logic
  // Pagination logic removed
  // const totalPages = Math.ceil(sortedPOData.length / itemsPerPage);
  // const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedPOData;

  // Badge status
  const getStatusBadge = (status: string) => {
    if (status === "Completed" || status === "Telah dibuat BTB") {
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          Selesai
        </Badge>
      );
    }
    if (status === "Menunggu") {
      return (
        <Badge className="bg-warning/10 text-warning border-warning/20">
          {status}
        </Badge>
      );
    }
    if (status === "Gantung") {
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
          {status}
        </Badge>
      );
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  // Compute unique values
  const uniqueSatuan = Array.from(
    new Set(
      poData.flatMap((po) =>
        po.poItems.flatMap((poItem) =>
          poItem.items.map((item) => String(item.satuan ?? ""))
        )
      )
    )
  )
    .filter((s) => s.trim() !== "")
    .sort();

  const uniqueSuppliers = Array.from(
    new Set(poData.map((po) => String(po.supplier ?? "")))
  )
    .filter((s) => s.trim() !== "")
    .sort();
  const uniqueStatus = [
    "Draft",
    "Submitted",
    "Approved",
    "Delivered",
    "Completed",
    "Menunggu",
    "Gantung",
    "Telah dibuat BTB",
  ];
  const uniqueTanggalPO = Array.from(
    new Set(poData.map((po) => String(po.tanggalPO ?? "")))
  )
    .filter((t) => t.trim() !== "")
    .sort();
  const uniqueEstimasiDiterima = Array.from(
    new Set(poData.map((po) => String(po.estimasiTanggalDiterima ?? "")))
  )
    .filter((t) => t.trim() !== "")
    .sort();
  const uniqueKode = Array.from(
    new Set(poData.map((po) => String(po.statusPermintaan ?? "")))
  )
    .filter((k) => k.trim() !== "")
    .sort() as string[];
  const uniqueStatusPengiriman = Array.from(
    new Set(poData.map((po) => String(po.statusPengiriman ?? "")))
  )
    .filter((s) => s.trim() !== "")
    .sort() as string[];
  const uniqueDiorderOleh = Array.from(
    new Set(poData.map((po) => String(po.orderedBy ?? "")))
  )
    .filter((o) => o.trim() !== "")
    .sort();

  // Data untuk export sesuai mode
  const getExportPOData = () => {
    if (exportMode === "selected") {
      return filteredPOData.filter((po) => selectedPOs.includes(po.id));
    }
    if (exportMode === "range" && exportStartDate && exportEndDate) {
      // Use normalized ISO date for comparisons if available
      return filteredPOData.filter((po) => {
        const d = po.tanggalPO || "";
        return d >= exportStartDate && d <= exportEndDate;
      });
    }
    return filteredPOData;
  };

  const handleExport = async () => {
    const exportData = getExportPOData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monitoring PO");

    // Header sesuai urutan tabel monitoring PO
    const headers = [
      "No. PO",
      "Tanggal PO",
      "Estimasi Diterima",
      "Supplier",
      "Nama Barang",
      "Quantity PO",
      "Satuan",
      "Harga Satuan",
      "Total Pembayaran",
      "Status Permintaan",
      "Status Pengiriman",
      "Status",
      "Diorder Oleh",
      "Skema",
    ];

    // Add header row with bold font
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

    // Helper format tanggal persis seperti frontend
    function formatTanggalExcel(tgl: string) {
      if (!tgl) return "";
      if (/^\d{2}-\d{2}-\d{4}$/.test(tgl)) return tgl;
      if (/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
        const [y, m, d] = tgl.split("-");
        return `${d}-${m}-${y}`;
      }
      const d = dayjs(tgl);
      if (d.isValid()) {
        return d.format("DD-MM-YYYY");
      }
      return tgl;
    }

    // Add data rows
    exportData.forEach((po) => {
      // Flatten poItems
      const flatItems: any[] = [];
      if (po.poItems && po.poItems.length > 0) {
        po.poItems.forEach((group: any) => {
          if (group.items) {
            flatItems.push(...group.items);
          }
        });
      }

      if (flatItems.length > 0) {
        flatItems.forEach((item: any, index: number) => {
          worksheet.addRow([
            index === 0 ? po.noPO : "",
            index === 0 ? formatTanggalExcel(po.tanggalPO) : "",
            index === 0 ? formatTanggalExcel(po.estimasiTanggalDiterima) : "",
            index === 0 ? po.supplier : "",
            item.namaBarang,
            Number(item.jumlahPO || item.jumlahAsli || 0),
            item.satuan,
            Number(item.hargaSatuan || 0),
            index === 0 ? Number(po.totalPembayaran || 0) : "",
            index === 0 ? po.statusPermintaan : "",
            index === 0 ? po.statusPengiriman : "",
            index === 0 ? po.status : "",
            index === 0 ? po.orderedBy : "",
            index === 0 ? (skemaMap[String(po.skema)] || po.skema) : "",
          ]);
        });
      } else {
        worksheet.addRow([
          po.noPO,
          formatTanggalExcel(po.tanggalPO),
          formatTanggalExcel(po.estimasiTanggalDiterima),
          po.supplier,
          "",
          "",
          "",
          "",
          Number(po.totalPembayaran || 0),
          po.statusPermintaan,
          po.statusPengiriman,
          po.status,
          po.orderedBy,
          skemaMap[String(po.skema)] || po.skema,
        ]);
      }
    });

    // Set number/currency formats
    // Column 6: Quantity PO (#,##0)
    // Column 8: Harga Satuan (Currency)
    // Column 9: Total Pembayaran (Currency)
    const currencyFmt = '_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)';
    worksheet.getColumn(6).numFmt = '#,##0';
    worksheet.getColumn(8).numFmt = currencyFmt;
    worksheet.getColumn(9).numFmt = currencyFmt;

    // Auto-fit columns based on max length of cell values
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
      // Center align specific columns if needed
      if (rowNumber > 1) {
        row.getCell(2).alignment = { vertical: 'top', horizontal: 'center' }; // Tanggal
        // row.getCell(6).alignment = { vertical: 'top', horizontal: 'right' }; // Qty (default for number)
      }
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
    a.download = `monitoring-po-${new Date().toISOString().split("T")[0]
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

  const handleSelectPO = (poId: string, checked: boolean) => {
    if (checked) {
      setSelectedPOs((prev) => [...prev, poId]);
    } else {
      setSelectedPOs((prev) => prev.filter((id) => id !== poId));
    }
  };

  // --- Tambahkan kembali fungsi confirmDelete ---
  const confirmDelete = async () => {
    setConfirmDeleteOpen(false);
    try {
      for (const id of deleteIds) {
        const res = await fetch(`http://localhost:5000/api/po/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const err = await res.json();
          // --- Jika error karena sudah diproses BTB, tampilkan pesan khusus ---
          if (
            err.message &&
            err.message.includes("PO tidak bisa dihapus karena sudah diproses menjadi BTB")
          ) {
            setToastMsg(
              "PO tidak bisa dihapus karena sudah diproses menjadi BTB. Silakan kembalikan semua item BTB ke PO terlebih dahulu."
            );
            setToastOpen(true);
            continue;
          } else {
            setToastMsg("Terjadi kesalahan saat menghapus PO.");
            setToastOpen(true);
            continue;
          }
        }
        setPoData((prev) => prev.filter((po) => po.id !== id));
        setSelectedPOs((prev) => prev.filter((x) => x !== id));
      }
      // --- Jika semua berhasil dihapus, tampilkan toast sukses ---
      setToastMsg("PO berhasil dihapus.");
      setToastOpen(true);
    } catch (error) {
      setToastMsg("Terjadi kesalahan saat menghapus PO.");
      setToastOpen(true);
    }
    setDeleteIds([]);
  };

  // Tambahkan helper untuk format persen
  function formatPersen(val: any) {
    if (val === undefined || val === null || val === "") return "";
    const num = Number(val);
    if (isNaN(num)) return "";
    // Jika bulat, tampilkan tanpa koma, jika ada koma, tampilkan 1 atau 2 digit
    return num % 1 === 0 ? `${num}%` : `${parseFloat(num.toFixed(2))}%`;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Monitoring PO
            </h1>
            <p className="text-muted-foreground">
              Lihat dan kelola Purchase Order yang sudah dibuat
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-lg border border-gray-200">
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
                  <Label className="text-xs font-medium">Tanggal PO</Label>
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
                  (exportMode === "selected" && selectedPOs.length === 0) ||
                  (exportMode === "range" &&
                    (!exportStartDate || !exportEndDate))
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar & Filter Tanggal PO */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Input
            placeholder="Cari No. PO, Supplier, atau Nama Barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[320px]"
          />
          {/* Filter rentang tanggal PO pakai DatePicker */}
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">Tanggal PO:</span>
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
            <CardTitle>Daftar Purchase Order</CardTitle>
            <CardDescription>
              Total: {filteredPOData.length} PO | Dipilih: {selectedPOs.length}
            </CardDescription>
            {selectedPOs.length > 0 && (
              <Button
                variant="destructive"
                className="mt-2"
                onClick={() => handleDelete(selectedPOs)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus PO/Item Terpilih ({selectedPOs.length})
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {/* --- Make table scrollable with sticky header --- */}
            <div
              ref={tableWrapperRef}
              className="overflow-auto"
              style={{
                maxHeight: "70vh",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
              }}
            >
              <Table className="border-collapse border border-gray-300 table-auto min-w-full">
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead
                      className="border border-gray-300 px-3 py-1 text-center align-middle sticky top-0 z-10 bg-gray-100 uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      {/* Checkbox Select All */}
                      <Checkbox
                        checked={
                          selectedPOs.length === paginatedData.length &&
                          paginatedData.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                        style={{
                          boxShadow: "0 0 0 2px #bbb, 0 2px 8px #bbb8",
                          border: "1.5px solid #bbb",
                          borderRadius: 4,
                        }}
                        className="focus:ring-2 focus:ring-primary"
                      />
                    </TableHead>
                    <TableHead
                      className="min-w-[140px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      {/* No. PO */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            No. PO
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                          <Label className="text-sm font-medium">
                            Cari No. PO
                          </Label>
                          <Input
                            placeholder="Cari No. PO..."
                            value={kodeSearchTerm}
                            onChange={(e) => setKodeSearchTerm(e.target.value)}
                            className="mb-2"
                          />
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {uniqueKode
                              .filter((k) =>
                                k
                                  .toLowerCase()
                                  .includes(kodeSearchTerm.toLowerCase())
                              )
                              .map((k) => (
                                <div
                                  key={k}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`kode-${k}`}
                                    checked={filterKode.includes(k)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterKode([...filterKode, k]);
                                      else
                                        setFilterKode(
                                          filterKode.filter((x) => x !== k)
                                        );
                                    }}
                                  />
                                  <Label htmlFor={`kode-${k}`} className="text-sm">{k}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead
                      className="min-w-[120px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      {/* Tanggal PO */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            Tanggal PO
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                          <Label className="text-sm font-medium">
                            Cari Tanggal PO
                          </Label>
                          <Input
                            placeholder="Cari tanggal..."
                            value={tanggalPOSearchTerm}
                            onChange={(e) =>
                              setTanggalPOSearchTerm(e.target.value)
                            }
                            className="mb-2"
                          />
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {uniqueTanggalPO
                              .filter((tgl) =>
                                tgl
                                  .toLowerCase()
                                  .includes(tanggalPOSearchTerm.toLowerCase())
                              )
                              .map((tgl) => (
                                <div
                                  key={tgl}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`tglPO-${tgl}`}
                                    checked={filterTanggalPO.includes(tgl)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterTanggalPO([
                                          ...filterTanggalPO,
                                          tgl,
                                        ]);
                                      else
                                        setFilterTanggalPO(
                                          filterTanggalPO.filter(
                                            (x) => x !== tgl
                                          )
                                        );
                                    }}
                                  />
                                  <Label htmlFor={`tglPO-${tgl}`} className="text-sm">{formatTanggal(tgl)}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead
                      className="min-w-[140px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      {/* Supplier */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            Supplier
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                          <Label className="text-sm font-medium">
                            Cari Supplier
                          </Label>
                          <Input
                            placeholder="Cari supplier..."
                            value={supplierSearchTerm}
                            onChange={(e) =>
                              setSupplierSearchTerm(e.target.value)
                            }
                            className="mb-2"
                          />
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {uniqueSuppliers
                              .filter((s) =>
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
                                  <Label htmlFor={`supplier-${s}`} className="text-sm">{s}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead
                      className="min-w-[180px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      {/* Nama Barang */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            Daftar Barang
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                          <Label className="text-sm font-medium">
                            Cari Nama Barang
                          </Label>
                          <Input
                            placeholder="Cari barang..."
                            value={filterNamaBarang}
                            onChange={(e) =>
                              setFilterNamaBarang(e.target.value)
                            }
                            className="mb-2"
                          />
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead
                      className="min-w-[90px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      {/* Quantity PO */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            Quantity PO
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                          <Label className="text-sm font-medium">
                            Min Qty
                          </Label>
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
                            className="mb-2"
                          />
                          <Label className="text-sm font-medium">
                            Max Qty
                          </Label>
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
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead
                      className="min-w-[90px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      {/* Satuan */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            Satuan
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                          <Label className="text-sm font-medium">
                            Cari Satuan
                          </Label>
                          <Input
                            placeholder="Cari satuan..."
                            value={satuanSearchTerm}
                            onChange={(e) =>
                              setSatuanSearchTerm(e.target.value)
                            }
                            className="mb-2"
                          />
                          <div className="max-h-32 overflow-y-auto space-y-1">
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
                                  <Label htmlFor={`satuan-${s}`} className="text-sm">{s}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead
                      className="min-w-[160px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      {/* Keterangan */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            Keterangan
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                          <Label className="text-sm font-medium">
                            Cari Keterangan
                          </Label>
                          <Input
                            placeholder="Cari keterangan..."
                            value={filterKeterangan}
                            onChange={(e) =>
                              setFilterKeterangan(e.target.value)
                            }
                            className="mb-2"
                          />
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead
                      className="min-w-[120px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      {/* Harga Satuan */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            Harga Satuan
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                          <Label className="text-sm font-medium">
                            Min Harga
                          </Label>
                          <Input
                            placeholder="Min Harga"
                            type="number"
                            value={filterHargaSatuanMin}
                            onChange={(e) =>
                              setFilterHargaSatuanMin(
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                            className="mb-2"
                          />
                          <Label className="text-sm font-medium">
                            Max Harga
                          </Label>
                          <Input
                            placeholder="Max Harga"
                            type="number"
                            value={filterHargaSatuanMax}
                            onChange={(e) =>
                              setFilterHargaSatuanMax(
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Tambahan kolom baru untuk Diskon dan PPN */}
                    <TableHead
                      className="min-w-[90px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      Diskon (%)
                    </TableHead>
                    <TableHead
                      className="min-w-[90px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      Diskon (Rp)
                    </TableHead>
                    <TableHead
                      className="min-w-[90px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      PPN (%)
                    </TableHead>
                    <TableHead
                      className="min-w-[90px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      PPN (Rp)
                    </TableHead>
                    <TableHead
                      className="min-w-[110px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      Total
                    </TableHead>
                    <TableHead
                      className="min-w-[120px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      {/* Grand Total */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            Grand Total
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                          <Label className="text-sm font-medium">
                            Min Total
                          </Label>
                          <Input
                            placeholder="Min Total"
                            type="number"
                            value={filterTotalMin}
                            onChange={(e) =>
                              setFilterTotalMin(
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                            className="mb-2"
                          />
                          <Label className="text-sm font-medium">
                            Max Total
                          </Label>
                          <Input
                            placeholder="Max Total"
                            type="number"
                            value={filterTotalMax}
                            onChange={(e) =>
                              setFilterTotalMax(
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead
                      className="min-w-[100px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      {/* Ordered By */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            Ordered By
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                          <Label className="text-sm font-medium">
                            Cari User
                          </Label>
                          <Input
                            placeholder="Cari user..."
                            value={diorderOlehSearchTerm}
                            onChange={(e) =>
                              setDiorderOlehSearchTerm(e.target.value)
                            }
                            className="mb-2"
                          />
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {uniqueDiorderOleh
                              .filter((o) =>
                                o
                                  .toLowerCase()
                                  .includes(diorderOlehSearchTerm.toLowerCase())
                              )
                              .map((o) => (
                                <div
                                  key={o}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`diorder-${o}`}
                                    checked={filterDiorderOleh.includes(o)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterDiorderOleh([
                                          ...filterDiorderOleh,
                                          o,
                                        ]);
                                      else
                                        setFilterDiorderOleh(
                                          filterDiorderOleh.filter(
                                            (x) => x !== o
                                          )
                                        );
                                    }}
                                  />
                                  <Label htmlFor={`diorder-${o}`} className="text-sm">{o}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* --- KOLOM BARU: Nama Pembeli --- */}
                    <TableHead
                      className="min-w-[120px] border border-gray-300 px-3 py-1 text-center sticky top-0 z-10 bg-gray-100 uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      Nama Pembeli
                    </TableHead>
                    <TableHead
                      className="min-w-[140px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      {/* Estimasi Diterima */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            Estimasi Diterima
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                          <Label className="text-sm font-medium">
                            Cari Estimasi
                          </Label>
                          <Input
                            placeholder="Cari estimasi..."
                            value={estimasiDiterimaSearchTerm}
                            onChange={(e) =>
                              setEstimasiDiterimaSearchTerm(e.target.value)
                            }
                            className="mb-2"
                          />
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {uniqueEstimasiDiterima
                              .filter((tgl) =>
                                tgl
                                  .toLowerCase()
                                  .includes(
                                    estimasiDiterimaSearchTerm.toLowerCase()
                                  )
                              )
                              .map((tgl) => (
                                <div
                                  key={tgl}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`estimasi-${tgl}`}
                                    checked={filterEstimasiDiterima.includes(
                                      tgl
                                    )}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterEstimasiDiterima([
                                          ...filterEstimasiDiterima,
                                          tgl,
                                        ]);
                                      else
                                        setFilterEstimasiDiterima(
                                          filterEstimasiDiterima.filter(
                                            (x) => x !== tgl
                                          )
                                        );
                                    }}
                                  />
                                  <Label htmlFor={`estimasi-${tgl}`} className="text-sm">{formatTanggal(tgl)}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead
                      className="min-w-[140px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      {/* Status Pengiriman */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            Status Pengiriman
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                          <Label className="text-sm font-medium">
                            Cari Status Pengiriman
                          </Label>
                          <Input
                            placeholder="Cari status pengiriman..."
                            value={statusPengirimanSearchTerm}
                            onChange={(e) =>
                              setStatusPengirimanSearchTerm(e.target.value)
                            }
                            className="mb-2"
                          />
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {uniqueStatusPengiriman
                              .filter((s) =>
                                s
                                  .toLowerCase()
                                  .includes(
                                    statusPengirimanSearchTerm.toLowerCase()
                                  )
                              )
                              .map((s) => (
                                <div
                                  key={s}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`statusPengiriman-${s}`}
                                    checked={filterStatusPengiriman.includes(s)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterStatusPengiriman([
                                          ...filterStatusPengiriman,
                                          s,
                                        ]);
                                      else
                                        setFilterStatusPengiriman(
                                          filterStatusPengiriman.filter(
                                            (x) => x !== s
                                          )
                                        );
                                    }}
                                  />
                                  <Label htmlFor={`statusPengiriman-${s}`} className="text-sm">{s}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead
                      className="min-w-[100px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      {/* Status */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            Status
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                          <Label className="text-sm font-medium">
                            Cari Status
                          </Label>
                          <Input
                            placeholder="Cari status..."
                            value={statusSearchTerm}
                            onChange={(e) =>
                              setStatusSearchTerm(e.target.value)
                            }
                            className="mb-2"
                          />
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {uniqueStatus
                              .filter((s) =>
                                s
                                  .toLowerCase()
                                  .includes(statusSearchTerm.toLowerCase())
                              )
                              .map((s) => (
                                <div
                                  key={s}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`status-${s}`}
                                    checked={filterStatus.includes(s)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterStatus([...filterStatus, s]);
                                      else
                                        setFilterStatus(
                                          filterStatus.filter((x) => x !== s)
                                        );
                                    }}
                                  />
                                  <Label htmlFor={`status-${s}`} className="text-sm">{s}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* <TableHead
                      className="min-w-[100px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase"
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
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            Skema
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                          <Label className="text-sm font-medium">
                            Cari Skema
                          </Label>
                          <Input
                            placeholder="Cari skema..."
                            value={skemaSearchTerm}
                            onChange={(e) => setSkemaSearchTerm(e.target.value)}
                            className="mb-2"
                          />
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {uniqueKode
                              .filter((s) =>
                                String(s)
                                  .toLowerCase()
                                  .includes(skemaSearchTerm.toLowerCase())
                              )
                              .map((s) => (
                                <div
                                  key={s}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`skema-${s}`}
                                    checked={filterSkema.includes(s)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterSkema([...filterSkema, s]);
                                      else
                                        setFilterSkema(
                                          filterSkema.filter((x) => x !== s)
                                        );
                                    }}
                                  />
                                  <Label htmlFor={`skema-${s}`} className="text-sm">{s}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((po) => {
                    // Flatten all items from all poItems, urutan sesuai backend/input PO
                    const allItems = po.poItems.flatMap((poItem: any) =>
                      poItem.items.map((item: any) => ({
                        ...item,
                        noPR: poItem.noPR,
                      }))
                    );

                    return (
                      <React.Fragment key={po.id}>
                        {allItems.map((item: any, itemIndex: number) => (
                          <TableRow
                            key={`${po.id}-item-${itemIndex}`}
                            id={itemIndex === 0 ? (po.noPO || "") : undefined}
                            className={`hover:bg-gray-50 transition-colors ${highlight && po.noPO === highlight ? "bg-yellow-100" : ""
                              }`}
                          >
                            {itemIndex === 0 ? (
                              <>
                                <TableCell
                                  key="checkbox"
                                  rowSpan={allItems.length}
                                  className="border border-gray-300 px-3 py-1 text-center align-middle"
                                >
                                  <Checkbox
                                    checked={selectedPOs.includes(po.id)}
                                    onCheckedChange={(checked) =>
                                      handleSelectPO(po.id, checked as boolean)
                                    }
                                    style={{
                                      boxShadow:
                                        "0 0 0 2px #bbb, 0 2px 8px #bbb8",
                                      border: "1.5px solid #bbb",
                                      borderRadius: 4,
                                    }}
                                    className="focus:ring-2 focus:ring-primary"
                                  />
                                </TableCell>
                                <TableCell
                                  key="noPO"
                                  className="font-medium px-3 py-1 border-r border-gray-300 align-middle uppercase"
                                  rowSpan={allItems.length}
                                >
                                  {po.noPO}
                                </TableCell>
                                <TableCell
                                  key="tanggalPO"
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[120px] uppercase"
                                >
                                  {formatTanggal(po.tanggalPO)}
                                </TableCell>
                                <TableCell
                                  key="supplier"
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[140px] uppercase"
                                >
                                  {po.supplier}
                                </TableCell>
                              </>
                            ) : null}
                            <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-left min-w-[200px] uppercase">
                              {item.namaBarang}
                            </TableCell>
                            <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-left min-w-[80px] uppercase">
                              {/* --- Ubah: Quantity PO ambil dari jumlahAsli --- */}
                              {item.jumlahAsli}
                            </TableCell>
                            <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-left min-w-[60px] uppercase">
                              {item.satuan}
                            </TableCell>
                            <TableCell
                              className="px-3 py-1 border-r border-gray-300 align-middle text-left max-w-[120px] whitespace-nowrap overflow-hidden text-ellipsis uppercase"
                            >
                              {/* HoverCard untuk keterangan */}
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <span
                                    className="text-sm text-muted-foreground cursor-pointer"
                                    title={item.keterangan}
                                    style={{
                                      display: "inline-block",
                                      maxWidth: "120px",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      verticalAlign: "middle",
                                    }}
                                  >
                                    {item.keterangan ? item.keterangan.slice(0, 20) : ""}
                                    {item.keterangan && item.keterangan.length > 20 ? "..." : ""}
                                  </span>
                                </HoverCardTrigger>
                              </HoverCard>
                            </TableCell>
                            <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-left min-w-[120px] uppercase">
                              Rp {item.hargaSatuan?.toLocaleString("id-ID")}
                            </TableCell>
                            {/* Kolom baru: Diskon (%) */}
                            <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-left min-w-[90px] uppercase">
                              {formatPersen(item.diskonPersen)}
                            </TableCell>
                            {/* Kolom baru: Diskon (Rp) */}
                            <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-left min-w-[90px] uppercase">
                              {item.diskonNominal
                                ? `Rp ${Number(
                                  item.diskonNominal
                                ).toLocaleString("id-ID")}`
                                : ""}
                            </TableCell>
                            {/* Kolom baru: PPN (%) */}
                            <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-left min-w-[90px] uppercase">
                              {formatPersen(item.ppnItem)}
                            </TableCell>
                            <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-left min-w-[90px] uppercase">
                              {item.ppnAmount
                                ? `Rp ${Number(item.ppnAmount).toLocaleString(
                                  "id-ID"
                                )}`
                                : ""}
                            </TableCell>
                            <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-left min-w-[110px] uppercase">
                              {typeof item.totalPerItem !== "undefined" &&
                                item.totalPerItem !== null
                                ? `Rp ${Number(
                                  item.totalPerItem
                                ).toLocaleString("id-ID")}`
                                : ""}
                            </TableCell>
                            {itemIndex === 0 ? (
                              <>
                                <TableCell
                                  key="totalPembayaran"
                                  rowSpan={allItems.length}
                                  className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[120px] uppercase"
                                >
                                  Rp{" "}
                                  {po.totalPembayaran.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell
                                  key="orderedBy"
                                  rowSpan={allItems.length}
                                  className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[100px] uppercase"
                                >
                                  {po.orderedBy ?? ""}
                                </TableCell>
                                {/* --- KOLOM BARU: Nama Pembeli (display dari item pertama) --- */}
                                <TableCell
                                  key="namaPembeli"
                                  rowSpan={allItems.length}
                                  className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[120px] uppercase"
                                >
                                  {allItems[0]?.namaPembeli ?? ""}
                                </TableCell>
                                <TableCell
                                  key="estimasiTanggalDiterima"
                                  rowSpan={allItems.length}
                                  className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[140px] uppercase"
                                >
                                  {formatTanggal(po.estimasiTanggalTerima)}
                                </TableCell>
                                <TableCell
                                  key="statusPengiriman"
                                  rowSpan={allItems.length}
                                  className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[140px] uppercase"
                                >
                                  {po.statusPengiriman ?? ""}
                                </TableCell>
                                <TableCell
                                  key="statusBadge"
                                  rowSpan={allItems.length}
                                  className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[100px] uppercase"
                                >
                                  {getStatusBadge(po.status || "")}
                                </TableCell>
                                {/* <TableCell
                                  key="skema"
                                  rowSpan={allItems.length}
                                  className="px-3 py-1 border border-gray-300 align-middle text-center min-w-[100px] uppercase"
                                >
                                  {skemaMap[String(po.skema)] ?? po.skema ?? ""}
                                </TableCell> */}
                              </>
                            ) : null}
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>

        </Card>
        {/* --- Add modal and toast to the layout --- */}
        <ConfirmModal
          open={confirmDeleteOpen}
          title="Konfirmasi Hapus PO"
          description={`Apakah Anda yakin ingin menghapus ${deleteIds.length} PO? Data yang dihapus tidak dapat dikembalikan.`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteOpen(false)}
        />
        <DeleteItemModal
          open={deleteItemModalOpen}
          poItems={selectedPOItemsForDelete}
          selectedIds={selectedItemIdsToDelete}
          setSelectedIds={setSelectedItemIdsToDelete}
          onConfirm={confirmDeleteItems}
          onCancel={() => setDeleteItemModalOpen(false)}
          poData={poData}
        />
        <Toast
          open={toastOpen}
          message={toastMsg}
          onClose={() => setToastOpen(false)}
        />
      </div>
    </MainLayout>
  );
}

// --- Modal pilih item PO yang mau dikembalikan ke PR ---
function DeleteItemModal({
  open,
  poItems,
  selectedIds,
  setSelectedIds,
  onConfirm,
  onCancel,
  poData,
}: any) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[420px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">
          Pilih Item PO yang akan dikembalikan ke PR
        </h2>
        <div className="space-y-4">
          {poItems.map(({ poId, items }: any) => (
            <div key={poId}>
              <div className="font-semibold mb-1">
                PO: {poData.find((po: any) => po.id === poId)?.noPO || poId}
              </div>
              {items.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Tidak ada item pada PO ini.
                </div>
              ) : (
                <div className="space-y-1">
                  {items.map((item: any, idx: number) => {
                    const keyId = item.poItemId
                      ? String(item.poItemId)
                      : `${item.namaBarang}-${item.jumlahPO}-${idx}`;
                    const valueId = item.poItemId ? String(item.poItemId) : "";
                    const jumlahDisplay =
                      parseFloat(item.jumlahPO) % 1 === 0
                        ? parseInt(item.jumlahPO)
                        : item.jumlahPO;
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
                              setSelectedIds(
                                selectedIds.filter((x: string) => x !== valueId)
                              );
                            }
                          }}
                        />
                        <span>
                          {item.namaBarang} ({jumlahDisplay} {item.satuan})
                          {!valueId && (
                            <span className="text-xs text-red-500 ml-2">
                              (ID POItem tidak ditemukan)
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm("restore")}
            disabled={selectedIds.length === 0}
          >
            Kembalikan ke PR ({selectedIds.length})
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
