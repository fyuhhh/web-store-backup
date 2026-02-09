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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  Search,
  Download,
  ChevronDown,
  Calendar as CalendarIcon,
  FileSpreadsheet,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { type POData, type PRData } from "@/lib/dummy-data";
import { truncateText } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/config";
function formatTanggal(tgl: string) {
  if (!tgl) return "";
  // Tampilkan tanggal asli tanpa modifikasi
  let dateObj = dayjs(tgl);
  if (!dateObj.isValid() && /^\d{2}-\d{2}-\d{4}$/.test(tgl)) {
    const [d, m, y] = tgl.split("-");
    dateObj = dayjs(`${y}-${m}-${d}`);
  }
  if (dateObj.isValid()) {
    return dateObj.format("DD/MM/YYYY");
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

  // --- Helper Formatters
  const formatQuantity = (val: any) => {
    if (val === undefined || val === null || val === "") return "";
    const num = Number(val);
    if (!isNaN(num)) return String(num);
    return val;
  };

  const formatBiaya = (val: any) => {
    if (val === undefined || val === null || val === "") return "";
    // Handle specific cases where data might come as string with comma decimal
    const cleanVal = String(val).replace(/,/g, ".");
    const num = Number(cleanVal);
    if (isNaN(num)) return val;
    return "Rp. " + num.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  // -------------------------------------------

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

  // --- STATE for Divisi Role ---
  const [isDivisi, setIsDivisi] = useState(false);
  // -----------------------------

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
        btbRes, // <-- fetch BTB
        btbItemRes, // <-- fetch BTB Item
        divisiRes, // <-- fetch Divisi
      ] = await Promise.all([
        fetch(API_BASE_URL + "/api/po", { cache: "no-store" }),
        fetch(API_BASE_URL + "/api/po-item", { cache: "no-store" }),
        fetch(API_BASE_URL + "/api/pr-item", { cache: "no-store" }),
        fetch(API_BASE_URL + "/api/pr", { cache: "no-store" }),
        fetch(API_BASE_URL + "/api/supplier", { cache: "no-store" }),
        fetch(API_BASE_URL + "/api/status-permintaan", { cache: "no-store" }),
        fetch(API_BASE_URL + "/api/status-pengiriman", { cache: "no-store" }),
        fetch(API_BASE_URL + "/api/skema", { cache: "no-store" }),
        fetch(API_BASE_URL + "/api/user", { cache: "no-store" }), // <-- fetch user
        fetch(API_BASE_URL + "/api/btb", { cache: "no-store" }), // <-- fetch BTB
        fetch(API_BASE_URL + "/api/btb-item", { cache: "no-store" }), // <-- fetch BTB Item
        fetch(API_BASE_URL + "/api/divisi", { cache: "no-store" }), // <-- fetch Divisi
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
        btbList, // <-- btbList
        btbItemList, // <-- btbItemList
        divisiList, // <-- divisiList
      ] = await Promise.all([
        poRes.json(),
        poItemRes.json(),
        prItemRes.json(),
        prRes.json(),
        supRes.json(),
        statusPermintaanRes.json(),
        statusPengirimanRes.json(),
        // Role check
        skemaRes.json(),
        userRes.json(), // <-- userList
        btbRes.json(), // <-- btbList
        btbItemRes.json(), // <-- btbItemList
        divisiRes.json(), // <-- divisiList
      ]);

      // --- Mapping User Role from LocalStorage ---
      const userDataStr = localStorage.getItem("userData");
      const userDataObj = userDataStr ? JSON.parse(userDataStr) : {};
      const role = (userDataObj.role || "").toLowerCase();
      const userId = Number(userDataObj.id || userDataObj.id_user || 0);

      // Logic: Hide ONLY if role is 'divisi' AND user is NOT in allow list (98, 141)
      const isRestricted = role === "divisi" && ![98, 141].includes(userId);
      setIsDivisi(isRestricted);
      // -------------------------------------------

      // Create Set of PO IDs that have BTB
      const processedPOIds = new Set(
        Array.isArray(btbList) ? btbList.map((btb: any) => String(btb.id_po)) : []
      );

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

      // Map Divisi
      const divisiMap = Object.fromEntries(
        (divisiList || []).map((d: any) => [String(d.id_divisi), d.divisi])
      );

      // Create prDivisiMap & prDateMap
      const prDivisiMap = Object.fromEntries(
        prList.map((p: any) => {
          const divName = divisiMap[String(p.id_divisi)] || "";
          return [String(p.id_PR), divName];
        })
      );
      const prDateMap = Object.fromEntries(
        prList.map((p: any) => [String(p.id_PR), p.tanggalPR])
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
        // --- TAMBAHAN: Map Divisi PR untuk export ---
        // Helper: Divisi Map (id_divisi -> nama_divisi)
        const divisiMap = Object.fromEntries(
          (divisiList || []).map((d: any) => [String(d.id_divisi), d.divisi || d.nama_divisi])
        );

        const prDivisiMap = Object.fromEntries(
          prList.map((p: any) => [
            String(p.id_PR),
            p.divisi || (p.id_divisi ? divisiMap[String(p.id_divisi)] : "") || ""
          ])
        );
        // --- TAMBAHAN: Map Tanggal BTB & No BTB dari btbList ---
        const btbMap = Object.fromEntries(
          (btbList || []).map((b: any) => [String(b.id_btb), b])
        );

        // --- Helper: Get BTB Items for a PO Item ---
        // Group BTB Items by id_POItem
        const btbItemsByPOItem: Record<string, any[]> = {};
        (btbItemList || []).forEach((bi: any) => {
          const pid = String(bi.id_POItem);
          if (!btbItemsByPOItem[pid]) btbItemsByPOItem[pid] = [];
          btbItemsByPOItem[pid].push(bi);
        });

        // Helper: Get Satuan Name
        const satuanMap = Object.fromEntries(
          (uniqueSatuan || []).map((s: any) => [s, s])
        );
        // Note: uniqueSatuan is computed later from poData, which is circular. 
        // We can't use uniqueSatuan here easily. 
        // But btb_item from API usually has `satuanLabel` if using the join query, 
        // let's check backend btb_item.js... yes it joins with satuan table.
        // So btbItem.satuanLabel is available.


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

          // --- Cari data BTB terkait item ini ---
          const relatedBtbItems = btbItemsByPOItem[String(pi.id_POItem)] || [];

          // Concatenate informasinya
          // Concatenate informasinya -> ubah jadi Array
          const noBtbList = relatedBtbItems.map(bi => btbMap[bi.id_btb]?.no_btb || "-");
          const tglBtbList = relatedBtbItems.map(bi => formatTanggal(btbMap[bi.id_btb]?.tanggal_btb));
          const qtyBtbList = relatedBtbItems.map(bi => formatQuantity(bi.jumlah_diterima));
          const satuanBtbList = relatedBtbItems.map(bi => bi.satuanLabel || bi.id_satuan);
          // Simpan biaya sebagai number (raw) agar presisi desimal terjaga
          const biayaAmbilList = relatedBtbItems.map(bi => {
            if (bi.biaya === undefined || bi.biaya === null || bi.biaya === "") return null;
            if (typeof bi.biaya === "number") return bi.biaya;

            // Handle string cases
            const sVal = String(bi.biaya);
            if (sVal.includes(",")) {
              // Likely ID format "30.000,78" -> remove dots, replace comma
              const cleanVal = sVal.replace(/\./g, "").replace(/,/g, ".");
              const v = Number(cleanVal);
              return isNaN(v) ? 0 : v;
            }
            // Standard string "30000.78"
            const v = Number(sVal);
            return isNaN(v) ? 0 : v;
          });
          const qtySisaList = relatedBtbItems.map(bi => formatQuantity(bi.qty_sisa));
          // --------------------------------------------------------------------------

          const item = {
            // --- mapping id_POItem asli dari backend ---
            id_POItem: pi.id_POItem, // <-- ini id yang dipakai untuk hapus
            id_PRItem: prItem.id_PRItem ?? prItem.id ?? pi.id_PRItem ?? null,
            namaBarang: prItem.namaBarang ?? prItem.namabarang ?? pi.namaBarang ?? "",
            // --- Ubah: Quantity PO ambil dari jumlahPO ---
            jumlahPO: Number(pi.jumlahAsli) || Number(pi.jumlahPO) || Number(pi.jumlah) || 0,
            jumlahAsli: Number(pi.jumlahAsli) || Number(pi.jumlah) || 0,
            satuan:
              prItem.satuanLabel || prItem.satuan || prItem.id_satuan || pi.id_satuan || "",
            hargaSatuan: Number(pi.hargaSatuan) || 0,
            keterangan: pi.keterangan || prItem.keterangan || "",
            // --- Map Divisi here (Fix: Use Name from divisiMap) ---
            divisi: prDivisiMap[prId] || "-",
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
            // --- TAMBAHAN: Validasi Divisi user logic ---
            // Nanti di render pakai user.role, tapi data disiapkan di sini

            // --- TAMBAHAN: mapping namaPembeli dari po_item ---
            namaPembeli: pi.namaPembeli ?? "",

            // --- Fields baru untuk tabel ---
            noPR: noPR,
            tanggalPR: prDateMap[prId] || "",
            divisiPR: prDivisiMap[prId] || "", // Rename to avoid confusion with existing logic if any
            noBTB: noBtbList,
            tanggalBTB: tglBtbList,
            qtyBTB: qtyBtbList,
            satuanBTB: satuanBtbList,
            biayaAmbil: biayaAmbilList,
            qtyBelumBTB: qtySisaList,
            status: pi.status,
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
          status: po.status ?? "WAITING PART",
          orderedBy: orderedByName, // <-- tampilkan nama user
          skema: po.id_skema ?? "", // <-- simpan id_skema, bukan label
          rawSkemaId: po.id_skema ?? null, // <-- id_skema untuk filter
          isProcessed: processedPOIds.has(String(po.id_PO ?? po.id)), // <-- Flag if processed
          termin: po.termin ?? "", // <-- simpan nama termin
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
            `${API_BASE_URL}/api/po-item/${itemId}`
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
              `${API_BASE_URL}/api/pr-item/${poItem.id_PRItem}`
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
          await fetch(`${API_BASE_URL}/api/po-item/${itemId}`, {
            method: "DELETE",
          });
        } else if (mode === "restore") {
          // --- RESTORE: Kembalikan item ke PR ---
          // Ambil data PO item
          const poItemRes = await fetch(
            `${API_BASE_URL}/api/po-item/${itemId}`
          );
          const poItem = await poItemRes.json();

          // Hapus item PO (cek error BTB)
          const delRes = await fetch(`${API_BASE_URL}/api/po-item/${itemId}`, {
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
            `${API_BASE_URL}/api/pr-item/${prItemId}`
          );
          let prItem = null;
          if (prItemRes.ok) {
            prItem = await prItemRes.json();
          }
          if (prItem && prItem.id_PRItem) {
            // Backend already restores the quantity on PO Item deletion.
            // Do NOT manually update here, otherwise it will add up twice.
          } else {
            // PRItem sudah tidak ada, buat ulang
            await fetch(`${API_BASE_URL}/api/pr-item`, {
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

      // --- Tambahkan: cek PO yang sudah tidak punya item, hapus PO ---
      for (const poId of poIdsToCheck) {
        // Fetch semua item PO dari backend
        const poItemRes = await fetch(
          `${API_BASE_URL}/api/po-item`
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
            await fetch(`${API_BASE_URL}/api/po/${poId}`, {
              method: "DELETE",
            });
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
      let status = po.status || "WAITING PART";
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
  // Badge status
  const getStatusBadge = (status: string) => {
    // Green: Selesai / Complete
    if (status === "Completed" || status === "Telah dibuat BTB" || status === "PART COMPLETE" || status === "Telah Selesai") {
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          {status === "PART COMPLETE" ? "PART COMPLETE" : "Selesai"}
        </Badge>
      );
    }
    // Yellow: Partial / Gantung
    if (status === "PARTIAL PART" || status === "Gantung" || status === "PARTIAL PO") {
      return (
        <Badge className="bg-warning/10 text-warning border-warning/20">
          {status}
        </Badge>
      );
    }
    // Red: Waiting / Menunggu
    if (status === "Menunggu" || status === "WAITING PART" || status === "WAITING PO") {
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
          {status === "Menunggu" ? "WAITING PART" : status}
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
    "WAITING PART",
    "PARTIAL PART",
    "PART COMPLETE",
    "Draft",
    "Submitted",
    "Approved",
    "Delivered",
    "Completed",
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
      return sortedPOData.filter((po) => selectedPOs.includes(po.id));
    }
    if (exportMode === "range" && exportStartDate && exportEndDate) {
      // Use dayjs for precise date comparison
      return sortedPOData.filter((po) => {
        if (!po.tanggalPO) return false;
        // Parse UTC to local if needed, but simplistic comparison might suffer timezone
        // Use dayjs to be consistent
        const tgl = dayjs(po.tanggalPO);
        const start = dayjs(exportStartDate);
        const end = dayjs(exportEndDate).endOf('day');
        return tgl.isValid() && (tgl.isAfter(start) || tgl.isSame(start)) && (tgl.isBefore(end) || tgl.isSame(end));
      });
    }
    return sortedPOData;
  };

  const handleExport = async () => {
    const exportData = getExportPOData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monitoring PO");
    // Check role for export
    const userDataStr = localStorage.getItem("userData");
    const userDataObj = userDataStr ? JSON.parse(userDataStr) : {};
    const role = (userDataObj.role || "").toLowerCase();
    const userId = Number(userDataObj.id || userDataObj.id_user || 0);
    const isRestricted = role === "divisi" && ![98, 141].includes(userId);
    // Use isRestricted variable instead of isDivisi logic below (rename variable usage or keep isDivisi name representing restriction)
    const isDivisi = isRestricted;

    // Header sesuai urutan tabel monitoring PO
    // Header sesuai urutan tabel monitoring PO
    // Header sesuai urutan tabel monitoring PO
    const headers = [
      "NO. PO",
      "TANGGAL PO",
      "SUPPLIER",
      "DAFTAR BARANG",
      "QUANTITY PO",
      "SATUAN",
      "KETERANGAN",
      "HARGA SATUAN",
      "DISKON (%)",
      "DISKON (RP)",
      "PPN (%)",
      "PPN (RP)",
      "TOTAL",
      "GRAND TOTAL",
      "DIORDER OLEH",
      "ESTIMASI DITERIMA",
      "STATUS PENGIRIMAN",
      "STATUS",
      "TERMIN PEMBAYARAN",
      ...(isDivisi ? [] : [
        "NO. PR",
        "TANGGAL PR",
        "DIVISI",
        "NO. BTB",
        "TANGGAL BTB",
        "QUANTITY BTB",
        "SATUAN BTB",
        "BIAYA",
        "QUANTITY BELUM BTB"
      ]),
      "DIBUAT OLEH",
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
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(tgl)) return tgl;
      if (/^\d{2}-\d{2}-\d{4}$/.test(tgl)) return tgl.replace(/-/g, '/');
      if (/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
        const [y, m, d] = tgl.split("-");
        return `${d}/${m}/${y}`;
      }
      const d = dayjs(tgl);
      if (d.isValid()) {
        return d.format("DD/MM/YYYY");
      }
      return tgl;
    }

    let currentRowIdx = 2; // Start after header

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

      const poStartRow = currentRowIdx;

      const valOrEmpty = (val: any) => (val && Number(val) !== 0) ? Number(val) : "";

      if (flatItems.length > 0) {
        flatItems.forEach((item: any) => {
          const itemStartRow = currentRowIdx;

          // Helper to split arrays or wrap single value into array
          const noBTBArr = Array.isArray(item.noBTB) ? item.noBTB : (item.noBTB ? [item.noBTB] : []);
          const tglBTBArr = Array.isArray(item.tanggalBTB) ? item.tanggalBTB : (item.tanggalBTB ? [item.tanggalBTB] : []);
          const qtyBTBArr = Array.isArray(item.qtyBTB) ? item.qtyBTB : (item.qtyBTB !== undefined ? [item.qtyBTB] : []);
          const satBTBArr = Array.isArray(item.satuanBTB) ? item.satuanBTB : (item.satuanBTB ? [item.satuanBTB] : []);
          const biayaBTBArr = Array.isArray(item.biayaAmbil) ? item.biayaAmbil : (item.biayaAmbil !== undefined ? [item.biayaAmbil] : []);
          const qBelumArr = Array.isArray(item.qtyBelumBTB) ? item.qtyBelumBTB : (item.qtyBelumBTB !== undefined ? [item.qtyBelumBTB] : []);

          // Determine max rows needed for this item based on BTB entries
          // At least 1 row even if no BTB
          const maxRows = Math.max(noBTBArr.length, 1);

          for (let k = 0; k < maxRows; k++) {
            const row = worksheet.getRow(currentRowIdx);

            // Prepare BTB specific values
            const btbNo = noBTBArr[k] || "";
            const btbTgl = tglBTBArr[k] || "";
            const btbQty = qtyBTBArr[k] !== undefined ? qtyBTBArr[k] : "";
            const btbSat = satBTBArr[k] || "";
            const btbBiayaRaw = biayaBTBArr[k];
            let btbBiaya = "";
            if (btbBiayaRaw !== null && btbBiayaRaw !== undefined && btbBiayaRaw !== "-" && btbBiayaRaw !== "") {
              const num = Number(btbBiayaRaw);
              btbBiaya = "Rp. " + num.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } else if (btbBiayaRaw === "-") {
              btbBiaya = "-";
            }

            const btbQBelum = qBelumArr[k] !== undefined ? qBelumArr[k] : "";

            // Data Array mapping
            const rowData = [
              po.noPO ? po.noPO.toUpperCase() : "",           // 1
              formatTanggalExcel(po.tanggalPO),               // 2
              po.supplier ? po.supplier.toUpperCase() : "",   // 3
              item.namaBarang ? item.namaBarang.toUpperCase() : "", // 4
              valOrEmpty(item.jumlahPO || item.jumlahAsli),   // 5
              item.satuan ? item.satuan.toUpperCase() : "",   // 6
              item.keterangan ? item.keterangan.toUpperCase() : "", // 7
              valOrEmpty(item.hargaSatuan),                   // 8
              item.diskonPersen ? String(item.diskonPersen) : "", // 9 (String)
              valOrEmpty(item.diskonNominal),                 // 10
              item.ppnItem ? String(item.ppnItem) : "",       // 11
              valOrEmpty(item.ppnAmount),                     // 12
              valOrEmpty(item.totalPerItem),                  // 13
              valOrEmpty(po.totalPembayaran),                 // 14
              item.namaPembeli ? item.namaPembeli.replace(/_/g, " ").toUpperCase() : "", // 15
              formatTanggalExcel(po.estimasiTanggalTerima),   // 16
              po.statusPengiriman ? po.statusPengiriman.toUpperCase() : "", // 17
              po.status ? po.status.toUpperCase() : "",       // 18
              po.termin ? po.termin.toUpperCase() : "",       // 19
              ...(isDivisi ? [] : [
                item.noPR || "",
                formatTanggalExcel(item.tanggalPR),
                item.divisi || "",
                btbNo,
                btbTgl,
                typeof btbQty === 'number' ? formatQuantity(btbQty) : btbQty,
                btbSat,
                btbBiaya,
                typeof btbQBelum === 'number' ? formatQuantity(btbQBelum) : btbQBelum
              ]),
              po.orderedBy ? po.orderedBy.replace(/_/g, " ").toUpperCase() : "", // 20
            ];

            // Set Values
            rowData.forEach((val, idx) => {
              const cell = row.getCell(idx + 1);
              cell.value = val;

              // Special handling for Diskon % (Col 9) to ignore text error
              if (idx + 1 === 9) {
                // @ts-ignore
                cell.ignoredErrors = { numberStoredAsText: true };
              }
            });

            currentRowIdx++;
          }

          // Merge Item Cells if > 1 row
          const itemEndRow = currentRowIdx - 1;
          if (itemEndRow > itemStartRow) {
            // Merge Item cols: 4-13 and 15
            // Also merge PR cols: 20-22 (if !isDivisi) -> Indices: 20(noPR), 21(tglPR), 22(divisi)
            const itemMergeCols = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15];
            if (!isDivisi) {
              itemMergeCols.push(20, 21, 22);
            }
            itemMergeCols.forEach(col => {
              try { worksheet.mergeCells(itemStartRow, col, itemEndRow, col); } catch (e) { }
            });
          }
        });
      } else {
        // No items, single row
        const row = worksheet.getRow(currentRowIdx);
        const rowData = [
          po.noPO ? po.noPO.toUpperCase() : "",
          formatTanggalExcel(po.tanggalPO),
          po.supplier ? po.supplier.toUpperCase() : "",
          "", "", "", "", "", "", "", "", "", "",
          valOrEmpty(po.totalPembayaran),
          "", // 15 (Nama Pembeli not available in single row usually)
          formatTanggalExcel(po.estimasiTanggalTerima),
          po.statusPengiriman ? po.statusPengiriman.toUpperCase() : "",
          po.status ? po.status.toUpperCase() : "",
          po.termin ? po.termin.toUpperCase() : "",
          po.orderedBy ? po.orderedBy.replace(/_/g, " ").toUpperCase() : "",
        ];
        rowData.forEach((val, idx) => {
          row.getCell(idx + 1).value = val;
        });
        currentRowIdx++;
      }

      // Merge Cells check
      const poEndRow = currentRowIdx - 1;
      if (poEndRow > poStartRow) {
        // Columns to merge: 1, 2, 3, 14, 15, 16, 17, 18, 19, and the last column (DIBUAT OLEH)
        const lastColIdx = headers.length;
        const mergeCols = [1, 2, 3, 14, 15, 16, 17, 18, 19, lastColIdx];
        mergeCols.forEach(col => {
          try {
            worksheet.mergeCells(poStartRow, col, poEndRow, col);
          } catch (e) { }
        });
      }
    });

    // Set number/currency formats
    // Column 5: Quantity PO (#,##0)
    // Column 8: Harga Satuan (Currency)
    // Column 10: Diskon Rp
    // Column 12: PPN Rp
    // Column 13: Total Item
    // Column 14: Grand Total (Currency)
    const currencyFmt = '_("Rp."* #,##0_);_("Rp."* (#,##0);_("Rp."* "-"_);_(@_)';

    // Apply formats to columns
    worksheet.getColumn(5).numFmt = '#,##0'; // Qty
    worksheet.getColumn(8).numFmt = currencyFmt; // Harga Satuan
    worksheet.getColumn(10).numFmt = currencyFmt; // Diskon Rp
    worksheet.getColumn(12).numFmt = currencyFmt; // PPN Rp
    worksheet.getColumn(13).numFmt = currencyFmt; // Total
    worksheet.getColumn(14).numFmt = currencyFmt; // Grand Total

    // Auto-fit columns based on max length of cell values
    worksheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell && column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? String(cell.value) : "";
        // Add padding to prevent #######
        const extraPadding = (cellValue.length > 0 && /^\d+$/.test(cellValue)) ? 8 : 4;
        maxLength = Math.max(maxLength, cellValue.length + extraPadding);
      });
      column.width = Math.min(maxLength, 60);
    });

    // Set row styling
    worksheet.eachRow((row, rowNumber) => {
      row.height = rowNumber === 1 ? 25 : 20;
      row.alignment = { vertical: "top", horizontal: "left", wrapText: true };
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          right: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
        };
      });
      // Center align specific columns if needed
      if (rowNumber > 1) {
        row.getCell(2).alignment = { vertical: 'top', horizontal: 'center' }; // Tanggal
        row.getCell(14).alignment = { vertical: 'top', horizontal: 'right' }; // Grand Total
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
        const res = await fetch(`${API_BASE_URL}/api/po/${id}`, {
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
          {/* Export section: Enhanced Next Level UI */}
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
                      Export Data PO
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
                        <span className="text-xl font-bold text-primary">{sortedPOData.length}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center">
                        Mengunduh semua data yang tampil saat ini.
                      </p>
                    </TabsContent>

                    <TabsContent value="selected" className="mt-4 space-y-2">
                      <div className="p-3 bg-gray-50 rounded-md border text-center">
                        <span className="text-xs text-muted-foreground block mb-1">Data Terpilih</span>
                        <span className={`text-xl font-bold ${selectedPOs.length > 0 ? 'text-primary' : 'text-gray-400'}`}>
                          {selectedPOs.length}
                        </span>
                      </div>
                      {selectedPOs.length === 0 && (
                        <p className="text-[10px] text-red-500 text-center">
                          Pilih checkbox pada tabel terlebih dahulu.
                        </p>
                      )}
                    </TabsContent>

                    <TabsContent value="range" className="mt-4 space-y-3">
                      <div className="grid gap-2">
                        <div className="grid gap-1">
                          <Label className="text-xs">Tanggal Mulai</Label>
                          <div className="relative">
                            <Input
                              type="date"
                              value={exportStartDate}
                              onChange={(e) => setExportStartDate(e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-xs">Tanggal Akhir</Label>
                          <div className="relative">
                            <Input
                              type="date"
                              value={exportEndDate}
                              onChange={(e) => setExportEndDate(e.target.value)}
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
                      (exportMode === "selected" && selectedPOs.length === 0) ||
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
                            NO. PO
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
                            TANGGAL PO
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
                            SUPPLIER
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
                            DAFTAR BARANG
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
                            QUANTITY PO
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
                            SATUAN
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
                            KETERANGAN
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
                            HARGA SATUAN
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
                      DISKON (%)
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
                      DISKON (RP)
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
                      PPN (RP)
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
                      TOTAL
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
                            GRAND TOTAL
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
                      ORDERED BY
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
                            ESTIMASI DITERIMA
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
                            STATUS PENGIRIMAN
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
                            STATUS
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
                    {/* TERMIN PEMBAYARAN */}
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
                      TERMIN PEMBAYARAN
                    </TableHead>
                    {/* --- KOLOM BARU (Hidden for Divisi) --- */}
                    {/* --- KOLOM BARU (Hidden for Divisi) --- */}
                    {!isDivisi && (
                      <>
                        <TableHead className="min-w-[120px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>NO. PR</TableHead>
                        <TableHead className="min-w-[100px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>TANGGAL PR</TableHead>
                        <TableHead className="min-w-[100px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>DIVISI</TableHead>
                        <TableHead className="min-w-[120px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>NO. BTB</TableHead>
                        <TableHead className="min-w-[100px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>TANGGAL BTB</TableHead>
                        <TableHead className="min-w-[80px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>QUANTITY BTB</TableHead>
                        <TableHead className="min-w-[80px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>SATUAN BTB</TableHead>
                        <TableHead className="min-w-[100px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>BIAYA</TableHead>
                        <TableHead className="min-w-[100px] border border-gray-300 px-3 py-1 text-center sticky-header-cell uppercase" style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6", borderBottom: "2px solid #d1d5db" }}>QUANTITY BELUM BTB</TableHead>
                      </>
                    )}
                    {/* ORDERED BY (Moved to end) */}
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            DIBUAT OLEH
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
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span
                                          onClick={() => {
                                            window.location.href = `/po/input?id=${po.id}`;
                                          }}
                                          className="cursor-pointer transition-colors duration-200 hover:text-blue-600 text-gray-700"
                                        >
                                          {po.noPO}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Klik untuk edit</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
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
                              {/* --- Ubah: Quantity PO ambil dari jumlahPO --- */}
                              {item.jumlahPO}
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
                              Rp {Number(item.hargaSatuan).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            {/* Kolom baru: Diskon (%) */}
                            <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-left min-w-[90px] uppercase">
                              {(typeof item.diskonPersen === "string" && item.diskonPersen.includes("+"))
                                ? item.diskonPersen
                                : formatPersen(item.diskonPersen)}
                            </TableCell>
                            {/* Kolom baru: Diskon (Rp) */}
                            <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-left min-w-[90px] uppercase">
                              {item.diskonNominal
                                ? `Rp ${Number(
                                  item.diskonNominal
                                ).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : ""}
                            </TableCell>
                            {/* Kolom baru: PPN (%) */}
                            <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-left min-w-[90px] uppercase">
                              {formatPersen(item.ppnItem)}
                            </TableCell>
                            {/* Kolom baru: PPN (Rp) */}
                            <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-left min-w-[90px] uppercase">
                              {item.ppnAmount
                                ? `Rp ${Number(item.ppnAmount).toLocaleString(
                                  "id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                                )}`
                                : ""}
                            </TableCell>
                            <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-left min-w-[110px] uppercase">
                              {typeof item.totalPerItem !== "undefined" &&
                                item.totalPerItem !== null
                                ? `Rp ${Number(
                                  item.totalPerItem
                                ).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
                                  {po.totalPembayaran.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>

                                {/* --- KOLOM BARU: Nama Pembeli (display dari item pertama) --- */}
                                <TableCell
                                  key="namaPembeli"
                                  rowSpan={allItems.length}
                                  className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[120px] uppercase"
                                >
                                  {allItems[0]?.namaPembeli ?? ""}
                                </TableCell>
                              </>
                            ) : null}

                            {/* --- SPLIT COLUMNS (Estimasi, Status Pengiriman, Status) --- */}
                            {/* Render per baris (per item) agar sejajar */}
                            <TableCell
                              className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[140px] uppercase"
                            >
                              {formatTanggal(po.estimasiTanggalTerima)}
                            </TableCell>
                            <TableCell
                              className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[140px] uppercase"
                            >
                              {po.statusPengiriman ?? ""}
                            </TableCell>
                            <TableCell
                              className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[100px] uppercase"
                            >
                              {getStatusBadge(po.status || "")}
                            </TableCell>
                            {itemIndex === 0 ? (
                              <>
                                <TableCell
                                  key="termin"
                                  rowSpan={allItems.length}
                                  className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[100px] uppercase"
                                >
                                  {po.termin ?? "-"}
                                </TableCell>
                              </>
                            ) : null}

                            {/* --- KOLOM BARU CELLS (Hidden for Divisi) - Render PER ITEM --- */}
                            {!isDivisi && (
                              <>
                                <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[120px] uppercase">{item.noPR}</TableCell>
                                <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[100px] uppercase">{formatTanggal(item.tanggalPR)}</TableCell>
                                <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[100px] uppercase">{item.divisiPR}</TableCell>
                                <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[120px] uppercase whitespace-nowrap">
                                  {Array.isArray(item.noBTB) && item.noBTB.length > 0 ? (
                                    item.noBTB.map((val: string, idx: number) => (
                                      <div key={idx} className="py-1 border-b last:border-0 border-gray-100">{val}</div>
                                    ))
                                  ) : "-"}
                                </TableCell>
                                <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[100px] uppercase whitespace-nowrap">
                                  {Array.isArray(item.tanggalBTB) && item.tanggalBTB.length > 0 ? (
                                    item.tanggalBTB.map((val: string, idx: number) => (
                                      <div key={idx} className="py-1 border-b last:border-0 border-gray-100">{val}</div>
                                    ))
                                  ) : ""}
                                </TableCell>
                                <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[80px] uppercase whitespace-nowrap">
                                  {Array.isArray(item.qtyBTB) && item.qtyBTB.length > 0 ? (
                                    item.qtyBTB.map((val: string, idx: number) => (
                                      <div key={idx} className="py-1 border-b last:border-0 border-gray-100">{val}</div>
                                    ))
                                  ) : ""}
                                </TableCell>
                                <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[80px] uppercase whitespace-nowrap">
                                  {Array.isArray(item.satuanBTB) && item.satuanBTB.length > 0 ? (
                                    item.satuanBTB.map((val: string, idx: number) => (
                                      <div key={idx} className="py-1 border-b last:border-0 border-gray-100">{val}</div>
                                    ))
                                  ) : ""}
                                </TableCell>
                                <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-left min-w-[100px] uppercase whitespace-nowrap">
                                  {Array.isArray(item.biayaAmbil) && item.biayaAmbil.length > 0 ? (
                                    item.biayaAmbil.map((val: number | null, idx: number) => (
                                      <div key={idx} className="py-1 border-b last:border-0 border-gray-100">
                                        {val !== null ? `Rp. ${val.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
                                      </div>
                                    ))
                                  ) : ""}
                                </TableCell>
                                <TableCell className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[100px] uppercase whitespace-nowrap">
                                  {Array.isArray(item.qtyBelumBTB) && item.qtyBelumBTB.length > 0 ? (
                                    item.qtyBelumBTB.map((val: string, idx: number) => (
                                      <div key={idx} className="py-1 border-b last:border-0 border-gray-100">{val}</div>
                                    ))
                                  ) : ""}
                                </TableCell>
                              </>
                            )}

                            {itemIndex === 0 ? (
                              <>
                                <TableCell
                                  key="orderedBy"
                                  rowSpan={allItems.length}
                                  className="px-3 py-1 border-r border-gray-300 align-middle text-center min-w-[100px] uppercase"
                                >
                                  {po.orderedBy?.replace(/_/g, " ") ?? ""}
                                </TableCell>
                              </>
                            ) : null}
                            {/* <TableCell
                                  key="skema"
                                  rowSpan={allItems.length}
                                  className="px-3 py-1 border border-gray-300 align-middle text-center min-w-[100px] uppercase"
                                >
                                  {skemaMap[String(po.skema)] ?? po.skema ?? ""}
                                </TableCell> */}
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
