"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

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
  Search,
  Download,
  ChevronDown,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
<<<<<<< HEAD
import { type PRData } from "@/lib/dummy-data";

export default function MonitoringPRPage() {
  const [prData, setPrData] = useState<PRData[]>([]);
  const [selectedPRs, setSelectedPRs] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  // Filter states
  const [filterNamaBarang, setFilterNamaBarang] = useState("");
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filterNamaBarang,
    filterQtyPRAwalMin,
    filterQtyPRAwalMax,
    filterSatuan,
    filterKeterangan,
    filterUrgensi,
    filterDivisi,
    filterStatus,
    filterTanggalPR,
    filterNoPR,
    filterDibuatOleh,
    filterSkema,
  ]);

  const loadPRData = async () => {
    const prRes = await fetch("http://192.168.10.10:5000/api/pr");
    const prList = await prRes.json();
    const prItemRes = await fetch("http://192.168.10.10:5000/api/pr-item");
    const prItemList = await prItemRes.json();

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
          id_PRItem: item.id_PRItem, // <-- Tambahkan ini!
          namaBarang: item.namaBarang,
          jumlah: item.jumlah,
          quantityAwalPR: item.quantityAwalPR,
          satuan: satuanMap[String(item.id_satuan)] || item.id_satuan,
          keterangan: item.keterangan,
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
    for (const pr of validatedData) {
      if (
        pr.status === "Menunggu" &&
        pr.items &&
        pr.items.length > 0 &&
        pr.items.every((item: any) => Number(item.jumlah) === 0)
      ) {
        // Update status ke "Diproses"
        await fetch(`http://192.168.10.10:5000/api/pr/${pr.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...pr,
            status: "Diproses",
          }),
        });
      }
    }
    // Setelah update status, reload data agar tampilan sesuai
    // (hindari infinite loop, reload hanya jika ada perubahan)
    // Cek jika ada PR yang statusnya berubah
    const needReload = validatedData.some(
      (pr) =>
        pr.status === "Menunggu" &&
        pr.items &&
        pr.items.length > 0 &&
        pr.items.every((item: any) => Number(item.jumlah) === 0)
    );
    if (needReload) {
      setTimeout(loadPRData, 300); // reload data setelah update status
    }
  };

  const savePRData = (data: PRData[]) => {
    localStorage.setItem("prData", JSON.stringify(data));
    // Ensure type safety when setting state
    setPrData(data as PRData[]);
  };

  const handleEdit = (pr: PRData) => {
    // Redirect to input page for editing
    localStorage.setItem("editingPR", JSON.stringify(pr));
    window.location.href = "/pr/input";
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
      for (const pr of selectedPRItemsForDelete) {
        await updatePRStatusToBackend(pr.prId);
      }
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
      for (const id of deleteIds) {
        await fetch(`http://192.168.10.10:5000/api/pr/${id}`, { method: "DELETE" });
        await fetch(`http://192.168.10.10:5000/api/pr-item/by-pr/${id}`, {
          method: "DELETE",
        });
      }
      const updatedData = prData.filter((pr) => !deleteIds.includes(pr.id));
      setPrData(updatedData);
      setSelectedPRs(selectedPRs.filter((prId) => !deleteIds.includes(prId)));
      setToastMsg("PR dan item berhasil dihapus.");
      setToastOpen(true);
      loadPRData();
    } catch (error) {
      setToastMsg("Terjadi kesalahan saat menghapus PR.");
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
=======
import { type POData, type PRData } from "@/lib/dummy-data";
import { truncateText } from "@/lib/utils";
function formatTanggal(tgl: string) {
  if (!tgl) return "";
  // Pastikan tgl adalah string tanggal valid
  let dateObj = dayjs(tgl);
  // Jika tidak valid, coba parse manual (misal dari DD-MM-YYYY)
  if (!dateObj.isValid() && /^\d{2}-\d{2}-\d{4}$/.test(tgl)) {
    const [d, m, y] = tgl.split("-");
    dateObj = dayjs(`${y}-${m}-${d}`);
>>>>>>> 0c3bb19ba92e37b51076f3e5260967351651bfe8
  }
  // Tambahkan 1 hari ke tanggal sebelum ditampilkan
  if (dateObj.isValid()) {
    return dateObj.add(1, "day").format("DD-MM-YYYY");
  }
  return tgl ?? "";
}

function formatTanggalPlus1(tgl: string) {
  if (!tgl) return "-";
  const dateObj = dayjs(tgl).add(1, "day");
  return dateObj.isValid() ? dateObj.format("DD-MM-YYYY") : tgl;
}

function formatTanggalPlus2(tgl: string) {
  if (!tgl) return "-";
  const dateObj = dayjs(tgl).add(2, "day");
  return dateObj.isValid() ? dateObj.format("DD-MM-YYYY") : tgl;
}

// ========================================
// 1. PARSER No. PO (E-WALK + PENTACITY)
// ========================================
function parseNoPO(noPO: string | null | undefined) {
  if (!noPO || typeof noPO !== "string") return null;

  const s = noPO.trim().toUpperCase();

  // FORMAT:
  // PO/E-WALK/WBL/25/XI/00001
  // PO/PSV/WBL/25/XI/00001
  //
  // BRAND = E-WALK atau PSV
  // STORE = WBL atau lainnya
  const regex = /^PO\/(E-?WALK|PSV)\/([A-Z0-9]+)\/(\d{2})\/([IVXLCDM]{1,4})\/(\d{1,5})$/;

  const match = s.match(regex);
  if (!match) return null;

  const [, brand, store, tahun2, bulanRomawi, urutStr] = match;

  // Konversi bulan romawi
  const bulanMap: Record<string, number> = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
    VIII: 8,
    IX: 9,
    X: 10,
    XI: 11,
    XII: 12,
  };

  const bulan = bulanMap[bulanRomawi] ?? 0;
  const tahun = 2000 + parseInt(tahun2, 10);
  const urut = parseInt(urutStr, 10);

  return { tahun, bulan, urut, brand, store };
}

// ========================================
// 2. SORTING PO TERBARU → TERLAMA
// ========================================
function sortPOList(filteredPOData: any[]) {
  const allValid = filteredPOData.every(
    (po) => typeof po.noPO === "string" && parseNoPO(po.noPO)
  );

  if (allValid) {
    return [...filteredPOData].sort((a, b) => {
      const pa = parseNoPO(a.noPO)!;
      const pb = parseNoPO(b.noPO)!;

      // Tahun DESC
      if (pb.tahun !== pa.tahun) return pb.tahun - pa.tahun;

      // Bulan DESC
      if (pb.bulan !== pa.bulan) return pb.bulan - pa.bulan;

      // Urut DESC
      return pb.urut - pa.urut;
    });
  }

  // fallback jika format tidak valid
  return [...filteredPOData].sort((a, b) => Number(b.id_PO ?? b.id) - Number(a.id_PO ?? a.id));
}

export default function MonitoringPOPage() {
  const [poData, setPoData] = useState<POData[]>([]);
  const [prData, setPrData] = useState<PRData[]>([]);
  const [selectedPOs, setSelectedPOs] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  // Filter states
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
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
            jumlahPO: Number(pi.jumlahPO) || Number(pi.jumlah) || 0,
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
        <div className="bg-white border border-gray-200 shadow-lg rounded px-4 py-2 flex items-center gap-2 animate-fade-in">
          <span className="text-green-600 font-medium">{message}</span>
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
          // Hapus item PO
          await fetch(`http://localhost:5000/api/po-item/${itemId}`, {
            method: "DELETE",
          });
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

      setToastMsg(
        mode === "permanent"
          ? "Item PO berhasil dihapus permanen."
          : "Item PO berhasil dikembalikan ke PR."
      );
      setToastOpen(true);
      // --- Tambahkan auto refresh data PO setelah update ---
      await fetchAll();
    } catch (err) {
      setToastMsg("Gagal menghapus item PO.");
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
        const matchesSearch =
          po.noPO.toLowerCase().includes(searchTerm.toLowerCase()) ||
          po.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
          po.poItems.some((poItem) =>
            poItem.items
              .filter((item) => item.jumlahPO > 0)
              .some((item) =>
                item.namaBarang.toLowerCase().includes(searchTerm.toLowerCase())
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
          matchesDiorderOleh
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
  const totalPages = Math.ceil(sortedPOData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedPOData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

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
        const d = po.tanggalPOISO || po.tanggalPO || "";
        return d >= exportStartDate && d <= exportEndDate;
      });
    }
    return filteredPOData;
  };

  const handleExport = async () => {
    const exportPOData = getExportPOData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monitoring PO");

    // Header sesuai urutan tabel monitoring PO terbaru
    const headers = [
      "No. PO",
      "Daftar Barang",
      "Quantity PO",
      "Satuan",
      "Keterangan",
      "Harga Satuan",
      "Diskon (%)",
      "Diskon (Rp)",
      "PPN (%)",
      "PPN (Rp)",
      "Total Per Item",
      "Grand Total",
      "Ordered By",
      "Estimasi Diterima",
      "Status Pengiriman",
      "Status",
      "Skema",
    ];

    // Add header row with bold font
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "left", vertical: "middle" };
    });

    // Helper: format tanggal persis seperti frontend (tambah 2 hari, fallback jika gagal)
    function formatTanggalExcel(tgl: string) {
      if (!tgl) return "";
      let dateObj;
      if (/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
        dateObj = dayjs(tgl).add(2, "day");
      } else if (tgl.includes("T")) {
        dateObj = dayjs.utc(tgl).add(2, "day");
      } else {
        dateObj = dayjs(tgl).add(2, "day");
      }
      return dateObj.isValid() ? dateObj.format("DD-MM-YYYY") : tgl ?? "";
    }

    function formatQtyExcel(val: any) {
      const num = Number(val);
      if (Number.isNaN(num)) return "";
      return num % 1 === 0 ? num.toString() : num.toString();
    }
    function formatRupiah(val: any) {
      if (val === undefined || val === "" || isNaN(val)) return "";
      return "Rp " + Number(val).toLocaleString("id-ID");
    }

    // Helper format persen (tanpa .00 jika bulat)
    function formatPersenExcel(val: any) {
      if (val === undefined || val === null || val === "") return "";
      const num = Number(val);
      if (isNaN(num)) return "";
      return num % 1 === 0 ? `${num}%` : `${num}%`;
    }

    // Prepare and add data rows sesuai urutan kolom tabel
    exportPOData.forEach((po) => {
      const allItems = po.poItems.flatMap((poItem) =>
        poItem.items.map((item) => ({
          ...item,
          noPR: poItem.noPR,
        }))
      );
      if (allItems.length === 0) return;

      allItems.forEach((item, index) => {
        worksheet.addRow([
          index === 0 ? po.noPO : "",
          item.namaBarang,
          formatQtyExcel(item.jumlahPO),
          item.satuan,
          item.keterangan || "",
          formatRupiah(item.hargaSatuan),
          formatPersenExcel(item.diskonPersen),
          item.diskonNominal
            ? `Rp ${Number(item.diskonNominal).toLocaleString("id-ID")}`
            : "",
          formatPersenExcel(item.ppnItem),
          item.ppnAmount
            ? `Rp ${Number(item.ppnAmount).toLocaleString("id-ID")}`
            : "",
          typeof item.totalPerItem !== "undefined" && item.totalPerItem !== null
            ? `Rp ${Number(item.totalPerItem).toLocaleString("id-ID")}`
            : "",
          index === 0 ? formatRupiah(po.totalPembayaran) : "",
          index === 0 ? po.orderedBy ?? "" : "",
          index === 0 ? formatTanggalExcel(po.estimasiTanggalTerima) : "",
          index === 0 ? po.statusPengiriman ?? "" : "",
          index === 0 ? po.status ?? "" : "",
          index === 0 ? skemaMap[String(po.skema)] ?? po.skema ?? "" : "",
        ]);
      });
    });

    worksheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? String(cell.value) : "";
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = maxLength;
    });

    worksheet.eachRow((row, rowNumber) => {
      row.height = rowNumber === 1 ? 22 : 18;
      row.alignment = { vertical: "middle" };
    });

    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monitoring-po-${new Date().toISOString().split("T")[0]}.xlsx`;
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
        await fetch(`http://localhost:5000/api/po/${id}`, {
          method: "DELETE",
        });
      }
      setPoData((prev) => prev.filter((po) => !deleteIds.includes(po.id)));
      setSelectedPOs((prev) => prev.filter((id) => !deleteIds.includes(id)));
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
            <div className="overflow-x-auto min-w-[1400px]">
              <Table className="min-w-[1400px] border border-gray-300">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">
                      {/* Checkbox Select All */}
                      <Checkbox
                        checked={
                          selectedPOs.length === paginatedData.length &&
                          paginatedData.length > 0
                        }
                        // Add indeterminate prop only if needed and supported by your Checkbox component
                        // indeterminate={
                        //   selectedPOs.length > 0 &&
                        //   selectedPOs.length < paginatedData.length
                        // }
                        onCheckedChange={handleSelectAll}
                        style={{
                          boxShadow: "0 0 0 2px #bbb, 0 2px 8px #bbb8",
                          border: "1.5px solid #bbb",
                          borderRadius: 4,
                        }}
                        className="focus:ring-2 focus:ring-primary"
                      />
                    </TableHead>
                    <TableHead className="min-w-[140px]">
                      {/* No. PO */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            No. PO <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari No. PO..."
                            value={kodeSearchTerm}
                            onChange={(e) => setKodeSearchTerm(e.target.value)}
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
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
                                  <Label className="text-sm">{k}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[120px]">
                      {/* Tanggal PO */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Tanggal PO <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari tanggal..."
                            value={tanggalPOSearchTerm}
                            onChange={(e) =>
                              setTanggalPOSearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
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
                                  <Label className="text-sm"></Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[140px]">
                      {/* Supplier */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Supplier <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari supplier..."
                            value={supplierSearchTerm}
                            onChange={(e) =>
                              setSupplierSearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
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
                                  <Label className="text-sm">{s}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[180px]">
                      {/* Nama Barang */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Nama Barang <ChevronDown className="w-4 h-4" />
                          </button>
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
                    <TableHead className="min-w-[90px]">
                      {/* Quantity PO */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Quantity PO <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
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
                          />
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
                    {/* HAPUS: <TableHead className="min-w-[90px]">Quantity Awal PO</TableHead> */}
                    <TableHead className="min-w-[90px]">
                      {/* Satuan */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Satuan <ChevronDown className="w-4 h-4" />
                          </button>
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
                    <TableHead className="min-w-[160px]">
                      {/* Keterangan */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Keterangan <ChevronDown className="w-4 h-4" />
                          </button>
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
                    <TableHead className="min-w-[120px]">
                      {/* Harga Satuan */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Harga Satuan <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
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
                          />
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
                    <TableHead className="min-w-[90px]">Diskon (%)</TableHead>
                    <TableHead className="min-w-[90px]">Diskon (Rp)</TableHead>
                    <TableHead className="min-w-[90px]">PPN (%)</TableHead>
                    {/* Tambah kolom baru: Total Per Item */}
                    <TableHead className="min-w-[90px]">PPN (Rp)</TableHead>
                    {/* Pindahkan kolom Total Per Item ke sebelah kanan PPN (Rp) */}
                    <TableHead className="min-w-[110px]">Total</TableHead>
                    <TableHead className="min-w-[120px]">
                      {/* Total */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Grand Total <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
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
                          />
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
                    <TableHead className="min-w-[100px]">
                      {/* Diorder oleh */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Ordered By <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari user..."
                            value={diorderOlehSearchTerm}
                            onChange={(e) =>
                              setDiorderOlehSearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
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
                                  <Label className="text-sm">{o}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[140px]">
                      {/* Estimasi Diterima */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Estimasi Diterima{" "}
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari estimasi..."
                            value={estimasiDiterimaSearchTerm}
                            onChange={(e) =>
                              setEstimasiDiterimaSearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
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
                                  <Label className="text-sm">{tgl}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[140px]">
                      {/* Status Pengiriman */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Status Pengiriman{" "}
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari status pengiriman..."
                            value={statusPengirimanSearchTerm}
                            onChange={(e) =>
                              setStatusPengirimanSearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
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
                                  <Label className="text-sm">{s}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[100px]">
                      {/* Status */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Status <ChevronDown className="w-4 h-4" />
                          </button>
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
                    <TableHead className="min-w-[100px]">
                      {/* Skema */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Skema <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari skema..."
                            value={skemaSearchTerm}
                            onChange={(e) => setSkemaSearchTerm(e.target.value)}
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
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
                    </TableHead>
                    {/* HAPUS: <TableHead className="min-w-[120px]">Aksi</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((po) => {
                    // Flatten all items from all poItems ~ REMOVE jumlahPO > 0 filter
                    const allItems = po.poItems.flatMap((poItem) =>
                      poItem.items.map((item) => ({
                        ...item,
                        noPR: poItem.noPR,
                      }))
                    );

                    return (
                      <React.Fragment key={po.id}>
                        {allItems.map((item, itemIndex) => (
                          <TableRow
                            key={`${po.id}-item-${itemIndex}`}
                            className="border-b border-gray-300 align-middle"
                          >
                            {itemIndex === 0 ? (
                              <>
                                <TableCell
                                  key="checkbox"
                                  rowSpan={allItems.length}
                                  className="px-4 py-2 border-r border-gray-300 align-middle"
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
                                  className="font-medium px-4 py-2 border-r border-gray-300 align-middle"
                                  rowSpan={allItems.length}
                                >
                                  {po.noPO}
                                </TableCell>
                                <TableCell
                                  key="tanggalPO"
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[120px]"
                                >
                                  {formatTanggalPlus2(po.tanggalPO)}
                                </TableCell>
                                <TableCell
                                  key="supplier"
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[140px]"
                                >
                                  {po.supplier}
                                </TableCell>
                              </>
                            ) : null}
                            <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[200px]">
                              {item.namaBarang}
                            </TableCell>
                            <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[80px]">
                              {item.jumlahPO}
                            </TableCell>
                            <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[60px]">
                              {item.satuan}
                            </TableCell>
                            <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left max-w-xs whitespace-normal break-words">
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <div
                                    className="text-sm text-muted-foreground cursor-help"
                                    title={item.keterangan}
                                  >
                                    {truncateText(item.keterangan, 35)}
                                  </div>
                                </HoverCardTrigger>
                                <HoverCardContent>
                                  <p className="whitespace-pre-wrap text-sm">
                                    {item.keterangan}
                                  </p>
                                </HoverCardContent>
                              </HoverCard>
                            </TableCell>
                            <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[120px]">
                              Rp {item.hargaSatuan?.toLocaleString("id-ID")}
                            </TableCell>
                            {/* Kolom baru: Diskon (%) */}
                            <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[90px]">
                              {formatPersen(item.diskonPersen)}
                            </TableCell>
                            {/* Kolom baru: Diskon (Rp) */}
                            <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[90px]">
                              {item.diskonNominal
                                ? `Rp ${Number(
                                    item.diskonNominal
                                  ).toLocaleString("id-ID")}`
                                : ""}
                            </TableCell>
                            {/* Kolom baru: PPN (%) */}
                            <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[90px]">
                              {formatPersen(item.ppnItem)}
                            </TableCell>
                            {/* Kolom baru: PPN (Rp) */}
                            <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[90px]">
                              {item.ppnAmount
                                ? `Rp ${Number(item.ppnAmount).toLocaleString(
                                    "id-ID"
                                  )}`
                                : ""}
                            </TableCell>
                            {/* Pindahkan Kolom baru: Total Per Item ke sini */}
                            <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[110px]">
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
                                  className="text-left border-r border-gray-300 align-middle min-w-[120px]"
                                >
                                  Rp{" "}
                                  {po.totalPembayaran.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell
                                  key="orderedBy"
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[100px]"
                                >
                                  {po.orderedBy ?? ""}
                                </TableCell>
                                <TableCell
                                  key="estimasiTanggalDiterima"
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[140px]"
                                >
                                  {formatTanggalPlus2(po.estimasiTanggalTerima)}
                                </TableCell>
                                <TableCell
                                  key="statusPengiriman"
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[140px]"
                                >
                                  {po.statusPengiriman ?? ""}
                                </TableCell>
                                <TableCell
                                  key="statusBadge"
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[100px]"
                                >
                                  {getStatusBadge(po.status || "")}
                                </TableCell>
                                <TableCell
                                  key="skema"
                                  rowSpan={allItems.length}
                                  className="text-left border-gray-300 align-middle min-w-[100px]"
                                >
                                  {skemaMap[String(po.skema)] ?? po.skema ?? ""}
                                </TableCell>
                                {/* HAPUS: <TableCell key="actions" ...> ...button edit/hapus... </TableCell> */}
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
          <Pagination className="mt-4">
            <PaginationContent className="px-2 gap-1">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className={`min-w-[32px] text-center rounded ${currentPage === page
                          ? "bg-primary text-white font-bold"
                          : "bg-white text-black"
                        }`}
                      style={ {
                        display: "inline-block",
                        margin: "0 2px",
                        padding: "4px 0",
                        fontSize: "16px",
                        boxShadow:
                          currentPage === page ? "0 2px 8px #bbb8" : "none",
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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
          {poItems.map(({ poId, items }) => (
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
                                selectedIds.filter((x) => x !== valueId)
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
<<<<<<< HEAD

// --- Saat update status PR ke backend (PUT/POST), pastikan logika status sama ---
// Contoh di fungsi update PR (misal confirmDelete, confirmDeleteItems, atau proses PO):
const updatePRStatusToBackend = async (prId: string) => {
  // Ambil semua item PR dari backend
  const prItemsRes = await fetch(
    `http://192.168.10.10:5000/api/pr-item/pr/${prId}`
  );
  const prItems = prItemsRes.ok ? await prItemsRes.json() : [];

  // Helper untuk dapatkan originalJumlah (fallback ke quantityAwalPR atau jumlah)
  const getOriginalJumlah = (item: any) =>
    item.originalJumlah ??
    item.quantityAwalPR ??
    item.jumlah_awal ??
    item.jumlah;

  // Status logic:
  // - Semua jumlah = 0 → Diproses
  // - Semua jumlah = originalJumlah → Menunggu
  // - Selain itu → Gantung
  let newStatus = "Gantung";
  if (prItems.length > 0) {
    if (prItems.every((item: any) => Number(item.jumlah) === 0)) {
      newStatus = "Diproses";
    } else if (
      prItems.every(
        (item: any) =>
          Number(item.jumlah) === Number(getOriginalJumlah(item))
      )
    ) {
      newStatus = "Menunggu";
    }
  }

  // Ambil data PR lama
  const prRes = await fetch(`http://192.168.10.10:5000/api/pr/${prId}`);
  if (prRes.ok) {
    const prData = await prRes.json();
    await fetch(`http://192.168.10.10:5000/api/pr/${prId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...prData,
        status: newStatus,
      }),
    });
  }
};
=======
>>>>>>> 0c3bb19ba92e37b51076f3e5260967351651bfe8
