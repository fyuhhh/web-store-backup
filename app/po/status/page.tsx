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
import { Checkbox } from "@/components/ui/checkbox";
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
import { Input } from "@/components/ui/input";

export default function StatusPOPage() {
  const [prData, setPrData] = useState<PRData[]>([]);
  const [poData, setPoData] = useState<POData[]>([]);
  const [selectedPRsForProcess, setSelectedPRsForProcess] = useState<string[]>(
    []
  );

  // Filter states for table columns
  const [filterNoPR, setFilterNoPR] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterDaftarBarang, setFilterDaftarBarang] = useState("");
  const [filterQtyMin, setFilterQtyMin] = useState<number | "">("");
  const [filterQtyMax, setFilterQtyMax] = useState<number | "">("");
  const [filterSatuan, setFilterSatuan] = useState<string[]>([]);
  const [filterKeterangan, setFilterKeterangan] = useState("");
  const [filterUrgensi, setFilterUrgensi] = useState<string[]>([]);
  const [filterDivisi, setFilterDivisi] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterDibuatOleh, setFilterDibuatOleh] = useState("");
  // Added filter for select checkbox column (all selected or not)
  const [filterSelected, setFilterSelected] = useState<boolean | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const storedPR = localStorage.getItem("prData");
    const storedPO = localStorage.getItem("poData");

    if (storedPR) {
      const parsedPRData = JSON.parse(storedPR);
      setPrData(parsedPRData as PRData[]);
    }

    if (storedPO) {
      const parsedPOData = JSON.parse(storedPO);
      setPoData(parsedPOData as POData[]);
    }
  };

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
    if (
      status === "Processed" ||
      status === "Clear" ||
      status === "Telah Selesai"
    ) {
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          Telah Selesai
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

  const getUrgensiBadge = (urgensi: string) => {
    const colors: Record<string, string> = {
      Low: "bg-success/10 text-success",
      Medium: "bg-warning/10 text-warning",
      High: "bg-destructive/10 text-destructive",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[urgensi] || "bg-muted/50 text-muted-foreground"
        }`}
      >
        {urgensi}
      </span>
    );
  };

  // Filter PRs that are ready to be processed (status "Menunggu" or "Gantung")
  const processedPRs = prData.filter(
    (pr) => pr.status === "Menunggu" || pr.status === "Gantung"
  );

  // Filter processedPRs based on filters
  const filteredPRs = processedPRs.filter((pr) => {
    // Filter No. PR
    if (
      filterNoPR &&
      !pr.noPR.toLowerCase().includes(filterNoPR.toLowerCase())
    ) {
      return false;
    }

    // Filter Tanggal
    if (
      filterTanggal &&
      !pr.tanggalPR.toLowerCase().includes(filterTanggal.toLowerCase())
    ) {
      return false;
    }

    // Filter Daftar Barang (check if any item matches)
    if (
      filterDaftarBarang &&
      !pr.items.some((item) =>
        item.namaBarang.toLowerCase().includes(filterDaftarBarang.toLowerCase())
      )
    ) {
      return false;
    }

    // Filter Qty (check if any item matches range)
    if (
      (filterQtyMin !== "" &&
        !pr.items.some((item) => item.jumlah >= filterQtyMin)) ||
      (filterQtyMax !== "" &&
        !pr.items.some((item) => item.jumlah <= filterQtyMax))
    ) {
      return false;
    }

    // Filter Satuan (check if any item matches)
    if (
      filterSatuan.length > 0 &&
      !pr.items.some((item) => filterSatuan.includes(item.satuan))
    ) {
      return false;
    }

    // Filter Keterangan (check if any item matches)
    if (
      filterKeterangan &&
      !pr.items.some((item) =>
        (item.keterangan || "")
          .toLowerCase()
          .includes(filterKeterangan.toLowerCase())
      )
    ) {
      return false;
    }

    // Filter Urgensi
    if (filterUrgensi.length > 0 && !filterUrgensi.includes(pr.urgensi)) {
      return false;
    }

    // Filter Divisi
    if (filterDivisi.length > 0 && !filterDivisi.includes(pr.divisi)) {
      return false;
    }

    // Filter Status
    if (filterStatus.length > 0 && !filterStatus.includes(pr.status)) {
      return false;
    }

    // Filter Dibuat Oleh
    if (
      filterDibuatOleh &&
      !pr.dibuatOleh.toLowerCase().includes(filterDibuatOleh.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  // Pagination logic
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
            {/* Test Popover Button removed as per user feedback */}
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

        {/* PR Siap Proses ke PO */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>PR Siap Proses ke PO</CardTitle>
            <CardDescription>
              Daftar PR dengan status "Menunggu" atau "Gantung" yang siap
              diproses menjadi PO
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Popover>
                        <PopoverTrigger asChild>
                          <span className="font-medium inline-block cursor-pointer">
                            <Checkbox
                              checked={
                                selectedPRsForProcess.length ===
                                  filteredPRs.length && filteredPRs.length > 0
                              }
                              onCheckedChange={(checked) => {
                                handleSelectAll(checked as boolean);
                                setFilterSelected(checked ? true : false);
                              }}
                              style={{
                                boxShadow: "0 0 0 2px #bbb, 0 2px 8px #bbb8",
                                border: "1.5px solid #bbb",
                                borderRadius: 4,
                              }}
                              className="focus:ring-2 focus:ring-primary"
                            />
                          </span>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 bg-white shadow-lg border border-border backdrop-blur-none bg-opacity-100">
                          <div className="space-y-2">
                            <Checkbox
                              id="filter-selected-true"
                              checked={filterSelected === true}
                              onCheckedChange={(checked) =>
                                setFilterSelected(checked ? true : null)
                              }
                            />
                            <label
                              htmlFor="filter-selected-true"
                              className="text-sm"
                            >
                              Selected
                            </label>
                            <Checkbox
                              id="filter-selected-false"
                              checked={filterSelected === false}
                              onCheckedChange={(checked) =>
                                setFilterSelected(checked ? false : null)
                              }
                            />
                            <label
                              htmlFor="filter-selected-false"
                              className="text-sm"
                            >
                              Not Selected
                            </label>
                            <Checkbox
                              id="filter-selected-none"
                              checked={filterSelected === null}
                              onCheckedChange={(checked) =>
                                setFilterSelected(checked ? null : null)
                              }
                            />
                            <label
                              htmlFor="filter-selected-none"
                              className="text-sm"
                            >
                              Clear Filter
                            </label>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="w-32">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="font-medium flex items-center space-x-1">
                            <span>No. PR</span>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 bg-white shadow-lg border border-border backdrop-blur-none bg-opacity-100">
                          <div className="space-y-2">
                            <Input
                              placeholder="Cari No. PR..."
                              value={filterNoPR}
                              onChange={(e) => setFilterNoPR(e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="w-32">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="font-medium flex items-center space-x-1">
                            <span>Tanggal</span>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 bg-white shadow-lg border border-border backdrop-blur-none bg-opacity-100">
                          <div className="space-y-2">
                            <Input
                              placeholder="Cari Tanggal..."
                              value={filterTanggal}
                              onChange={(e) => setFilterTanggal(e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="w-40">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="font-medium flex items-center space-x-1">
                            <span>Daftar Barang</span>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 bg-white shadow-lg border border-border backdrop-blur-none bg-opacity-100">
                          <div className="space-y-2">
                            <Input
                              placeholder="Cari Daftar Barang..."
                              value={filterDaftarBarang}
                              onChange={(e) =>
                                setFilterDaftarBarang(e.target.value)
                              }
                              className="w-full"
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="w-20">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="font-medium flex items-center space-x-1">
                            <span>Qty</span>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 bg-white shadow-lg border border-border backdrop-blur-none bg-opacity-100">
                          <div className="space-y-2 grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              placeholder="Min"
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
                              type="number"
                              placeholder="Max"
                              value={filterQtyMax}
                              onChange={(e) =>
                                setFilterQtyMax(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="w-24">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="font-medium flex items-center space-x-1">
                            <span>Satuan</span>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 max-h-48 overflow-y-auto bg-white shadow-lg border border-border backdrop-blur-none bg-opacity-100">
                          <div className="space-y-2">
                            {Array.from(
                              new Set(
                                prData.flatMap((pr) =>
                                  pr.items.map((item) => item.satuan)
                                )
                              )
                            ).map((satuan) => (
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
                                        filterSatuan.filter((s) => s !== satuan)
                                      );
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`satuan-${satuan}`}
                                  className="text-sm"
                                >
                                  {satuan}
                                </label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="w-40">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="font-medium flex items-center space-x-1">
                            <span>Keterangan</span>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 bg-white shadow-lg border border-border backdrop-blur-none bg-opacity-100">
                          <div className="space-y-2">
                            <Input
                              placeholder="Cari Keterangan..."
                              value={filterKeterangan}
                              onChange={(e) =>
                                setFilterKeterangan(e.target.value)
                              }
                              className="w-full"
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="w-24">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="font-medium flex items-center space-x-1">
                            <span>Urgensi</span>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 max-h-48 overflow-y-auto bg-white shadow-lg border border-border backdrop-blur-none bg-opacity-100">
                          <div className="space-y-2">
                            {["Low", "Medium", "High"].map((urgensi) => (
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
                                          (u) => u !== urgensi
                                        )
                                      );
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`urgensi-${urgensi}`}
                                  className="text-sm"
                                >
                                  {urgensi}
                                </label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="w-24">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="font-medium flex items-center space-x-1">
                            <span>Divisi</span>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 max-h-48 overflow-y-auto bg-white shadow-lg border border-border backdrop-blur-none bg-opacity-100">
                          <div className="space-y-2">
                            {Array.from(
                              new Set(prData.map((pr) => pr.divisi))
                            ).map((divisi) => (
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
                                        filterDivisi.filter((d) => d !== divisi)
                                      );
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`divisi-${divisi}`}
                                  className="text-sm"
                                >
                                  {divisi}
                                </label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="w-24">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="font-medium flex items-center space-x-1">
                            <span>Status</span>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 max-h-48 overflow-y-auto bg-white shadow-lg border border-border backdrop-blur-none bg-opacity-100">
                          <div className="space-y-2">
                            {Array.from(
                              new Set(prData.map((pr) => pr.status))
                            ).map((status) => (
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
                                        filterStatus.filter((s) => s !== status)
                                      );
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`status-${status}`}
                                  className="text-sm"
                                >
                                  {status}
                                </label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="w-32">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="font-medium flex items-center space-x-1">
                            <span>Dibuat Oleh</span>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 bg-white shadow-lg border border-border backdrop-blur-none bg-opacity-100">
                          <div className="space-y-2">
                            <Input
                              placeholder="Cari Dibuat Oleh..."
                              value={filterDibuatOleh}
                              onChange={(e) =>
                                setFilterDibuatOleh(e.target.value)
                              }
                              className="w-full"
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((pr) => {
                    // Filter items to only include those with jumlah > 0
                    const filteredItems =
                      pr.items?.filter((item) => item.jumlah > 0) || [];
                    if (filteredItems.length === 0) return null; // Skip PR if no items with quantity > 0

                    return (
                      <React.Fragment key={pr.id}>
                        {/* Main row with first item */}
                        <TableRow>
                          <TableCell rowSpan={filteredItems.length}>
                            <Checkbox
                              checked={selectedPRsForProcess.includes(pr.id)}
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
                            className="font-medium"
                            rowSpan={filteredItems.length}
                          >
                            {pr.noPR}
                          </TableCell>
                          <TableCell rowSpan={filteredItems.length}>
                            {pr.tanggalPR}
                          </TableCell>
                          <TableCell>{filteredItems[0]?.namaBarang}</TableCell>
                          <TableCell>{filteredItems[0]?.jumlah}</TableCell>
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
                        </TableRow>

                        {/* Additional rows for remaining items */}
                        {filteredItems.slice(1).map((item, index) => (
                          <TableRow key={`${pr.id}-item-${index + 1}`}>
                            <TableCell>{item.namaBarang}</TableCell>
                            <TableCell>{item.jumlah}</TableCell>
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
            {/* <Pagination className="mt-4">
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
            </Pagination> */}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
