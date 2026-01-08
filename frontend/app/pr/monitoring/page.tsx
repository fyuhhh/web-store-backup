"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Import exceljs for Excel export with style support
import * as ExcelJS from "exceljs";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
// Tambahkan import react-datepicker
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
  ShoppingCart,
  Search,
  Download,
  ChevronDown,
} from "lucide-react";

import { type PRData } from "@/lib/dummy-data";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const formatTanggal = (dateString: string | undefined) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function MonitoringPRPage() {
  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight");

  const [prData, setPrData] = useState<PRData[]>([]);
  const [poItems, setPoItems] = useState<any[]>([]); // Added state for PO validation
  const [selectedPRs, setSelectedPRs] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  // Filter states
  const [filterNamaBarang, setFilterNamaBarang] = useState("");
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
    if (highlight && prData.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(highlight);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
    }
  }, [highlight, prData]);

  // Hapus state filterQty dan filterQtySearchTerm
  // const [filterQty, setFilterQty] = useState<number[]>([]);
  // const [filterQtySearchTerm, setFilterQtySearchTerm] = useState("");
  const [filterQtyPRAwalMin, setFilterQtyPRAwalMin] = useState<number | "">("");
  const [filterQtyPRAwalMax, setFilterQtyPRAwalMax] = useState<number | "">("");
  const [filterSatuan, setFilterSatuan] = useState<string[]>([]);
  const [satuanSearchTerm, setSatuanSearchTerm] = useState("");
  const [filterKeterangan, setFilterKeterangan] = useState("");
  const [filterUrgensi, setFilterUrgensi] = useState<string[]>([]);
  const [urgensiSearchTerm, setUrgensiSearchTerm] = useState("");
  const [filterDivisi, setFilterDivisi] = useState<string[]>([]);
  const [divisiSearchTerm, setDivisiSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [statusSearchTerm, setStatusSearchTerm] = useState("");
  const [filterTanggalPR, setFilterTanggalPR] = useState<string[]>([]);
  const [tanggalPRSearchTerm, setTanggalPRSearchTerm] = useState("");
  const [filterNoPR, setFilterNoPR] = useState<string[]>([]);
  const [noPRSearchTerm, setNoPRSearchTerm] = useState("");

  // Compute unique NoPR values
  const uniqueNoPR = Array.from(
    new Set(
      prData
        .map((pr) => pr.noPR)
        .filter((n): n is string => n !== undefined && n.trim() !== "")
    )
  ).sort();
  const [filterDibuatOleh, setFilterDibuatOleh] = useState<string[]>([]);
  const [dibuatOlehSearchTerm, setDibuatOlehSearchTerm] = useState("");
  const [filterSkema, setFilterSkema] = useState<string[]>([]);
  const [skemaSearchTerm, setSkemaSearchTerm] = useState("");

  // Pagination states


  // Pindahkan deklarasi state referensi ke atas sebelum digunakan
  const [divisiOptions, setDivisiOptions] = useState<any[]>([]);
  const [urgensiOptions, setUrgensiOptions] = useState<any[]>([]);
  const [satuanOptions, setSatuanOptions] = useState<any[]>([]);
  const [skemaOptions, setSkemaOptions] = useState<any[]>([]);
  // Ganti default value dari "" ke "all"
  const [filterSkemaId, setFilterSkemaId] = useState<string>("all");
  // Compute unique values
  const uniqueSatuan = Array.from(
    new Set(prData.flatMap((pr) => pr.items?.map((item) => item.satuan) || []))
  ).sort();

  const uniqueUrgensi = ["Low", "Medium", "High"];
  const uniqueStatus = ["Menunggu", "Gantung", "Diproses"];
  // uniqueDivisi harus setelah divisiOptions dideklarasikan
  const uniqueDivisi = React.useMemo(
    () => divisiOptions.map((d: any) => d.divisi),
    [divisiOptions]
  );
  const uniqueTanggalPR = Array.from(
    new Set(
      prData
        .map((pr) => pr.tanggalPR)
        .filter((t): t is string => t !== undefined && t.trim() !== "")
    )
  ).sort();
  const uniqueDibuatOleh = Array.from(
    new Set(
      prData
        .map((pr) => pr.dibuatOleh)
        .filter((d): d is string => typeof d === "string" && d.trim() !== "")
    )
  ).sort();
  const uniqueSkema = Array.from(
    new Set(prData.map((pr) => pr.skema).filter((s) => !!s))
  ).sort();

  const [userSchema, setUserSchema] = useState<string>("");
  const [userSkema, setUserSkema] = useState<string>("");
  // Tambahkan state untuk id_skema user
  const [userSkemaId, setUserSkemaId] = useState<string | null>(null);

  useEffect(() => {
    // initializeDummyData(); // HAPUS BARIS INI
    fetch("http://192.168.10.10:5000/api/divisi")
      .then((res) => res.json())
      .then((data) => setDivisiOptions(data));
    fetch("http://192.168.10.10:5000/api/urgensi")
      .then((res) => res.json())
      .then((data) => setUrgensiOptions(data));
    fetch("http://192.168.10.10:5000/api/satuan")
      .then((res) => res.json())
      .then((data) => setSatuanOptions(data));
    fetch("http://192.168.10.10:5000/api/skema")
      .then((res) => res.json())
      .then((data) => setSkemaOptions(data));
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    setUserSchema(userData.schema || "");
    setUserSkema(userData.skema || "");
    // Ambil id_skema dari localStorage (userData)
    setUserSkemaId(String(userData.id_skema ?? userData.skema ?? ""));
  }, []);

  useEffect(() => {
    // loadPRData dipanggil setelah data referensi didapat
    if (
      divisiOptions.length > 0 &&
      urgensiOptions.length > 0 &&
      satuanOptions.length > 0
    ) {
      loadPRData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [divisiOptions, urgensiOptions, satuanOptions]);



  const loadPRData = async () => {
    const prRes = await fetch("http://192.168.10.10:5000/api/pr");
    const prList = await prRes.json();
    const prItemRes = await fetch("http://192.168.10.10:5000/api/pr-item");
    const prItemList = await prItemRes.json();

    // Fetch PO Items for validation
    try {
      const poItemRes = await fetch("http://192.168.10.10:5000/api/po-item");
      const poItemList = await poItemRes.json();
      setPoItems(Array.isArray(poItemList) ? poItemList : []);
    } catch (e) { console.error("Failed to fetch PO items", e); }

    // LOG: Tampilkan tanggalPR yang diterima dari backend
    console.log(
      "PR dari backend:",
      prList.map((pr: any) => ({
        id_PR: pr.id_PR,
        noPR: pr.noPR,
        tanggalPR: pr.tanggalPR,
      }))
    );

    // Helper mapping dari id ke nama
    const satuanMap = Object.fromEntries(
      satuanOptions.map((s: any) => [String(s.id_satuan), s.satuan])
    );
    const divisiMap = Object.fromEntries(
      divisiOptions.map((d: any) => [String(d.id_divisi), d.divisi])
    );
    const urgensiMap = Object.fromEntries(
      urgensiOptions.map((u: any) => [String(u.id_urgensi), u.urgensi])
    );

    const validatedData = prList.map((pr: any) => {
      // --- Perubahan: urutkan items berdasarkan id_PRItem ASC ---
      const items = prItemList
        .filter((item: any) => String(item.id_PR) === String(pr.id_PR))
        .sort((a: any, b: any) => {
          // Pastikan id_PRItem ada dan berupa angka
          const idA = Number(a.id_PRItem ?? 0);
          const idB = Number(b.id_PRItem ?? 0);
          return idA - idB;
        })
        .map((item: any) => ({
          id_PRItem: item.id_PRItem,
          namaBarang: item.namaBarang || item.namabarang,
          jumlah: item.jumlah,
          quantityAwalPR: item.quantityAwalPR,
          satuan: satuanMap[String(item.id_satuan)] || item.id_satuan,
          id_satuan: item.id_satuan, // Pass id_satuan explicitly
          keterangan: item.keterangan,
          status: item.status,
        }));

      return {
        id: pr.id_PR,
        noPR: pr.noPR,
        tanggalPR: pr.tanggalPR,
        items,
        urgensi: urgensiMap[String(pr.id_urgensi)] || pr.id_urgensi,
        divisi: divisiMap[String(pr.id_divisi)] || pr.id_divisi,
        status: pr.status,
        dibuatOleh: pr.dibuatOleh,
        skema: pr.id_skema,
        skemaLabel: pr.skemaLabel ?? "",
      };
    });

    // Urutkan sehingga PR terbaru (tanggalPR terbaru) muncul paling atas
    validatedData.sort((a: any, b: any) => {
      // Gunakan string comparison agar tidak kena timezone bug
      const ta = a.tanggalPR ? a.tanggalPR.replace(/-/g, "") : "";
      const tb = b.tanggalPR ? b.tanggalPR.replace(/-/g, "") : "";
      return tb.localeCompare(ta);
    });

    setPrData(validatedData);

    // --- Tambahan: update status PR jika semua item jumlah = 0 tapi status masih "Menunggu" ---
    // Setelah update status, reload data agar tampilan sesuai
    // (hindari infinite loop, reload hanya jika ada perubahan)
    // Cek jika ada PR yang statusnya berubah

  };

  const savePRData = (data: PRData[]) => {
    localStorage.setItem("prData", JSON.stringify(data));
    // Ensure type safety when setting state
    setPrData(data as PRData[]);
  };



  // Ganti handleDelete agar bisa menerima array id
  const handleDelete = async (ids: string[] | string) => {
    const idList = Array.isArray(ids) ? ids : [ids];
    setDeleteIds(idList);
    setDeleteChoiceOpen(true);
    setDeleteMode(null);
  };

  // Fungsi untuk handle pilihan hapus PR atau hapus item
  const handleDeleteChoice = (mode: "pr" | "item") => {
    setDeleteMode(mode);
    setDeleteChoiceOpen(false);
    if (mode === "pr") {
      setConfirmDeleteOpen(true);
    } else if (mode === "item") {
      // Siapkan data item dari PR yang dipilih
      const prItems = prData
        .filter((pr) => deleteIds.includes(pr.id))
        .map((pr) => ({
          prId: pr.id,
          items:
            pr.items?.map((item: any) => ({
              ...item,
              prId: pr.id,
            })) ?? [],
        }));
      setSelectedPRItemsForDelete(prItems);
      setSelectedItemIdsToDelete([]);
      setDeleteItemModalOpen(true);
    }
  };

  // Fungsi hapus item PR yang dipilih
  const confirmDeleteItems = async () => {
    setDeleteItemModalOpen(false);
    try {
      // Tambahkan log untuk debug id yang akan dihapus
      console.log("Selected item ids to delete:", selectedItemIdsToDelete);
      for (const itemId of selectedItemIdsToDelete) {
        // Cari id_PRItem asli dari prItems
        let idToDelete = itemId;
        for (const pr of selectedPRItemsForDelete) {
          const found = pr.items.find(
            (item: any, idx: number) =>
              (item.id_PRItem && String(item.id_PRItem) === itemId) ||
              (!item.id_PRItem &&
                `${item.namaBarang}-${item.jumlah}-${idx}` === itemId)
          );
          if (found && found.id_PRItem) {
            idToDelete = String(found.id_PRItem);
            break;
          }
        }
        console.log("Deleting PR Item id_PRItem:", idToDelete);
        const resp = await fetch(
          `http://192.168.10.10:5000/api/pr-item/${idToDelete}`,
          {
            method: "DELETE",
          }
        );
        const respJson = await resp.json().catch(() => ({}));
        console.log("Delete response:", resp.status, respJson);
      }
      // Setelah hapus, update status PR terkait

      // Setelah hapus, reload data dari backend
      await loadPRData();
      setToastMsg("Item PR berhasil dihapus.");
      setToastOpen(true);
    } catch (err) {
      console.error("Error deleting PR item:", err);
      setToastMsg("Gagal menghapus item PR.");
      setToastOpen(true);
    }
    setSelectedItemIdsToDelete([]);
  };

  const confirmDelete = async () => {
    setConfirmDeleteOpen(false);
    try {
      let anyError = false;
      for (const id of deleteIds) {
        const resp = await fetch(`http://192.168.10.10:5000/api/pr/${id}`, { method: "DELETE" });
        const respJson = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          // Show backend error message if PR cannot be deleted
          setToastMsg(respJson.message || "Gagal menghapus karena PR sudah di proses");
          setToastType("error");
          setToastOpen(true);
          anyError = true;
          continue;
        }
        await fetch(`http://192.168.10.10:5000/api/pr-item/by-pr/${id}`, {
          method: "DELETE",
        });
      }
      if (!anyError) {
        setToastMsg("PR dan item berhasil dihapus.");
        setToastType("success");
        setToastOpen(true);
      }
      const updatedData = prData.filter((pr) => !deleteIds.includes(pr.id));
      setPrData(updatedData);
      setSelectedPRs(selectedPRs.filter((prId) => !deleteIds.includes(prId)));
      loadPRData();
    } catch (error) {
      setToastMsg("Terjadi kesalahan saat menghapus PR.");
      setToastType("error");
      setToastOpen(true);
    }
    setDeleteIds([]);
  };

  const handleSelectPR = (prId: string, checked: boolean) => {
    if (checked) {
      setSelectedPRs([...selectedPRs, prId]);
    } else {
      setSelectedPRs(selectedPRs.filter((id) => id !== prId));
    }
  };

  // Perbaiki handleSelectAll agar hanya memilih PR yang sedang difilter
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPRs(paginatedData.map((pr) => pr.id));
    } else {
      setSelectedPRs([]);
    }
  };

  // Perbaiki handleCreatePO - hanya redirect ke PO status page tanpa mengubah status PR
  const handleCreatePO = () => {
    if (selectedPRs.length === 0) {
      alert("Pilih minimal satu PR untuk diproses ke PO");
      return;
    }
    // Simpan data PR yang dipilih ke localStorage untuk PO (tanpa mengubah status)
    const selectedPRData = prData.filter((pr) => selectedPRs.includes(pr.id));
    localStorage.setItem("selectedPRsForPO", JSON.stringify(selectedPRData));
    window.location.href = "/po/status";
  };

  // Ambil daftar PR yang sudah diproses ke PO dari localStorage
  const getProcessedPRIds = (): string[] => {
    try {
      const data = JSON.parse(localStorage.getItem("selectedPRsForPO") || "[]");
      return Array.isArray(data) ? data.map((pr: any) => pr.id) : [];
    } catch {
      return [];
    }
  };

  // Helper untuk format tanggal DD-MM-YYYY
  function formatTanggal(tgl: string) {
    if (!tgl) return "";
    return dayjs(tgl).local().format("DD-MM-YYYY");
  }

  // Filter data: hanya tampilkan PR dengan id_skema sesuai user login
  const filteredPRData = prData
    .filter((pr) => (userSkemaId ? String(pr.skema) === userSkemaId : true))
    .filter((pr) => {
      // --- Tambahkan pencarian global ---
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        (pr.items &&
          pr.items.some(
            (item) =>
              typeof item.namaBarang === "string" &&
              item.namaBarang.toLowerCase().includes(searchLower)
          )) ||
        (typeof pr.noPR === "string" &&
          pr.noPR.toLowerCase().includes(searchLower));

      const matchesNamaBarang =
        !filterNamaBarang ||
        pr.items?.some(
          (item) =>
            typeof item.namaBarang === "string" &&
            item.namaBarang
              .toLowerCase()
              .includes(filterNamaBarang.toLowerCase())
        );

      // Hapus matchesQty
      // const matchesQty =
      //   filterQty.length === 0 ||
      //   pr.items?.some((item) => filterQty.includes(item.jumlah));

      const matchesQtyPRAwal =
        (filterQtyPRAwalMin === "" ||
          pr.items?.some(
            (item) => item.quantityAwalPR >= Number(filterQtyPRAwalMin)
          )) &&
        (filterQtyPRAwalMax === "" ||
          pr.items?.some(
            (item) => item.quantityAwalPR <= Number(filterQtyPRAwalMax)
          ));

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
        // matchesQty, // HAPUS INI
        matchesQtyPRAwal &&
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
    // Ganti filter logic: jika "all", tampilkan semua
    .filter(
      (pr) => filterSkemaId === "all" || String(pr.skema) === filterSkemaId
    );

  // =====================================
  // 1. PARSER No. PR (E-WALK + PENTACITY)
  // =====================================
  // =====================================
  // 2. SORTING PR ROBUST (NUMERIC SEQ ASC)
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



  // =====================================
  // 3. PEMAKAIAN
  // =====================================
  const sortedPRDataFinal = sortPRList(filteredPRData);



  // Pagination logic
  // Pagination removed
  const paginatedData = sortedPRDataFinal;

  const getUrgensiBadge = (urgensi: string) => {
    if (urgensi === "Low") {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-300">
          Low
        </Badge>
      );
    }
    if (urgensi === "Medium") {
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-300">
          Medium
        </Badge>
      );
    }
    if (urgensi === "High") {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-300">High</Badge>
      );
    }
    return (
      <Badge className="bg-muted/50 text-muted-foreground">{urgensi}</Badge>
    );
  };

  // Fungsi badge status PR (samakan dengan PO/Status)
  function getStatusBadge(status: string) {
    const s = (status || "").toUpperCase();
    if (s === "WAITING PO" || s === "MENUNGGU") {
      return (
        <span className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold">
          WAITING PO
        </span>
      );
    }
    if (s === "PARTIAL PO" || s === "PARCIAL PO" || s === "GANTUNG") {
      return (
        <span className="inline-block px-2 py-1 rounded bg-orange-100 text-orange-800 border-orange-200 text-xs font-semibold">
          PARTIAL PO
        </span>
      );
    }

    // Handle PART COMPLETE separately (Green)
    if (s === "PART COMPLETE" || s === "SELESAI" || s === "TELAH SELESAI") {
      return (
        <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-800 border-green-200 text-xs font-semibold">
          PART COMPLETE
        </span>
      );
    }
    // Handle WAITING PART and PARTIAL PART (Yellow/Orange family or distinct)
    // User wants "PARTIAL PART" to be visible
    if (s === "PARTIAL PART") {
      return (
        <span className="inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-800 border-yellow-200 text-xs font-semibold">
          PARTIAL PART
        </span>
      );
    }
    // WAITING PART (Green/Blue indicator that order is placed but waiting arrival)
    if (s === "WAITING PART") {
      return (
        <span className="inline-block px-2 py-1 rounded bg-indigo-100 text-indigo-800 border-indigo-200 text-xs font-semibold">
          WAITING PART
        </span>
      );
    }
    if (s === "DITOLAK") {
      return (
        <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-800 border-red-200 text-xs font-semibold">
          DITOLAK
        </span>
      );
    }
    // Default
    return (
      <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-800 border-gray-200 text-xs font-semibold">
        {status}
      </span>
    );
  }

  const [exportMode, setExportMode] = useState<"all" | "selected" | "range">(
    "all"
  );
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  // Data untuk export sesuai mode
  const getExportPRData = () => {
    if (exportMode === "selected") {
      return sortedPRDataFinal.filter((pr) => selectedPRs.includes(pr.id));
    }
    if (exportMode === "range" && exportStartDate && exportEndDate) {
      return sortedPRDataFinal.filter(
        (pr) => pr.tanggalPR >= exportStartDate && pr.tanggalPR <= exportEndDate
      );
    }
    return sortedPRDataFinal;
  };

  const handleExport = async () => {
    const exportPRData = getExportPRData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monitoring PR");

    // Header sesuai UI persis (tanpa Skema karena di-hide)
    const headers = [
      "No. PR",
      "Tanggal",
      "Daftar Barang",
      "Kuantitas",
      "Satuan",
      "Keterangan",
      "Urgensi",
      "Divisi",
      "Status",
      "Dibuat Oleh",
    ];

    // Add header row with bold font and styling
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
      // Handle DD-MM-YYYY
      if (/^\d{2}-\d{2}-\d{4}$/.test(tgl)) return tgl;

      // Ambil bagian tanggal saja jika format ISO (YYYY-MM-DDTHH:mm:ss...)
      let datePart = tgl;
      if (tgl.includes("T")) {
        datePart = tgl.split("T")[0];
      }

      // Handle YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        const [y, m, d] = datePart.split("-");
        return `${d}-${m}-${y}`;
      }

      // Fallback
      const d = dayjs(tgl);
      if (d.isValid()) return d.format("DD-MM-YYYY");
      return tgl;
    }

    // Helper untuk bersihkan skema (Not used in columns currently, but kept if needed)
    // const getSkemaLabel = ...

    // Prepare and add data rows
    exportPRData.forEach((pr) => {
      // Logic items persis TableBody: const validItems = pr.items || [];
      const validItems = pr.items || [];

      if (validItems.length > 0) {
        validItems.forEach((item, index) => {
          worksheet.addRow([
            index === 0 ? pr.noPR : "",
            index === 0 ? formatTanggalExcel(pr.tanggalPR) : "",
            item.namaBarang,
            Number(item.quantityAwalPR || item.jumlah || 0), // Use Number() for correct Excel format
            item.satuan ?? "",
            item.keterangan || "",
            pr.urgensi,
            index === 0 ? pr.divisi : "",
            pr.status,
            index === 0 ? pr.dibuatOleh : "",
          ]);
        });
        // Set number format for 'Kuantitas' (column 4)
        worksheet.getColumn(4).numFmt = '#,##0';
      } else {
        // Handle PR tanpa item
        worksheet.addRow([
          pr.noPR,
          formatTanggalExcel(pr.tanggalPR),
          "",
          "",
          "",
          "",
          pr.urgensi,
          pr.divisi,
          pr.status,
          pr.dibuatOleh,
        ]);
      }
    });

    // Auto-fit columns based on max length of cell values
    worksheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell && column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? String(cell.value) : "";
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = maxLength > 50 ? 50 : maxLength;
    });

    // Set row heights for better readability
    worksheet.eachRow((row, rowNumber) => {
      row.height = rowNumber === 1 ? 25 : 20;
      row.alignment = { vertical: "top", horizontal: "left", wrapText: true };
    });

    // Freeze header row
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    // Generate XLSX file and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monitoring-pr-${new Date().toISOString().split("T")[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Fungsi untuk menghitung sisa qty PR per barang
  function getQtyPR(pr: any, item: any, poData: any[]): number {
    let totalQtyPO = 0;
    poData.forEach((po) => {
      po.poItems?.forEach((poItem: any) => {
        if (poItem.noPR === pr.noPR) {
          poItem.items?.forEach((itm: any) => {
            if (itm.namaBarang === item.namaBarang) {
              totalQtyPO += itm.jumlahPO ?? 0;
            }
          });
        }
      });
    });
    const qtyAwal = item.quantityAwalPR ?? item.jumlah;
    return Math.max(0, qtyAwal - totalQtyPO);
  }

  // Ambil data PO dari localStorage
  const [poData, setPOData] = useState<any[]>([]);
  useEffect(() => {
    const poRaw = localStorage.getItem("poData");
    let poArr: any[] = [];
    try {
      poArr = poRaw ? JSON.parse(poRaw) : [];
    } catch {
      poArr = [];
    }
    setPOData(poArr);
  }, []);

  // --- Add minimalist modal and toast components ---
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
          className={`bg-white border border-gray-200 shadow-lg rounded px-4 py-2 flex items-center gap-2 animate-fade-in ${toastType === "error" ? "border-red-400" : "border-green-200"
            }`}
        >
          <span
            className={`font-medium ${toastType === "error" ? "text-red-600" : "text-green-600"
              }`}
          >
            {message}
          </span>
          <Button size="sm" variant="ghost" onClick={onClose}>
            ×
          </Button>
        </div>
      </div>,
      document.body
    );
  }

  // --- Add state for modal and toast ---
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Tambahkan state untuk modal pilihan hapus
  const [deleteChoiceOpen, setDeleteChoiceOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"pr" | "item" | null>(null);
  const [deleteItemModalOpen, setDeleteItemModalOpen] = useState(false);
  const [selectedPRItemsForDelete, setSelectedPRItemsForDelete] = useState<
    { prId: string; items: any[] }[]
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

  // Hitung summary status


  // Tambahkan ref dan state untuk sticky scrollbar
  const tableWrapperRef = useRef<HTMLDivElement>(null);


  return (
    <MainLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Monitoring PR
            </h1>
            <p className="text-muted-foreground">
              Lihat dan kelola Purchase Request yang sudah dibuat
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-gray-200">
            {/* --- Filter skema --- */}
            {/* <div className="flex items-center gap-2">
              <Label htmlFor="filterSkemaId" className="text-xs font-medium">
                Filter Skema
              </Label>
              <Select value={filterSkemaId} onValueChange={setFilterSkemaId}>
                <SelectTrigger id="filterSkemaId" className="w-[140px] h-9">
                  <SelectValue placeholder="Semua Skema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Skema</SelectItem>
                  {skemaOptions.map((skema) => (
                    <SelectItem
                      key={skema.id_skema}
                      value={String(skema.id_skema)}
                    >
                      {skema.skema}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}
            {/* --- existing export mode filter --- */}
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
                  (exportMode === "selected" && selectedPRs.length === 0) ||
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

        {/* Search Bar & Filter Tanggal PR */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Input
            placeholder="Cari No. PR atau Nama Barang..."
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

        {/* Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Daftar Purchase Request</CardTitle>
            <CardDescription>
              Total: {filteredPRData.length} PR | Dipilih: {selectedPRs.length}
            </CardDescription>
            {selectedPRs.length > 0 && (
              <Button
                variant="destructive"
                className="mt-2"
                onClick={() => handleDelete(selectedPRs)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus PR/Item Terpilih ({selectedPRs.length})
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div
                ref={tableWrapperRef}
                className="overflow-x-auto overflow-y-auto"
                style={{
                  maxHeight: "70vh",
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                <Table className="border border-gray-300 min-w-[1200px]">
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead
                        className="w-16 border border-gray-300 px-3 py-1 text-center align-middle"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          boxShadow: "inset 0 -2px 0 #d1d5db",
                          borderRight: "1px solid #d1d5db",
                        }}
                      >
                        <Checkbox
                          checked={
                            selectedPRs.length === paginatedData.length &&
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
                        className="min-w-[140px] border border-gray-300 px-3 py-1 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          boxShadow: "inset 0 -2px 0 #d1d5db",
                          borderRight: "1px solid #d1d5db",
                        }}
                      >
                        {/* No. PR popover */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" className="h-auto p-0 font-medium uppercase">
                              NO. PR
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                            <Label className="text-sm font-medium">Cari No. PR</Label>
                            <Input
                              placeholder="Cari No. PR..."
                              value={noPRSearchTerm}
                              onChange={(e) => setNoPRSearchTerm(e.target.value)}
                              className="mb-2"
                            />
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {uniqueNoPR
                                .filter((noPR) =>
                                  noPR
                                    .toLowerCase()
                                    .includes(noPRSearchTerm.toLowerCase())
                                )
                                .map((noPR) => (
                                  <div key={noPR} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`noPR-${noPR}`}
                                      checked={filterNoPR.includes(noPR)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setFilterNoPR([...filterNoPR, noPR]);
                                        } else {
                                          setFilterNoPR(
                                            filterNoPR.filter((f) => f !== noPR)
                                          );
                                        }
                                      }}
                                    />
                                    <Label
                                      htmlFor={`noPR-${noPR}`}
                                      className="text-sm"
                                    >
                                      {noPR}
                                    </Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>

                      <TableHead
                        className="min-w-[140px] border border-gray-300 px-3 py-1 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          boxShadow: "inset 0 -2px 0 #d1d5db",
                          borderRight: "1px solid #d1d5db",
                        }}
                      >
                        {/* Tanggal popover */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-auto p-0 font-medium uppercase"
                            >
                              TANGGAL
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                            <Label className="text-sm font-medium">
                              Cari Tanggal PR
                            </Label>
                            <Input
                              type="date"
                              value={tanggalPRSearchTerm}
                              onChange={(e) =>
                                setTanggalPRSearchTerm(e.target.value)
                              }
                              className="mb-2"
                            />
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {uniqueTanggalPR
                                .filter((tgl) =>
                                  formatTanggal(tgl)
                                    .toLowerCase()
                                    .includes(tanggalPRSearchTerm.toLowerCase())
                                )
                                .map((tgl) => (
                                  <div
                                    key={tgl}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`tglPR-${tgl}`}
                                      checked={filterTanggalPR.includes(tgl)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setFilterTanggalPR([
                                            ...filterTanggalPR,
                                            tgl,
                                          ]);
                                        } else {
                                          setFilterTanggalPR(
                                            filterTanggalPR.filter(
                                              (f) => f !== tgl
                                            )
                                          );
                                        }
                                      }}
                                    />
                                    <Label
                                      htmlFor={`tglPR-${tgl}`}
                                      className="text-sm"
                                    >
                                      {formatTanggal(tgl)}
                                    </Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="min-w-[180px] border border-gray-300 px-3 py-1 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          boxShadow: "inset 0 -2px 0 #d1d5db",
                          borderRight: "1px solid #d1d5db",
                        }}
                      >
                        {/* Daftar Barang popover */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-auto p-0 font-medium uppercase"
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
                              placeholder="Cari nama barang..."
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
                        className="min-w-[90px] border border-gray-300 px-3 py-1 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          boxShadow: "inset 0 -2px 0 #d1d5db",
                          borderRight: "1px solid #d1d5db",
                        }}
                      >
                        {/* Quantity popover */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-auto p-0 font-medium uppercase"
                            >
                              KUANTITAS
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                            <Label className="text-sm font-medium">
                              Qty PR Awal Min
                            </Label>
                            <Input
                              type="number"
                              placeholder="Min"
                              value={filterQtyPRAwalMin}
                              onChange={(e) =>
                                setFilterQtyPRAwalMin(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                              className="mb-2"
                            />
                            <Label className="text-sm font-medium">
                              Qty PR Awal Max
                            </Label>
                            <Input
                              type="number"
                              placeholder="Max"
                              value={filterQtyPRAwalMax}
                              onChange={(e) =>
                                setFilterQtyPRAwalMax(
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
                        className="min-w-[90px] border border-gray-300 px-3 py-1 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          boxShadow: "inset 0 -2px 0 #d1d5db",
                          borderRight: "1px solid #d1d5db",
                        }}
                      >
                        {/* Satuan popover */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-auto p-0 font-medium uppercase"
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
                                .filter((satuan) =>
                                  (satuan ?? "")
                                    .toLowerCase()
                                    .includes(satuanSearchTerm.toLowerCase())
                                )
                                .map((satuan) => (
                                  <div
                                    key={satuan}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`satuan-${satuan}`}
                                      checked={filterSatuan.includes(satuan)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setFilterSatuan([
                                            ...filterSatuan,
                                            satuan,
                                          ]);
                                        } else {
                                          setFilterSatuan(
                                            filterSatuan.filter(
                                              (f) => f !== satuan
                                            )
                                          );
                                        }
                                      }}
                                    />
                                    <Label
                                      htmlFor={`satuan-${satuan}`}
                                      className="text-sm"
                                    >
                                      {satuan}
                                    </Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>

                      <TableHead
                        className="min-w-[160px] border border-gray-300 px-3 py-1 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          boxShadow: "inset 0 -2px 0 #d1d5db",
                          borderRight: "1px solid #d1d5db",
                        }}
                      >
                        {/* Keterangan popover */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-auto p-0 font-medium uppercase"
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
                        className="min-w-[100px] border border-gray-300 px-3 py-1 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          boxShadow: "inset 0 -2px 0 #d1d5db",
                          borderRight: "1px solid #d1d5db",
                        }}
                      >
                        {/* Urgensi popover */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-auto p-0 font-medium uppercase"
                            >
                              URGENSI
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                            <Label className="text-sm font-medium">
                              Cari Urgensi
                            </Label>
                            <Input
                              placeholder="Cari urgensi..."
                              value={urgensiSearchTerm}
                              onChange={(e) =>
                                setUrgensiSearchTerm(e.target.value)
                              }
                              className="mb-2"
                            />
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {uniqueUrgensi
                                .filter((urgensi) =>
                                  urgensi
                                    .toLowerCase()
                                    .includes(urgensiSearchTerm.toLowerCase())
                                )
                                .map((urgensi) => (
                                  <div
                                    key={urgensi}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`urgensi-${urgensi}`}
                                      checked={filterUrgensi.includes(urgensi)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setFilterUrgensi([
                                            ...filterUrgensi,
                                            urgensi,
                                          ]);
                                        } else {
                                          setFilterUrgensi(
                                            filterUrgensi.filter(
                                              (f) => f !== urgensi
                                            )
                                          );
                                        }
                                      }}
                                    />
                                    <Label
                                      htmlFor={`urgensi-${urgensi}`}
                                      className="text-sm"
                                    >
                                      {urgensi}
                                    </Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="min-w-[100px] border border-gray-300 px-3 py-1 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          boxShadow: "inset 0 -2px 0 #d1d5db",
                          borderRight: "1px solid #d1d5db",
                        }}
                      >
                        {/* Divisi popover */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-auto p-0 font-medium uppercase"
                            >
                              DIVISI
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                            <Label className="text-sm font-medium">
                              Cari Divisi
                            </Label>
                            <Input
                              placeholder="Cari divisi..."
                              value={divisiSearchTerm}
                              onChange={(e) =>
                                setDivisiSearchTerm(e.target.value)
                              }
                              className="mb-2"
                            />
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {uniqueDivisi
                                .filter((divisi) =>
                                  divisi
                                    .toLowerCase()
                                    .includes(divisiSearchTerm.toLowerCase())
                                )
                                .map((divisi) => (
                                  <div
                                    key={divisi}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`divisi-${divisi}`}
                                      checked={filterDivisi.includes(divisi)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setFilterDivisi([
                                            ...filterDivisi,
                                            divisi,
                                          ]);
                                        } else {
                                          setFilterDivisi(
                                            filterDivisi.filter(
                                              (f) => f !== divisi
                                            )
                                          );
                                        }
                                      }}
                                    />
                                    <Label
                                      htmlFor={`divisi-${divisi}`}
                                      className="text-sm"
                                    >
                                      {divisi}
                                    </Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="min-w-[100px] border border-gray-300 px-3 py-1 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          boxShadow: "inset 0 -2px 0 #d1d5db",
                          borderRight: "1px solid #d1d5db",
                        }}
                      >
                        {/* Status popover */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-auto p-0 font-medium uppercase"
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
                                .filter((status) =>
                                  status
                                    .toLowerCase()
                                    .includes(statusSearchTerm.toLowerCase())
                                )
                                .map((status) => (
                                  <div
                                    key={status}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`status-${status}`}
                                      checked={filterStatus.includes(status)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setFilterStatus([
                                            ...filterStatus,
                                            status,
                                          ]);
                                        } else {
                                          setFilterStatus(
                                            filterStatus.filter(
                                              (f) => f !== status
                                            )
                                          );
                                        }
                                      }}
                                    />
                                    <Label
                                      htmlFor={`status-${status}`}
                                      className="text-sm"
                                    >
                                      {status}
                                    </Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead
                        className="min-w-[120px] border border-gray-300 px-3 py-1 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          boxShadow: "inset 0 -2px 0 #d1d5db",
                          borderRight: "1px solid #d1d5db",
                        }}
                      >
                        {/* Dibuat Oleh popover */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-auto p-0 font-medium uppercase"
                            >
                              DIBUAT OLEH
                              <ChevronDown className="ml-1 h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                            <Label className="text-sm font-medium">
                              Cari Dibuat Oleh
                            </Label>
                            <Input
                              placeholder="Cari nama..."
                              value={dibuatOlehSearchTerm}
                              onChange={(e) =>
                                setDibuatOlehSearchTerm(e.target.value)
                              }
                              className="mb-2"
                            />
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {uniqueDibuatOleh
                                .filter((nama) =>
                                  nama
                                    .toLowerCase()
                                    .includes(dibuatOlehSearchTerm.toLowerCase())
                                )
                                .map((nama) => (
                                  <div
                                    key={nama}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`dibuatOleh-${nama}`}
                                      checked={filterDibuatOleh.includes(nama)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setFilterDibuatOleh([
                                            ...filterDibuatOleh,
                                            nama,
                                          ]);
                                        } else {
                                          setFilterDibuatOleh(
                                            filterDibuatOleh.filter(
                                              (f) => f !== nama
                                            )
                                          );
                                        }
                                      }}
                                    />
                                    <Label
                                      htmlFor={`dibuatOleh-${nama}`}
                                      className="text-sm"
                                    >
                                      {nama}
                                    </Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      {/* <TableHead
                        className="min-w-[120px] border border-gray-300 px-3 py-1 text-center"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          boxShadow: "inset 0 -2px 0 #d1d5db",
                          borderRight: "1px solid #d1d5db",
                        }}
                      >
                        SKEMA
                      </TableHead> */}
                      <TableHead
                        className="min-w-[120px] border border-gray-300 px-3 py-1 text-center uppercase"
                        style={{
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                          background: "#f3f4f6",
                          borderBottom: "2px solid #d1d5db",
                        }}
                      >
                        AKSI
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((pr) => {
                      // Ambil urutan items sesuai urutan input PR (jangan sort ulang)
                      const validItems = pr.items || [];
                      if (validItems.length === 0) return null;

                      const tanggalPR = pr.tanggalPR
                        ? pr.tanggalPR.split("T")[0]
                        : "";

                      return (
                        <React.Fragment key={pr.id}>
                          <TableRow
                            id={pr.noPR}
                            className={`hover:bg-gray-50 transition-colors ${highlight && pr.noPR === highlight ? "bg-yellow-100" : ""
                              }`}
                          >
                            <TableCell rowSpan={validItems.length} className="border border-gray-300 px-3 py-1 text-left align-middle">
                              <Checkbox
                                checked={selectedPRs.includes(pr.id)}
                                onCheckedChange={(checked) =>
                                  handleSelectPR(pr.id, checked as boolean)
                                }
                                style={{
                                  boxShadow: "0 0 0 2px #bbb, 0 2px 8px #bbb8",
                                  border: "1.5px solid #bbb",
                                  borderRadius: 4,
                                }}
                                className="focus:ring-2 focus:ring-primary"
                              />
                            </TableCell>
                            <TableCell
                              className="font-medium border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap uppercase"
                              rowSpan={validItems.length}
                            >
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span
                                      onClick={() => {
                                        const s = (pr.status || "").toUpperCase();
                                        if (["MENUNGGU", "WAITING PO", "PARTIAL PO", "DRAFT"].includes(s)) {
                                          window.location.href = `/pr/input-baru?id=${pr.id}`;
                                        } else {
                                          setToastMsg("Tidak dapat edit, hapus PO terlebih dahulu");
                                          setToastType("error");
                                          setToastOpen(true);
                                        }
                                      }}
                                      className={`cursor-pointer transition-colors duration-200 ${!["MENUNGGU", "WAITING PO", "PARTIAL PO", "DRAFT"].includes((pr.status || "").toUpperCase())
                                        ? "hover:text-red-500 text-gray-700"
                                        : "hover:text-blue-600"
                                        }`}
                                    >
                                      {pr.noPR}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {pr.status !== "Menunggu"
                                        ? "Tidak dapat edit, hapus PO terlebih dahulu"
                                        : "Klik untuk edit"}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell rowSpan={validItems.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap">
                              {formatTanggal(pr.tanggalPR)}
                            </TableCell>
                            <TableCell className="border border-gray-300 px-3 py-1 text-left whitespace-nowrap uppercase">{validItems[0]?.namaBarang}</TableCell>
                            <TableCell className="border border-gray-300 px-3 py-1 text-left whitespace-nowrap">
                              {parseFloat(validItems[0]?.quantityAwalPR) % 1 === 0
                                ? parseInt(validItems[0]?.quantityAwalPR)
                                : validItems[0]?.quantityAwalPR}
                            </TableCell>
                            <TableCell className="border border-gray-300 px-3 py-1 text-left whitespace-nowrap uppercase">{validItems[0]?.satuan}</TableCell>

                            <TableCell className="border border-gray-300 px-3 py-1 text-left uppercase">
                              <div
                                className="text-sm text-muted-foreground max-w-xs truncate"
                                title={validItems[0]?.keterangan}
                              >
                                {validItems[0]?.keterangan}
                              </div>
                            </TableCell>
                            <TableCell className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap uppercase">
                              {getUrgensiBadge(pr.urgensi)}
                            </TableCell>
                            <TableCell rowSpan={validItems.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap uppercase">
                              {pr.divisi}
                            </TableCell>
                            <TableCell className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap uppercase">
                              {getStatusBadge(validItems[0]?.status)}
                            </TableCell>
                            <TableCell rowSpan={validItems.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap uppercase">
                              {pr.dibuatOleh}
                            </TableCell>
                            {/* <TableCell rowSpan={validItems.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap uppercase">
                              {skemaOptions.find(
                                (s) => String(s.id_skema) === String(pr.skema)
                              )?.skema ??
                                pr.skemaLabel ??
                                pr.skema ??
                                "-"}
                            </TableCell> */}
                            <TableCell rowSpan={validItems.length} className="border border-gray-300 px-3 py-1 text-center align-middle">
                              <div className="flex space-x-1 justify-center">

                                {/* Button Edit removed, click PR Number instead */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(pr.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {validItems.slice(1).map((item: any, index: number) => (
                            <TableRow key={`${pr.id}-item-${index + 1}`} className="hover:bg-gray-50 transition-colors">
                              <TableCell className="border border-gray-300 px-3 py-1 text-left whitespace-nowrap uppercase">{item.namaBarang}</TableCell>
                              <TableCell className="border border-gray-300 px-3 py-1 text-left whitespace-nowrap">
                                {parseFloat(item.quantityAwalPR) % 1 === 0
                                  ? parseInt(item.quantityAwalPR)
                                  : item.quantityAwalPR}
                              </TableCell>
                              <TableCell className="border border-gray-300 px-3 py-1 text-left whitespace-nowrap uppercase">{item.satuan}</TableCell>

                              <TableCell className="border border-gray-300 px-3 py-1 text-left uppercase">
                                <div
                                  className="text-sm text-muted-foreground max-w-xs truncate"
                                  title={item.keterangan}
                                >
                                  {item.keterangan}
                                </div>
                              </TableCell>
                              {/* Urgensi (Un-merged) */}
                              < TableCell className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap uppercase" >
                                {getUrgensiBadge(pr.urgensi)}
                              </TableCell>
                              {/* Divisi (Merged - skipped) */}
                              {/* Status (Un-merged) */}
                              <TableCell className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap uppercase">
                                {getStatusBadge(item.status)}
                              </TableCell>
                              {/* Dibuat Oleh (Merged - skipped) */}
                            </TableRow>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              {/* Sticky horizontal scrollbar di bawah tabel */}
              <div
                className="sticky bottom-0 left-0 right-0 z-30 bg-gray-100 border-t border-gray-300"
                style={{
                  height: '16px',
                  overflowX: 'auto',
                  overflowY: 'hidden'
                }}

                onScroll={(e) => {
                  if (tableWrapperRef.current) {
                    tableWrapperRef.current.scrollLeft = e.currentTarget.scrollLeft;
                  }
                }}
              >
                <div
                  style={{
                    height: '1px',
                    width: tableWrapperRef.current?.scrollWidth || '2000px'
                  }}
                />
              </div>

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
              /* Sticky table header, abu-abu seperti rekap full */
              thead tr,
              thead th,
              .bg-gray-100 th,
              .bg-gray-100 td {
                background: #f3f4f6 !important;
                border-bottom: 2px solid #d1d5db !important;
              }
            `}</style>
            </div>
          </CardContent>

        </Card >
        {/* --- Add modal and toast to the layout --- */}
        < DeleteChoiceModal
          open={deleteChoiceOpen}
          onClose={() => setDeleteChoiceOpen(false)
          }
          onChoose={handleDeleteChoice}
        />
        <ConfirmModal
          open={confirmDeleteOpen}
          title="Konfirmasi Hapus PR"
          description={`Apakah Anda yakin ingin menghapus ${deleteIds.length} PR? Data yang dihapus tidak dapat dikembalikan.`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteOpen(false)}
        />
        <DeleteItemModal
          open={deleteItemModalOpen}
          prItems={selectedPRItemsForDelete}
          selectedIds={selectedItemIdsToDelete}
          setSelectedIds={setSelectedItemIdsToDelete}
          onConfirm={confirmDeleteItems}
          onCancel={() => setDeleteItemModalOpen(false)}
          prData={prData} // <-- tambahkan ini
        />
        <Toast
          open={toastOpen}
          message={toastMsg}
          onClose={() => setToastOpen(false)}
        />
      </div >
    </MainLayout >
  );
}

// Modal pilihan hapus PR atau item
function DeleteChoiceModal({ open, onClose, onChoose }: any) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px]">
        <h2 className="text-lg font-semibold mb-2">Pilih Jenis Hapus</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Anda ingin menghapus seluruh PR beserta semua item, atau hanya
          menghapus item tertentu dari PR yang dipilih?
        </p>
        <div className="flex flex-col gap-2">
          <Button variant="destructive" onClick={() => onChoose("pr")}>
            Hapus PR (beserta semua item)
          </Button>
          <Button variant="outline" onClick={() => onChoose("item")}>
            Hapus Item pada PR
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Modal pilih item yang mau dihapus
function DeleteItemModal({
  open,
  prItems,
  selectedIds,
  setSelectedIds,
  onConfirm,
  onCancel,
  prData,
}: any) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[420px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">
          Pilih Item PR yang akan dihapus
        </h2>
        <div className="space-y-4">
          {prItems.map(({ prId, items }: any) => (
            <div key={prId}>
              <div className="font-semibold mb-1">
                PR: {prData.find((pr: any) => pr.id === prId)?.noPR || prId}
              </div>
              {items.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Tidak ada item pada PR ini.
                </div>
              ) : (
                <div className="space-y-1">
                  {items.map((item: any, idx: number) => {
                    // Gunakan id_PRItem sebagai value checkbox, fallback hanya untuk key
                    const keyId = item.id_PRItem
                      ? String(item.id_PRItem)
                      : `${item.namaBarang}-${item.jumlah}-${idx}`;
                    const valueId = item.id_PRItem
                      ? String(item.id_PRItem)
                      : ""; // kosongkan jika tidak ada id_PRItem
                    const jumlahDisplay =
                      parseFloat(item.jumlah) % 1 === 0
                        ? parseInt(item.jumlah)
                        : item.jumlah;
                    return (
                      <label key={keyId} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={valueId}
                          checked={selectedIds.includes(valueId)}
                          disabled={!valueId} // disable jika tidak ada id_PRItem
                          onChange={(e) => {
                            if (!valueId) return; // tidak bisa pilih jika tidak ada id_PRItem
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
                              (ID PRItem tidak ditemukan)
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
            onClick={onConfirm}
            disabled={selectedIds.length === 0}
          >
            Hapus Item Terpilih ({selectedIds.length})
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// --- Saat update status PR ke backend (PUT/POST), pastikan logika status sama ---
// Contoh di fungsi update PR (misal confirmDelete, confirmDeleteItems, atau proses PO):
