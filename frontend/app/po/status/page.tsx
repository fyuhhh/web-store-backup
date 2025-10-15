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

  useEffect(() => {
    // Fetch PR, PR Item, satuan, divisi, urgensi dari backend
    const fetchPRData = async () => {
      const prRes = await fetch("http://localhost:5000/api/pr");
      const prList = await prRes.json();
      const prItemRes = await fetch("http://localhost:5000/api/pr-item");
      const prItemList = await prItemRes.json();
      const satuanRes = await fetch("http://localhost:5000/api/satuan");
      const satuanList = await satuanRes.json();
      const divisiRes = await fetch("http://localhost:5000/api/divisi");
      const divisiList = await divisiRes.json();
      const urgensiRes = await fetch("http://localhost:5000/api/urgensi");
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
  }, []);

  const savePOData = (data: POData[]) => {
    localStorage.setItem("poData", JSON.stringify(data));
    setPoData(data);
  };

  const handleSelectPR = (prId: string, checked: boolean) => {
    if (checked) {
      setSelectedPRsForProcess([...selectedPRsForProcess, prId]);
    } else {
      setSelectedPRsForProcess(
        selectedPRsForProcess.filter((id) => id !== prId)
      );
    }
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPRsForProcess(processedPRs.map((pr) => pr.id));
    } else {
      setSelectedPRsForProcess([]);
    }
  };

  // Badge status
  const getStatusBadge = (status: string) => {
    if (status === "Menunggu") {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-300">
          Menunggu
        </Badge>
      );
    }
    if (status === "Gantung") {
      return (
        <Badge className="bg-red-600 text-white border-red-700">Gantung</Badge>
      );
    }
    // Untuk status lain, tidak tampil di tabel ini
    return null;
  };

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
        (!userSkema || pr.skema === userSkema)
    )
    .map((pr) => ({
      ...pr,
      items: prItemData
        .filter((item) => String(item.id_PR) === String(pr.id_PR))
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
      processedPRs.flatMap((pr) => pr.items?.map((item) => item.satuan) || [])
    )
  ).sort();
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

  // Helper untuk format tanggal DD-MM-YYYY
  function formatTanggal(tgl: string) {
    if (!tgl) return "";
    const [date] = tgl.split("T");
    const [y, m, d] = date.split("-");
    return `${d}-${m}-${y}`;
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
    .sort((a, b) => {
      const urgOrder = { High: 0, Medium: 1, Low: 2 };
      return urgOrder[a.urgensi] - urgOrder[b.urgensi];
    });

  // --- PAGINATION ---
  const totalPages = Math.ceil(filteredPRs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredPRs.slice(
    startIndex,
    startIndex + itemsPerPage
  );

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
                onClick={() => {
                  const selectedPRData = prData.filter((pr) =>
                    selectedPRsForProcess.includes(pr.id)
                  );
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
                          selectedPRsForProcess.length ===
                            paginatedData.length && paginatedData.length > 0
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
                    {/* No. PR */}
                    <TableHead className="min-w-[140px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            No. PR
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
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
                                <div
                                  key={noPR}
                                  className="flex items-center space-x-2"
                                >
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
                    {/* Tanggal PR */}
                    <TableHead className="min-w-[140px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            Tanggal PR
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
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
                    {/* Daftar Barang */}
                    <TableHead className="min-w-[180px]">
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
                    {/* Qty */}
                    <TableHead className="min-w-[90px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            Qty
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
                          <Input
                            type="number"
                            placeholder="Cari Qty..."
                            value={filterQtySearchTerm}
                            onChange={(e) =>
                              setFilterQtySearchTerm(e.target.value)
                            }
                            className="mb-2"
                          />
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {uniqueQty
                              .filter((qty) =>
                                String(
                                  Number(qty) % 1 === 0 ? Number(qty) : qty
                                )
                                  .toLowerCase()
                                  .includes(filterQtySearchTerm.toLowerCase())
                              )
                              .map((qty) => (
                                <div
                                  key={qty}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`qty-${qty}`}
                                    checked={filterQty.includes(qty)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFilterQty([...filterQty, qty]);
                                      } else {
                                        setFilterQty(
                                          filterQty.filter((f) => f !== qty)
                                        );
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor={`qty-${qty}`}
                                    className="text-sm"
                                  >
                                    {Number(qty) % 1 === 0 ? Number(qty) : qty}
                                  </Label>
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
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            Satuan
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
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
                                satuan
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
                    {/* Keterangan */}
                    <TableHead className="min-w-[160px]">
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
                    {/* Urgensi */}
                    <TableHead className="min-w-[100px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            Urgensi
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
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
                    {/* Divisi */}
                    <TableHead className="min-w-[100px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            Divisi
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
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
                    {/* Status */}
                    <TableHead className="min-w-[100px]">
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
                    {/* Dibuat Oleh */}
                    <TableHead className="min-w-[120px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-medium"
                          >
                            Dibuat Oleh
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg">
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
                    {/* Skema */}
                    <TableHead className="min-w-[120px]">
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
                          <Input
                            placeholder="Cari skema..."
                            value={skemaSearchTerm}
                            onChange={(e) => setSkemaSearchTerm(e.target.value)}
                            className="mb-2"
                          />
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {uniqueSkema
                              .filter(
                                (skema) =>
                                  typeof skema === "string" &&
                                  skema
                                    .toLowerCase()
                                    .includes(skemaSearchTerm.toLowerCase())
                              )
                              .map((skema) => (
                                <div
                                  key={skema}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`skema-${skema}`}
                                    checked={filterSkema.includes(skema)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFilterSkema([...filterSkema, skema]);
                                      } else {
                                        setFilterSkema(
                                          filterSkema.filter((f) => f !== skema)
                                        );
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor={`skema-${skema}`}
                                    className="text-sm"
                                  >
                                    {skema}
                                  </Label>
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
                    return (
                      <React.Fragment key={pr.id_PR}>
                        <TableRow>
                          <TableCell rowSpan={filteredItems.length}>
                            <Checkbox
                              checked={selectedPRsForProcess.includes(pr.id_PR)}
                              onCheckedChange={(checked) =>
                                handleSelectPR(pr.id_PR, checked as boolean)
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
                            className="font-medium"
                            rowSpan={filteredItems.length}
                          >
                            {pr.noPR}
                          </TableCell>
                          <TableCell rowSpan={filteredItems.length}>
                            {formatTanggal(pr.tanggalPR)}
                          </TableCell>
                          <TableCell>{filteredItems[0]?.namaBarang}</TableCell>
                          <TableCell>
                            {parseFloat(filteredItems[0]?.jumlah) % 1 === 0
                              ? parseInt(filteredItems[0]?.jumlah)
                              : filteredItems[0]?.jumlah}
                          </TableCell>
                          <TableCell>{filteredItems[0]?.satuan}</TableCell>
                          <TableCell>
                            <div
                              className="text-sm text-muted-foreground max-w-xs truncate"
                              title={filteredItems[0]?.keterangan}
                            >
                              {filteredItems[0]?.keterangan}
                            </div>
                          </TableCell>
                          <TableCell rowSpan={filteredItems.length}>
                            {getUrgensiBadge(pr.urgensi)}
                          </TableCell>
                          <TableCell rowSpan={filteredItems.length}>
                            {pr.divisi}
                          </TableCell>
                          <TableCell rowSpan={filteredItems.length}>
                            {getStatusBadge(pr.status)}
                          </TableCell>
                          <TableCell rowSpan={filteredItems.length}>
                            {pr.dibuatOleh}
                          </TableCell>
                          <TableCell rowSpan={filteredItems.length}>
                            {pr.skemaLabel ?? pr.skema ?? ""}
                          </TableCell>
                        </TableRow>
                        {filteredItems.slice(1).map((item, index) => (
                          <TableRow key={`${pr.id_PR}-item-${index + 1}`}>
                            <TableCell>{item.namaBarang}</TableCell>
                            <TableCell>
                              {parseFloat(item.jumlah) % 1 === 0
                                ? parseInt(item.jumlah)
                                : item.jumlah}
                            </TableCell>
                            <TableCell>{item.satuan}</TableCell>
                            <TableCell>
                              <div
                                className="text-sm text-muted-foreground max-w-xs truncate"
                                title={item.keterangan}
                              >
                                {item.keterangan}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
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
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
