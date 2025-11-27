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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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

export default function StatusPOPage() {
  const [prData, setPrData] = useState<any[]>([]);
  const [prItemData, setPrItemData] = useState<any[]>([]);
  const [satuanOptions, setSatuanOptions] = useState<any[]>([]);
  const [divisiOptions, setDivisiOptions] = useState<any[]>([]);
  const [urgensiOptions, setUrgensiOptions] = useState<any[]>([]);
  const [selectedPRsForProcess, setSelectedPRsForProcess] = useState<string[]>(
    []
  );
  const [userSkema, setUserSkema] = useState<string>("");
  // Tambahkan state untuk id_skema user
  const [userSkemaId, setUserSkemaId] = useState<string | null>(null);

  // Filter states for table columns
  const [searchTerm, setSearchTerm] = useState("");
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // NEW: state untuk menyimpan item terpilih per PR (map: prId -> array of item ids)
  const [selectedItemsMap, setSelectedItemsMap] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    // Fetch PR, PR Item, satuan, divisi, urgensi dari backend
    const fetchPRData = async () => {
      const prRes = await fetch("http://192.168.10.10:5000/api/pr");
      const prList = await prRes.json();
      const prItemRes = await fetch("http://192.168.10.10:5000/api/pr-item");
      const prItemList = await prItemRes.json();
      const satuanRes = await fetch("http://192.168.10.10:5000/api/satuan");
      const satuanList = await satuanRes.json();
      const divisiRes = await fetch("http://192.168.10.10:5000/api/divisi");
      const divisiList = await divisiRes.json();
      const urgensiRes = await fetch("http://192.168.10.10:5000/api/urgensi");
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
      });
      setSelectedItemsMap(newSelectedItemsMap);
      setSelectedPRsForProcess((prev) =>
        prev.filter(
          (id) => !paginatedData.some((pr) => String(pr.id_PR) === id)
        )
      );
    }
  };

  // Badge status
  function getStatusBadge(status: string) {
    if (status === "Menunggu") {
      return (
        <span className="inline-block px-2 py-1 rounded bg-orange-100 text-orange-700 border border-orange-300 text-xs font-semibold">
          Menunggu
        </span>
      );
    }
    if (status === "Gantung") {
      return (
        <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-700 border border-red-300 text-xs font-semibold">
          Gantung
        </span>
      );
    }
    // Default: anggap Telah Selesai
    return (
      <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 border border-green-300 text-xs font-semibold">
        Telah Selesai
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
      (pr) =>
        (pr.status === "Menunggu" || pr.status === "Gantung") &&
        // Filter hanya PR dengan id_skema sesuai user login
        (!userSkemaId || String(pr.id_skema ?? pr.skema) === userSkemaId)
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
      tanggalPR: pr.tanggalPR,
      status: pr.status,
    }));

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
  const uniqueUrgensi = ["High", "Medium", "Low"];
  const uniqueStatus = ["Menunggu", "Gantung"];
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
        matchesSkema
      );
    })
    // --- SORTING: PR TERBARU → TERLAMA (PAKAI PARSER) ---
    filteredPRs = sortPRList(filteredPRs);

// --- PAGINATION ---
const totalPages = Math.ceil(filteredPRs.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const paginatedData = filteredPRs.slice(
  startIndex,
  startIndex + itemsPerPage
);

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
function parseNoPR(noPR: string | null | undefined) {
  if (!noPR || typeof noPR !== "string") return null;

  const s = noPR.trim().toUpperCase();

  // FORMAT DITERIMA:
  // PR/E-WALK/25/XI/001
  // PR/PRQ/25/XI/00001
  //
  // Bagian kedua bisa E-WALK atau PRQ
  const regex = /^PR\/(E-?WALK|PRQ)\/(\d{2})\/([IVXLCDM]{1,4})\/(\d{1,5})$/;

  const match = s.match(regex);
  if (!match) return null;

  const [, brand, tahun2, bulanRomawi, urutStr] = match;

  // Konversi bulan Romawi
  const bulanMap: Record<string, number> = {
    I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
    VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12,
  };

  const bulan = bulanMap[bulanRomawi] ?? 0;
  const tahun = 2000 + parseInt(tahun2, 10);
  const urut = parseInt(urutStr, 10);

  return { tahun, bulan, urut, brand };
}

// =====================================
// 2. SORTING PR TERBARU → TERLAMA
// =====================================
function sortPRList(filteredPRData: any[]) {
  const allValid = filteredPRData.every(
    (pr) => typeof pr.noPR === "string" && parseNoPR(pr.noPR)
  );

  if (allValid) {
    return [...filteredPRData].sort((a, b) => {
      const pa = parseNoPR(a.noPR)!;
      const pb = parseNoPR(b.noPR)!;

      // Tahun DESC → terbaru
      if (pb.tahun !== pa.tahun) return pb.tahun - pa.tahun;

      // Bulan DESC
      if (pb.bulan !== pa.bulan) return pb.bulan - pa.bulan;

      // Nomor urut DESC
      return pb.urut - pa.urut;
    });
  }

  // Fallback jika format tidak valid
  return [...filteredPRData].sort((a, b) => Number(b.id_PR ?? b.id) - Number(a.id_PR ?? a.id));
}

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

        {/* Search Bar */}
        <div className="flex items-center gap-2 mb-2">
          <Input
            placeholder="Cari No PR atau Nama Barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[320px]"
          />
        </div>

        {/* PR Siap Proses ke PO */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>PR Siap Proses ke PO</CardTitle>
            <CardDescription>
              Total: {filteredPRs.length} PR | Dipilih:{" "}
              {selectedPRsForProcess.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto min-w-[1200px]">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">
                      <Checkbox
                        checked={
                          paginatedData.every((pr) => {
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
                          }) && paginatedData.length > 0
                        }
                        // FIX: Only spread indeterminate if true, do not send prop at all if false
                        {...(paginatedData.some((pr) => {
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
                          ? { indeterminate: true }
                          : {})}
                        onCheckedChange={handleSelectAll}
                        style={{
                          boxShadow: "0 0 0 2px #bbb, 0 2px 8px #bbb8",
                          border: "1.5px solid #bbb",
                          borderRadius: 4,
                        }}
                        className="focus:ring-2 focus:ring-primary"
                      />
                    </TableHead>
                    {/* No. PR */}
                    <TableHead className="min-w-[140px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            No. PR <ChevronDown className="w-4 h-4" />
                            {/* Tambahkan info urutan */}
                            <span className="ml-1 text-xs text-muted-foreground">(Terbaru di atas)</span>
                          </button>
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
                    </TableHead>
                    {/* Tanggal PR */}
                    <TableHead className="min-w-[140px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Tanggal PR <ChevronDown className="w-4 h-4" />
                          </button>
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
                    {/* Daftar Barang */}
                    <TableHead className="min-w-[180px]">
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
                    {/* Qty */}
                    <TableHead className="min-w-[90px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Quantity PR <ChevronDown className="w-4 h-4" />
                          </button>
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
                    {/* Satuan */}
                    <TableHead className="min-w-[90px]">
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
                    {/* Keterangan */}
                    <TableHead className="min-w-[160px]">
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
                    {/* Urgensi */}
                    <TableHead className="min-w-[100px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Urgensi <ChevronDown className="w-4 h-4" />
                          </button>
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
                    {/* Divisi */}
                    <TableHead className="min-w-[100px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Divisi <ChevronDown className="w-4 h-4" />
                          </button>
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
                    {/* Status */}
                    <TableHead className="min-w-[100px]">
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
                    {/* Dibuat Oleh */}
                    <TableHead className="min-w-[120px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Dibuat Oleh <ChevronDown className="w-4 h-4" />
                          </button>
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
                    {/* Skema */}
                    <TableHead className="min-w-[120px]">
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
                    </TableHead>
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
                          <TableRow key={`${prId}-item-${item.id}`}>
                            {/* Checkbox PR-level hanya di baris pertama PR */}
                            {idx === 0 ? (
                              <TableCell rowSpan={filteredItems.length}>
                                <Checkbox
                                  checked={isAllItemsSelected(pr)}
                                  {...(isSomeItemsSelected(pr)
                                    ? { indeterminate: true }
                                    : {})}
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
                              <TableCell rowSpan={filteredItems.length}>
                                {pr.noPR}
                              </TableCell>
                            ) : null}
                            {/* Tanggal PR hanya di baris pertama */}
                            {idx === 0 ? (
                              <TableCell rowSpan={filteredItems.length}>
                                {formatTanggal(pr.tanggalPR)}
                              </TableCell>
                            ) : null}
                            {/* Nama Barang */}
                            <TableCell>
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
                            <TableCell>
                              {Number(item.jumlah) % 1 === 0
                                ? parseInt(item.jumlah)
                                : item.jumlah}
                            </TableCell>
                            {/* Satuan */}
                            <TableCell>{item.satuan}</TableCell>
                            {/* Keterangan */}
                            <TableCell>
                              <div
                                className="max-w-[180px] truncate text-sm text-muted-foreground"
                                title={item.keterangan}
                              >
                                {item.keterangan}
                              </div>
                            </TableCell>
                            {/* Urgensi hanya di baris pertama */}
                            {idx === 0 ? (
                              <TableCell rowSpan={filteredItems.length}>
                                {getUrgensiBadge(pr.urgensi)}
                              </TableCell>
                            ) : null}
                            {/* Divisi hanya di baris pertama */}
                            {idx === 0 ? (
                              <TableCell rowSpan={filteredItems.length}>
                                {pr.divisi}
                              </TableCell>
                            ) : null}
                            {/* Status hanya di baris pertama */}
                            {idx === 0 ? (
                              <TableCell rowSpan={filteredItems.length}>
                                {getStatusBadge(pr.status)}
                              </TableCell>
                            ) : null}
                            {/* Dibuat Oleh hanya di baris pertama */}
                            {idx === 0 ? (
                              <TableCell rowSpan={filteredItems.length}>
                                {pr.dibuatOleh}
                              </TableCell>
                            ) : null}
                            {/* Skema hanya di baris pertama */}
                            {idx === 0 ? (
                              <TableCell rowSpan={filteredItems.length}>
                                {pr.skemaLabel || pr.skema}
                              </TableCell>
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

        {/* Pagination */}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
            {/* Show first page */}
            <PaginationItem>
              <PaginationLink
                onClick={() => setCurrentPage(1)}
                isActive={currentPage === 1}
                className={currentPage === 1 ? "bg-primary text-white" : ""}
              >
                1
              </PaginationLink>
            </PaginationItem>
            {/* Show ellipsis if needed */}
            {totalPages > 4 && currentPage > 3 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {/* Show middle pages */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page !== 1 &&
                  page !== totalPages &&
                  page >= currentPage - 1 &&
                  page <= currentPage + 1
              )
              .map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className={
                      currentPage === page ? "bg-primary text-white" : ""
                    }
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
            {/* Show ellipsis before last page if needed */}
            {totalPages > 4 && currentPage < totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {/* Show last page if more than one page */}
            {totalPages > 1 && (
              <PaginationItem>
                <PaginationLink
                  onClick={() => setCurrentPage(totalPages)}
                  isActive={currentPage === totalPages}
                  className={
                    currentPage === totalPages ? "bg-primary text-white" : ""
                  }
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
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
      </div>
    </MainLayout>
  );
}
