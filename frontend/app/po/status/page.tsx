"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, ChevronDown } from "lucide-react";
import type { PRData, POData } from "@/lib/dummy-data";
import { Input } from "@/components/ui/input";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
// Tambahkan import react-datepicker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "react-datepicker/dist/react-datepicker.css";
// import * as ExcelJS from "exceljs"; // Removed Export
import { API_BASE_URL } from "@/lib/config";

export default function StatusPOPage() {
  const [prData, setPrData] = useState<any[]>([]);
  // --- Vertical scroll button state and ref ---
  const verticalScrollRef = React.useRef<HTMLDivElement>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  useEffect(() => {
    const checkScroll = () => {
      const el = verticalScrollRef.current;
      if (el) {
        setShowScrollButtons(el.scrollHeight > el.clientHeight + 10);
      }
    };
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);
  // Add PO data state for PO creation logic
  const [poData, setPoData] = useState<POData[]>(() => {
    // Try to load from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('poData');
      if (stored) return JSON.parse(stored);
    }
    return [];
  });
  const [prItemData, setPrItemData] = useState<any[]>([]);
  const [satuanOptions, setSatuanOptions] = useState<any[]>([]);
  const [divisiOptions, setDivisiOptions] = useState<any[]>([]);
  const [urgensiOptions, setUrgensiOptions] = useState<any[]>([]);
  const [selectedPRsForProcess, setSelectedPRsForProcess] = useState<string[]>([]);
  const [userSkema, setUserSkema] = useState<string>("");
  // Tambahkan state untuk id_skema user
  const [userSkemaId, setUserSkemaId] = useState<string | null>(null);

  // Filter states for table columns
  const [searchTerm, setSearchTerm] = useState("");
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
  const [filterNoPR, setFilterNoPR] = useState<string[]>([]);
  const [noPRSearchTerm, setNoPRSearchTerm] = useState("");
  const [filterTanggalPR, setFilterTanggalPR] = useState<string[]>([]);
  const [tanggalPRSearchTerm, setTanggalPRSearchTerm] = useState("");
  const [filterNamaBarang, setFilterNamaBarang] = useState("");
  const [filterQty, setFilterQty] = useState<number[]>([]);
  const [filterQtySearchTerm, setFilterQtySearchTerm] = useState("");
  const [filterSatuan, setFilterSatuan] = useState<string[]>([]);
  const [satuanSearchTerm, setSatuanSearchTerm] = useState("");
  const [filterKeterangan, setFilterKeterangan] = useState("");
  const [filterUrgensi, setFilterUrgensi] = useState<string[]>([]);
  const [urgensiSearchTerm, setUrgensiSearchTerm] = useState("");
  const [filterDivisi, setFilterDivisi] = useState<string[]>([]);
  const [divisiSearchTerm, setDivisiSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [statusSearchTerm, setStatusSearchTerm] = useState("");
  const [filterDibuatOleh, setFilterDibuatOleh] = useState<string[]>([]);
  const [dibuatOlehSearchTerm, setDibuatOlehSearchTerm] = useState("");
  const [filterSkema, setFilterSkema] = useState<string[]>([]);
  const [skemaSearchTerm, setSkemaSearchTerm] = useState("");

  // Pagination states


  // NEW: state untuk menyimpan item terpilih per PR (map: prId -> array of item ids)
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, string[]>>({});
  // Ref untuk sticky scrollbar
  // (Removed unused refs and sync effect)


  useEffect(() => {
    // Fetch PR, PR Item, satuan, divisi, urgensi dari backend
    const fetchPRData = async () => {
      const prRes = await fetch(API_BASE_URL + "/api/pr");
      const prList = await prRes.json();
      const prItemRes = await fetch(API_BASE_URL + "/api/pr-item");
      const prItemList = await prItemRes.json();
      const satuanRes = await fetch(API_BASE_URL + "/api/satuan");
      const satuanList = await satuanRes.json();
      const divisiRes = await fetch(API_BASE_URL + "/api/divisi");
      const divisiList = await divisiRes.json();
      const urgensiRes = await fetch(API_BASE_URL + "/api/urgensi");
      const urgensiList = await urgensiRes.json();
      setPrData(prList);
      setPrItemData(prItemList);
      setSatuanOptions(satuanList);
      setDivisiOptions(divisiList);
      setUrgensiOptions(urgensiList);
    };
    fetchPRData();
    // Get schema from userData
    const userDataString = localStorage.getItem("userData");
    const userData = userDataString ? JSON.parse(userDataString) : null;
    setUserSkema(userData?.skema || "");
    // Ambil id_skema dari userData
    setUserSkemaId(String(userData?.id_skema ?? userData?.skema ?? ""));
  }, []);

  const savePOData = (data: POData[]) => {
    localStorage.setItem("poData", JSON.stringify(data));
    setPoData(data);
  };

  // Toggle selection of a single item for a PR
  const toggleItemSelection = (
    prId: string,
    itemId: string,
    checked: boolean
  ) => {
    setSelectedItemsMap((prev) => {
      const cur = new Set(prev[prId] || []);
      if (checked) cur.add(itemId);
      else cur.delete(itemId);
      return { ...prev, [prId]: Array.from(cur) };
    });
    // Ensure PR-level checkbox status mirrors item selection
    setSelectedPRsForProcess((prev) => {
      const hasAny =
        checked ||
        (prev.includes(prId) && (selectedItemsMap[prId] || []).length > 0);
      if (checked && !prev.includes(prId)) return [...prev, prId];
      if (!checked) {
        const remaining = (selectedItemsMap[prId] || []).filter(
          (id) => id !== itemId
        );
        if (remaining.length === 0) return prev.filter((id) => id !== prId);
      }
      return prev;
    });
  };

  const handleProcessPRtoPO = () => {
    if (selectedPRsForProcess.length === 0) {
      alert("Pilih minimal satu PR untuk diproses menjadi PO");
      return;
    }

    // Get selected PR data
    const selectedPRData = prData.filter((pr) =>
      selectedPRsForProcess.includes(pr.id)
    );

    // Generate PO number
    const poNumber = `PO/2024/${String(poData.length + 1).padStart(3, "0")}`;

    // Create PO items from selected PRs, only taking items with jumlah > 0
    const newPoItems = selectedPRData.map((pr) => ({
      prId: pr.id,
      noPR: pr.noPR,
      items: pr.items
        .filter((item) => item.jumlah > 0)
        .map((item) => ({
          ...item,
          hargaSatuan: 0,
          jumlahPO: item.jumlah,
          jumlahAsli: item.jumlah,
        })),
    }));

    // Create new PO
    const userDataString = localStorage.getItem("userData");
    const userData = userDataString ? JSON.parse(userDataString) : null;
    const orderedByUser = userData?.username || "Admin";

    const newPO: POData = {
      id: `PO-${Date.now()}`,
      noPO: poNumber,
      tanggalPO: new Date().toISOString().split("T")[0],
      supplier: "", // Will be set by user
      diskon: "0",
      originalDiskon: "0",
      ppn: 11,
      totalPembayaran: 0,
      orderedBy: orderedByUser, // Get from user data
      estimasiTanggalDiterima: "",
      statusPengiriman: "SC",
      statusPermintaan: "SC",
      prIds: selectedPRData.map((pr) => pr.id),
      poItems: newPoItems,
      status: "Menunggu",
      keterangan: `PO dari ${selectedPRsForProcess.length} PR`,
      createdAt: new Date().toISOString(),
    };

    // Save new PO
    const updatedPOData = [...poData, newPO];
    savePOData(updatedPOData);

    // Update PR quantities based on PO items
    const updatedPRData = prData.map((pr) => {
      if (selectedPRsForProcess.includes(pr.id)) {
        // Find corresponding PO items for this PR
        const poItemForPR = newPoItems.find((poItem) => poItem.prId === pr.id);
        if (!poItemForPR) return pr;

        // Update each item quantity in PR by subtracting PO quantity
        const updatedItems = pr.items.map((item) => {
          const poItem = poItemForPR.items.find(
            (poIt) => poIt.id === item.id || poIt.namaBarang === item.namaBarang
          );
          if (poItem) {
            const newJumlah = item.jumlah - poItem.jumlahPO;
            return { ...item, jumlah: newJumlah > 0 ? newJumlah : 0 };
          }
          return item;
        });

        // Check if all items are fully processed
        const allItemsProcessed = updatedItems.every(
          (item) => item.jumlah === 0
        );
        const newStatus = allItemsProcessed ? "Telah Selesai" : "Gantung";

        return {
          ...pr,
          items: updatedItems,
          status: newStatus as PRData["status"],
        };
      }
      return pr;
    });

    localStorage.setItem("prData", JSON.stringify(updatedPRData));
    setPrData(updatedPRData);

    // Reset selections
    setSelectedPRsForProcess([]);

    alert(
      `PO ${poNumber} berhasil dibuat dari ${selectedPRsForProcess.length} PR!`
    );
  };

  // Helper mapping id_satuan ke nama satuan
  const satuanMap = Object.fromEntries(
    satuanOptions.map((s: any) => [String(s.id_satuan), s.satuan])
  );
  // Helper mapping id_divisi ke nama divisi
  const divisiMap = Object.fromEntries(
    divisiOptions.map((d: any) => [String(d.id_divisi), d.divisi])
  );
  // Helper mapping id_urgensi ke nama urgensi
  const urgensiMap = Object.fromEntries(
    urgensiOptions.map((u: any) => [String(u.id_urgensi), u.urgensi])
  );

  // Mapping PR + items
  const processedPRs = prData
    .filter(
      (pr) => {
        const validStatuses = [
          "MENUNGGU", // legacy
          "GANTUNG",  // legacy
          "WAITING PO",
          "PARTIAL PO",
          "DRAFT"
        ];
        const s = (pr.status || "").toUpperCase();
        // Exclude WAITING PART / SELESAI / TELAH SELESAI / DITOLAK
        if (["SELESAI", "TELAH SELESAI", "DITOLAK", "WAITING PART"].includes(s)) return false;
        return validStatuses.includes(s) &&
          // Filter hanya PR dengan id_skema sesuai user login
          (!userSkemaId || String(pr.id_skema ?? pr.skema) === userSkemaId);
      }
    )
    .map((pr) => ({
      ...pr,
      items: prItemData
        .filter((item) => String(item.id_PR) === String(pr.id_PR))
        // --- Pastikan urutan item sesuai urutan input PR ---
        .sort((a, b) => Number(a.id_PRItem) - Number(b.id_PRItem))
        .map((item) => ({
          namaBarang: item.namaBarang,
          jumlah: item.jumlah,
          satuan:
            satuanMap[String(item.id_satuan)] ||
            item.satuanLabel ||
            item.id_satuan,
          keterangan: item.keterangan,
          id: item.id_PRItem,
          status: item.status || "",
        })),
      urgensi:
        urgensiMap[String(pr.id_urgensi)] || pr.urgensiLabel || pr.id_urgensi,
      divisi: divisiMap[String(pr.id_divisi)] || pr.divisiLabel || pr.id_divisi,
      dibuatOleh: pr.dibuatOleh,
      skema: pr.id_skema,
      skemaLabel: pr.skemaLabel ?? "",
      noPR: pr.noPR,
      noMR: pr.noMR, // Added NO MR mapping
      tanggalPR: pr.tanggalPR,
      status: pr.status,
    }));

  // When user toggles PR-level checkbox, select/deselect all items of that PR
  const handleSelectPR = (prId: string, checked: boolean) => {
    if (checked) {
      // select all items for prId
      const pr = processedPRs.find(
        (p) => String(p.id_PR ?? p.id) === String(prId)
      );
      const allIds = (pr?.items || []).map((it: any) => String(it.id));
      setSelectedItemsMap((prev) => ({ ...prev, [prId]: allIds }));
      setSelectedPRsForProcess((prev) =>
        prev.includes(prId) ? prev : [...prev, prId]
      );
    } else {
      // deselect all items
      setSelectedItemsMap((prev) => {
        const n = { ...prev };
        delete n[prId];
        return n;
      });
      setSelectedPRsForProcess((prev) => prev.filter((id) => id !== prId));
    }
  };



  // Badge status
  function getStatusBadge(status: string) {
    const s = (status || "").toUpperCase();

    if (s === "WAITING PO" || s === "DRAFT" || s === "MENUNGGU") {
      return (
        <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-700 border border-blue-300 text-xs font-semibold">
          WAITING PO
        </span>
      );
    }
    if (s === "PARCIAL PO" || s === "PARTIAL PO" || s === "GANTUNG") {
      return (
        <span className="inline-block px-2 py-1 rounded bg-orange-100 text-orange-700 border border-orange-300 text-xs font-semibold">
          PARTIAL PO
        </span>
      );
    }
    if (s === "WAITING PART" || s === "SELESAI" || s === "TELAH SELESAI") {
      return (
        <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 border border-green-300 text-xs font-semibold">
          WAITING PART
        </span>
      );
    }
    if (s === "DITOLAK") {
      return (
        <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-700 border border-red-300 text-xs font-semibold">
          DITOLAK
        </span>
      );
    }

    // Default status lain
    return (
      <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-700 border border-gray-300 text-xs font-semibold">
        {status || "-"}
      </span>
    );
  }

  // Badge urgensi seperti monitoring PR
  const getUrgensiBadge = (urgensi: string) => {
    if (urgensi === "High") {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-300">High</Badge>
      );
    }
    if (urgensi === "Medium") {
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-300">
          Medium
        </Badge>
      );
    }
    if (urgensi === "Low") {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-300">
          Low
        </Badge>
      );
    }
    return (
      <Badge className="bg-muted/50 text-muted-foreground">{urgensi}</Badge>
    );
  };



  // --- FILTER & SEARCH ---
  // Compute unique values for dropdowns
  const uniqueNoPR = Array.from(
    new Set(processedPRs.map((pr) => pr.noPR))
  ).sort();
  const uniqueTanggalPR = Array.from(
    new Set(processedPRs.map((pr) => pr.tanggalPR))
  ).sort();
  const uniqueSatuan = Array.from(
    new Set(
      processedPRs
        .flatMap((pr) => pr.items?.map((item) => item.satuan) || [])
        .map((s) => String(s ?? ""))
    )
  )
    .filter((s) => s.trim() !== "")
    .sort();
  const uniqueQty = Array.from(
    new Set(
      processedPRs.flatMap((pr) => pr.items?.map((item) => item.jumlah) || [])
    )
  ).sort((a, b) => a - b);
  const uniqueUrgensi = ["High", "Medium", "Low"]; // List opsi untuk filter MultiSelect
  const uniqueStatus = ["WAITING PO", "PARTIAL PO", "MENUNGGU", "GANTUNG", "DRAFT"];
  const uniqueDivisi = divisiOptions.map((d: any) => d.divisi);
  const uniqueDibuatOleh = Array.from(
    new Set(processedPRs.map((pr) => pr.dibuatOleh))
  ).sort();
  const uniqueSkema = Array.from(
    new Set(processedPRs.map((pr) => pr.skema))
  ).sort();

  // Helper untuk format tanggal DD-MM-YYYY pakai dayjs local
  function formatTanggal(tgl: string) {
    if (!tgl) return "";
    return dayjs(tgl).local().format("DD-MM-YYYY");
  }

  // Filter data
  let filteredPRs = processedPRs
    .filter((pr) => {
      const matchesSearch =
        (pr.items &&
          pr.items.some(
            (item) =>
              typeof item.namaBarang === "string" &&
              item.namaBarang.toLowerCase().includes(searchTerm.toLowerCase())
          )) ||
        (typeof pr.noPR === "string" &&
          pr.noPR.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesNamaBarang =
        !filterNamaBarang ||
        pr.items?.some(
          (item) =>
            typeof item.namaBarang === "string" &&
            item.namaBarang
              .toLowerCase()
              .includes(filterNamaBarang.toLowerCase())
        );

      const matchesQty =
        filterQty.length === 0 ||
        pr.items?.some((item) => filterQty.includes(item.jumlah));

      const matchesSatuan =
        filterSatuan.length === 0 ||
        pr.items?.some((item) => filterSatuan.includes(item.satuan));

      const matchesKeterangan =
        !filterKeterangan ||
        pr.items?.some(
          (item) =>
            item.keterangan &&
            item.keterangan
              .toLowerCase()
              .includes(filterKeterangan.toLowerCase())
        );

      const matchesUrgensi =
        filterUrgensi.length === 0 || filterUrgensi.includes(pr.urgensi);

      const matchesDivisi =
        filterDivisi.length === 0 || filterDivisi.includes(pr.divisi);

      const matchesStatus =
        filterStatus.length === 0 || filterStatus.includes(pr.status);

      const matchesNoPR =
        filterNoPR.length === 0 ||
        filterNoPR.some((noPr) =>
          pr.noPR.toLowerCase().includes(noPr.toLowerCase())
        );

      const matchesTanggalPR =
        filterTanggalPR.length === 0 || filterTanggalPR.includes(pr.tanggalPR);

      const matchesDibuatOleh =
        filterDibuatOleh.length === 0 ||
        filterDibuatOleh.includes(pr.dibuatOleh);

      const matchesSkema =
        filterSkema.length === 0 ||
        (pr.skema !== undefined && filterSkema.includes(pr.skema));

      // --- FILTER BY TANGGAL RENTANG (pakai DatePicker) ---
      let matchesDateRange = true;
      if (filterStartDate && filterEndDate) {
        // pr.tanggalPR format: yyyy-mm-dd atau yyyy-mm-ddTHH:mm:ss
        const tglStr = (pr.tanggalPR || "").split("T")[0];
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
        matchesUrgensi &&
        matchesDivisi &&
        matchesStatus &&
        matchesNoPR &&
        matchesTanggalPR &&
        matchesDibuatOleh &&
        matchesSkema &&
        matchesDateRange // <-- tambahkan ini
      );
    })
  // --- SORTING: PR TERBARU → TERLAMA (PAKAI PARSER) ---
  filteredPRs = sortPRList(filteredPRs);

  // --- PAGINATION ---
  // --- PAGINATION REMOVED ---
  const paginatedData = filteredPRs;

  // Per-page select all -> select all items of PRs on current page
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Pilih semua item pada semua PR di halaman ini
      const newSelectedItemsMap = { ...selectedItemsMap };
      const newSelectedPRs: string[] = [...selectedPRsForProcess];
      paginatedData.forEach((pr) => {
        const prId = String(pr.id_PR);
        const itemIds = (pr.items || [])
          .filter((item: any) => item.jumlah > 0)
          .map((item: any) => String(item.id));
        newSelectedItemsMap[prId] = itemIds;
        if (!newSelectedPRs.includes(prId)) newSelectedPRs.push(prId);
      });
      setSelectedItemsMap(newSelectedItemsMap);
      setSelectedPRsForProcess(newSelectedPRs);
    } else {
      // Deselect semua item pada semua PR di halaman ini
      const newSelectedItemsMap = { ...selectedItemsMap };
      paginatedData.forEach((pr) => {
        const prId = String(pr.id_PR);
        newSelectedItemsMap[prId] = [];
        setSelectedItemsMap(newSelectedItemsMap);
        setSelectedPRsForProcess((prev) =>
          prev.filter(
            (id) => !paginatedData.some((pr) => String(pr.id_PR) === id)
          )
        );
      });
    }
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

  // Tambahkan helper untuk cek semua/some item selected
  function isAllItemsSelected(pr: any) {
    const itemIds = (pr.items || [])
      .filter((item: any) => item.jumlah > 0)
      .map((item: any) => String(item.id));
    const selected = selectedItemsMap[String(pr.id_PR)] || [];
    return (
      itemIds.length > 0 && itemIds.every((id: string) => selected.includes(id))
    );
  }
  function isSomeItemsSelected(pr: any) {
    const itemIds = (pr.items || [])
      .filter((item: any) => item.jumlah > 0)
      .map((item: any) => String(item.id));
    const selected = selectedItemsMap[String(pr.id_PR)] || [];
    return selected.length > 0 && selected.length < itemIds.length;
  }

  // =====================================
  // 1. PARSER No. PR (E-WALK + PENTACITY)
  // =====================================
  // =====================================
  // 1. PARSER No. PR (ROBUST NUMERIC)
  // =====================================
  // =====================================
  // 1. PARSER No. PR (ROBUST NUMERIC)
  // =====================================
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

  // =====================================
  // 2. SORTING PR LIST
  // =====================================
  function sortPRList(filteredPRData: any[]) {
    return [...filteredPRData].sort((a, b) => {
      // 1. Sort by Year (ASC)
      const pA = parsePRNumber(a.noPR);
      const pB = parsePRNumber(b.noPR);

      if (pA.year !== pB.year) return pA.year - pB.year;
      // 2. Sort by Month (ASC)
      if (pA.month !== pB.month) return pA.month - pB.month;
      // 3. Sort by Sequence (ASC)
      return pA.seq - pB.seq;
    });
  }

  // Export function removed  // Export function removed


  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Input PO</h1>
            <p className="text-muted-foreground">
              Pilih PR dan buat Purchase Order
            </p>
          </div>
          <div className="flex space-x-2">
            {/* Export button removed */}
            {selectedPRsForProcess.length > 0 ? (
              <Button
                onClick={async () => {
                  // Ambil selected PR + hanya item terpilih
                  const selectedPRData = processedPRs
                    .filter((pr) =>
                      selectedPRsForProcess.includes(String(pr.id_PR))
                    )
                    .map((pr) => {
                      const pickedIds =
                        selectedItemsMap[String(pr.id_PR)] || [];
                      const items = (pr.items || []).filter((it: any) =>
                        pickedIds.includes(String(it.id))
                      );
                      return { ...pr, items };
                    })
                    .filter((pr) => (pr.items || []).length > 0);

                  if (selectedPRData.length === 0) {
                    alert(
                      "Pilih minimal satu item dari PR untuk diproses menjadi PO"
                    );
                    return;
                  }

                  // Simpan hanya item yang dipilih ke localStorage untuk halaman Input PO
                  localStorage.setItem(
                    "selectedPRsForPO",
                    JSON.stringify(selectedPRData)
                  );
                  window.location.href = "/po/input";
                }}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Input PO ({selectedPRsForProcess.length})
              </Button>
            ) : (
              <div className="text-sm text-muted-foreground">
                Pilih PR untuk membuat PO
              </div>
            )}
          </div>
        </div>

        {/* Search Bar & Filter Tanggal */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Input
            placeholder="Cari No PR atau Nama Barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[320px]"
          />
          {/* Filter rentang tanggal PR pakai DatePicker */}
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">Tanggal PR:</span>
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

        {/* PR Siap Proses ke PO */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>PR Siap Proses ke PO</CardTitle>
            <CardDescription>
              Total: {filteredPRs.length} PR | Dipilih: {selectedPRsForProcess.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ position: "relative" }}>
              {/* Vertical scroll up button */}
              {showScrollButtons && (
                <button
                  type="button"
                  aria-label="Scroll Up"
                  onClick={() => {
                    if (verticalScrollRef.current) {
                      verticalScrollRef.current.scrollBy({ top: -120, behavior: "smooth" });
                    }
                  }}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    zIndex: 40,
                    background: "#e5e7eb",
                    border: "1px solid #d1d5db",
                    borderRadius: "0.5rem 0.5rem 0 0",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                    cursor: "pointer"
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 12l5-5 5 5" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              )}
              {/* Vertical scroll down button */}
              {showScrollButtons && (
                <button
                  type="button"
                  aria-label="Scroll Down"
                  onClick={() => {
                    if (verticalScrollRef.current) {
                      verticalScrollRef.current.scrollBy({ top: 120, behavior: "smooth" });
                    }
                  }}
                  style={{
                    position: "absolute",
                    right: 0,
                    bottom: 0,
                    zIndex: 40,
                    background: "#e5e7eb",
                    border: "1px solid #d1d5db",
                    borderRadius: "0 0 0.5rem 0.5rem",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                    cursor: "pointer"
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              )}
              <div
                ref={verticalScrollRef}
                data-custom-vertical-scroll
                style={{
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  overflowX: 'auto', // Explicit horizontal scroll
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                }}
              >
                <Table className="border-collapse border border-gray-300 min-w-[1200px] table-auto">
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead
                        className="w-16 border border-gray-300 px-3 py-1 text-center align-middle sticky-header-cell"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6", // bg-gray-100
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        {/* Checkbox Select All */}
                        <Checkbox
                          checked={
                            (paginatedData.every((pr) => {
                              const itemIds = (pr.items || [])
                                .filter((item: any) => item.jumlah > 0)
                                .map((item: any) => String(item.id));
                              const selected =
                                selectedItemsMap[String(pr.id_PR)] || [];
                              return (
                                itemIds.length > 0 &&
                                itemIds.every((id: string) =>
                                  selected.includes(id)
                                )
                              );
                            }) && paginatedData.length > 0)
                              ? true
                              : paginatedData.some((pr) => {
                                const itemIds = (pr.items || [])
                                  .filter((item: any) => item.jumlah > 0)
                                  .map((item: any) => String(item.id));
                                const selected =
                                  selectedItemsMap[String(pr.id_PR)] || [];
                                return (
                                  selected.length > 0 &&
                                  (selected.length < itemIds.length ||
                                    !itemIds.every((id: string) =>
                                      selected.includes(id)
                                    ))
                                );
                              })
                                ? "indeterminate"
                                : false
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
                        className="min-w-[140px] border border-gray-300 px-3 py-1 text-center sticky-header-cell"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        {/* No. PR */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" className="h-auto p-0 font-medium uppercase">
                              NO. PR
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari No. PR..."
                              value={noPRSearchTerm}
                              onChange={(e) => setNoPRSearchTerm(e.target.value)}
                            />
                            <div className="max-h-40 overflow-y-auto mt-2">
                              {uniqueNoPR
                                .filter((no) =>
                                  no
                                    .toLowerCase()
                                    .includes(noPRSearchTerm.toLowerCase())
                                )
                                .map((no) => (
                                  <div
                                    key={no}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      checked={filterNoPR.includes(no)}
                                      onCheckedChange={(checked) => {
                                        if (checked)
                                          setFilterNoPR([...filterNoPR, no]);
                                        else
                                          setFilterNoPR(
                                            filterNoPR.filter((x) => x !== no)
                                          );
                                      }}
                                    />
                                    <Label className="text-sm">{no}</Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <div className="text-xs text-muted-foreground mt-1">(Terbaru di atas)</div>
                      </TableHead>
                      <TableHead
                        className="min-w-[140px] border border-gray-300 px-3 py-1 text-center sticky-header-cell"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        {/* Tanggal PR */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" className="h-auto p-0 font-medium uppercase">
                              TANGGAL PR
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari tanggal..."
                              value={tanggalPRSearchTerm}
                              onChange={(e) =>
                                setTanggalPRSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-40 overflow-y-auto mt-2">
                              {uniqueTanggalPR
                                .filter((tgl) =>
                                  tgl
                                    .toLowerCase()
                                    .includes(tanggalPRSearchTerm.toLowerCase())
                                )
                                .map((tgl) => (
                                  <div
                                    key={tgl}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      checked={filterTanggalPR.includes(tgl)}
                                      onCheckedChange={(checked) => {
                                        if (checked)
                                          setFilterTanggalPR([
                                            ...filterTanggalPR,
                                            tgl,
                                          ]);
                                        else
                                          setFilterTanggalPR(
                                            filterTanggalPR.filter(
                                              (x) => x !== tgl
                                            )
                                          );
                                      }}
                                    />
                                    <Label className="text-sm">{tgl}</Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="min-w-[140px] border border-gray-300 px-3 py-1 text-center sticky-header-cell"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        <div className="h-auto p-0 font-medium uppercase py-2">NO. MR</div>
                      </TableHead>
                      <TableHead
                        className="min-w-[180px] border border-gray-300 px-3 py-1 text-center sticky-header-cell"
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
                            <Button variant="ghost" className="h-auto p-0 font-medium uppercase">
                              NAMA BARANG
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari barang..."
                              value={filterNamaBarang}
                              onChange={(e) =>
                                setFilterNamaBarang(e.target.value)
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="min-w-[90px] border border-gray-300 px-3 py-1 text-center sticky-header-cell"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        {/* Qty */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" className="h-auto p-0 font-medium uppercase">
                              KUANTITAS
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari Qty..."
                              value={filterQtySearchTerm}
                              onChange={(e) =>
                                setFilterQtySearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-40 overflow-y-auto mt-2">
                              {uniqueQty
                                .filter((qty) =>
                                  String(qty)
                                    .toLowerCase()
                                    .includes(filterQtySearchTerm.toLowerCase())
                                )
                                .map((qty) => (
                                  <div
                                    key={qty}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      checked={filterQty.includes(qty)}
                                      onCheckedChange={(checked) => {
                                        if (checked)
                                          setFilterQty([...filterQty, qty]);
                                        else
                                          setFilterQty(
                                            filterQty.filter((x) => x !== qty)
                                          );
                                      }}
                                    />
                                    <Label className="text-sm">{qty}</Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="min-w-[90px] border border-gray-300 px-3 py-1 text-center sticky-header-cell"
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
                            <Button variant="ghost" className="h-auto p-0 font-medium uppercase">
                              SATUAN
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
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
                                    <Label className="text-sm">{s}</Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="min-w-[160px] border border-gray-300 px-3 py-1 text-center sticky-header-cell"
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
                            <Button variant="ghost" className="h-auto p-0 font-medium uppercase">
                              KETERANGAN
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari keterangan..."
                              value={filterKeterangan}
                              onChange={(e) =>
                                setFilterKeterangan(e.target.value)
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="min-w-[100px] border border-gray-300 px-3 py-1 text-center sticky-header-cell"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        {/* Urgensi */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" className="h-auto p-0 font-medium uppercase">
                              URGENSI
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari urgensi..."
                              value={urgensiSearchTerm}
                              onChange={(e) =>
                                setUrgensiSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-40 overflow-y-auto mt-2">
                              {uniqueUrgensi
                                .filter((u) =>
                                  u
                                    .toLowerCase()
                                    .includes(urgensiSearchTerm.toLowerCase())
                                )
                                .map((u) => (
                                  <div
                                    key={u}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      checked={filterUrgensi.includes(u)}
                                      onCheckedChange={(checked) => {
                                        if (checked)
                                          setFilterUrgensi([...filterUrgensi, u]);
                                        else
                                          setFilterUrgensi(
                                            filterUrgensi.filter((x) => x !== u)
                                          );
                                      }}
                                    />
                                    <Label className="text-sm">{u}</Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="min-w-[100px] border border-gray-300 px-3 py-1 text-center sticky-header-cell"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        {/* Divisi */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" className="h-auto p-0 font-medium uppercase">
                              DIVISI
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari divisi..."
                              value={divisiSearchTerm}
                              onChange={(e) =>
                                setDivisiSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-40 overflow-y-auto mt-2">
                              {uniqueDivisi
                                .filter((d) =>
                                  d
                                    .toLowerCase()
                                    .includes(divisiSearchTerm.toLowerCase())
                                )
                                .map((d) => (
                                  <div
                                    key={d}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      checked={filterDivisi.includes(d)}
                                      onCheckedChange={(checked) => {
                                        if (checked)
                                          setFilterDivisi([...filterDivisi, d]);
                                        else
                                          setFilterDivisi(
                                            filterDivisi.filter((x) => x !== d)
                                          );
                                      }}
                                    />
                                    <Label className="text-sm">{d}</Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="min-w-[100px] border border-gray-300 px-3 py-1 text-center sticky-header-cell"
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
                            <Button variant="ghost" className="h-auto p-0 font-medium uppercase">
                              STATUS
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari status..."
                              value={statusSearchTerm}
                              onChange={(e) =>
                                setStatusSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-40 overflow-y-auto mt-2">
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
                                    <Label className="text-sm">{s}</Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="min-w-[120px] border border-gray-300 px-3 py-1 text-center sticky-header-cell"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        {/* Dibuat Oleh */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" className="h-auto p-0 font-medium uppercase">
                              DIBUAT OLEH
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari pembuat..."
                              value={dibuatOlehSearchTerm}
                              onChange={(e) =>
                                setDibuatOlehSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-40 overflow-y-auto mt-2">
                              {uniqueDibuatOleh
                                .filter((d) =>
                                  d
                                    .toLowerCase()
                                    .includes(dibuatOlehSearchTerm.toLowerCase())
                                )
                                .map((d) => (
                                  <div
                                    key={d}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      checked={filterDibuatOleh.includes(d)}
                                      onCheckedChange={(checked) => {
                                        if (checked)
                                          setFilterDibuatOleh([
                                            ...filterDibuatOleh,
                                            d,
                                          ]);
                                        else
                                          setFilterDibuatOleh(
                                            filterDibuatOleh.filter(
                                              (x) => x !== d
                                            )
                                          );
                                      }}
                                    />
                                    <Label className="text-sm">{d}</Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      {/* <TableHead
                        className="min-w-[120px] border border-gray-300 px-3 py-1 text-center sticky-header-cell"
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
                            <Button variant="ghost" className="h-auto p-0 font-medium uppercase">
                              SKEMA
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari skema..."
                              value={skemaSearchTerm}
                              onChange={(e) => setSkemaSearchTerm(e.target.value)}
                            />
                            <div className="max-h-40 overflow-y-auto mt-2">
                              {uniqueSkema
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
                                    <Label className="text-sm">{s}</Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((pr) => {
                      const filteredItems =
                        pr.items?.filter((item) => item.jumlah > 0) || [];
                      if (filteredItems.length === 0) return null;
                      const prId = String(pr.id_PR);
                      const selectedItemIds = selectedItemsMap[prId] || [];
                      return (
                        <React.Fragment key={prId}>
                          {filteredItems.map((item, idx) => (
                            <TableRow key={`${prId}-item-${item.id}`} className="hover:bg-gray-50 transition-colors">
                              {/* Checkbox PR-level hanya di baris pertama PR */}
                              {idx === 0 ? (
                                <TableCell rowSpan={filteredItems.length} className="border border-gray-300 px-3 py-1 text-center align-middle">
                                  <Checkbox
                                    checked={
                                      isAllItemsSelected(pr)
                                        ? true
                                        : isSomeItemsSelected(pr)
                                          ? "indeterminate"
                                          : false
                                    }
                                    onCheckedChange={(checked) => {
                                      const allItemIds = filteredItems.map((it) =>
                                        String(it.id)
                                      );
                                      setSelectedItemsMap((prev) => ({
                                        ...prev,
                                        [prId]: checked ? allItemIds : [],
                                      }));
                                      setSelectedPRsForProcess((prev) =>
                                        checked
                                          ? prev.includes(prId)
                                            ? prev
                                            : [...prev, prId]
                                          : prev.filter((id) => id !== prId)
                                      );
                                    }}
                                  />
                                </TableCell>
                              ) : null}
                              {/* No. PR hanya di baris pertama */}
                              {idx === 0 ? (
                                <TableCell rowSpan={filteredItems.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap uppercase">
                                  {pr.noPR}
                                </TableCell>
                              ) : null}
                              {/* Tanggal PR hanya di baris pertama */}
                              {idx === 0 ? (
                                <TableCell rowSpan={filteredItems.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap">
                                  {formatTanggal(pr.tanggalPR)}
                                </TableCell>
                              ) : null}
                              {/* No. MR hanya di baris pertama - Added Column */}
                              {idx === 0 ? (
                                <TableCell rowSpan={filteredItems.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap uppercase">
                                  {pr.noMR || "-"}
                                </TableCell>
                              ) : null}
                              {/* Nama Barang */}
                              <TableCell className="border border-gray-300 px-3 py-1 text-left whitespace-nowrap uppercase">
                                <Checkbox
                                  checked={selectedItemIds.includes(
                                    String(item.id)
                                  )}
                                  onCheckedChange={(checked) => {
                                    setSelectedItemsMap((prev) => {
                                      const cur = new Set(prev[prId] || []);
                                      if (checked) cur.add(String(item.id));
                                      else cur.delete(String(item.id));
                                      const newArr = Array.from(cur);
                                      setSelectedPRsForProcess((prevPRs) => {
                                        if (
                                          newArr.length > 0 &&
                                          !prevPRs.includes(prId)
                                        )
                                          return [...prevPRs, prId];
                                        if (newArr.length === 0)
                                          return prevPRs.filter(
                                            (id) => id !== prId
                                          );
                                        return prevPRs;
                                      });
                                      return { ...prev, [prId]: newArr };
                                    });
                                  }}
                                />
                                <span className="ml-2">{item.namaBarang}</span>
                              </TableCell>
                              {/* Qty */}
                              <TableCell className="border border-gray-300 px-3 py-1 text-left whitespace-nowrap">
                                {Number(item.jumlah) % 1 === 0
                                  ? parseInt(item.jumlah)
                                  : item.jumlah}
                              </TableCell>
                              {/* Satuan */}
                              <TableCell className="border border-gray-300 px-3 py-1 text-left whitespace-nowrap uppercase">{item.satuan}</TableCell>
                              {/* Keterangan */}
                              <TableCell className="border border-gray-300 px-3 py-1 text-left">
                                <div
                                  className="max-w-xs truncate text-sm text-muted-foreground"
                                  title={item.keterangan}
                                >
                                  {/* Batasi maksimal 20 karakter */}
                                  {item.keterangan && item.keterangan.length > 20
                                    ? item.keterangan.slice(0, 20) + "..."
                                    : item.keterangan}
                                </div>
                              </TableCell>
                              {/* Urgensi hanya di baris pertama */}
                              {idx === 0 ? (
                                <TableCell rowSpan={filteredItems.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap">
                                  {getUrgensiBadge(pr.urgensi)}
                                </TableCell>
                              ) : null}
                              {/* Divisi hanya di baris pertama */}
                              {idx === 0 ? (
                                <TableCell rowSpan={filteredItems.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap">
                                  {pr.divisi}
                                </TableCell>
                              ) : null}
                              {/* Status (Un-merged) */}
                              <TableCell className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap">
                                {getStatusBadge(item.status)}
                              </TableCell>
                              {/* Dibuat Oleh hanya di baris pertama */}
                              {idx === 0 ? (
                                <TableCell rowSpan={filteredItems.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap">
                                  {pr.dibuatOleh?.replace(/_/g, " ")}
                                </TableCell>
                              ) : null}
                              {/* Skema hanya di baris pertama */}
                              {/* {idx === 0 ? (
                                <TableCell rowSpan={filteredItems.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap">
                                  {pr.skemaLabel || pr.skema}
                                </TableCell>
                              ) : null} */}
                            </TableRow>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {/* Sticky scrollbar horizontal (optional, can be kept if needed) */}
              {/* Removed fake sticky scrollbar */}
              <style jsx>{`
                .sticky {
                  position: sticky !important;
                }
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
                /* Custom vertical scrollbar for table */
                [data-custom-vertical-scroll]::-webkit-scrollbar {
                  width: 10px;
                  height: 10px; /* Style horizontal scrollbar too */
                }
                [data-custom-vertical-scroll]::-webkit-scrollbar-thumb {
                  background: #8b8b8b; /* Darker gray */
                  border-radius: 6px;
                }
                [data-custom-vertical-scroll]::-webkit-scrollbar-track {
                  background: #e5e7eb; /* Light gray */
                }
              `}</style>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}

      </div>
    </MainLayout >
  );
}
