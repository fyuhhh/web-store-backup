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

  // Filter PRs that are ready to be processed (status "Menunggu" or "Gantung") AND match user schema
  const processedPRs = prData.filter(
    (pr) =>
      (pr.status === "Menunggu" || pr.status === "Gantung") &&
      (!userSkema || pr.skema === userSkema)
  );

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

  // Helper: mapping PR items ke PR, satuan/divisi/urgensi tampil nama bukan id
  const prWithItems = prData.map((pr) => ({
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
  }));

  // Filter PR yang status "Menunggu" atau "Gantung" saja
  const filteredPRs = prWithItems.filter(
    (pr) =>
      (pr.status === "Menunggu" || pr.status === "Gantung") &&
      (!userSkema || pr.skema === userSkema)
  );

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
            <div className="overflow-x-auto min-w-[1200px]">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">
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
                    <TableHead className="min-w-[140px]">No. PR</TableHead>
                    <TableHead className="min-w-[140px]">Tanggal</TableHead>
                    <TableHead className="min-w-[180px]">
                      Daftar Barang
                    </TableHead>
                    <TableHead className="min-w-[90px]">Qty</TableHead>
                    <TableHead className="min-w-[90px]">Satuan</TableHead>
                    <TableHead className="min-w-[160px]">Keterangan</TableHead>
                    <TableHead className="min-w-[100px]">Urgensi</TableHead>
                    <TableHead className="min-w-[100px]">Divisi</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">Dibuat Oleh</TableHead>
                    <TableHead className="min-w-[120px]">Skema</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPRs.map((pr) => {
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
                            {pr.tanggalPR?.split("T")[0]}
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
