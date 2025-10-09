"use client";

import React from "react";

// Import exceljs for Excel export with style support
import * as ExcelJS from "exceljs";

import { useState, useEffect } from "react";
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
import { type POData, type PRData } from "@/lib/dummy-data";
import { truncateText } from "@/lib/utils";

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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [exportMode, setExportMode] = useState<"all" | "selected" | "range">(
    "all"
  );
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  useEffect(() => {
    loadPOData();
    loadPRData();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filterNamaBarang,
    filterQtyMin,
    filterQtyMax,
    filterSatuan,
    filterKeterangan,
    filterHargaSatuanMin,
    filterHargaSatuanMax,
    filterTotalMin,
    filterTotalMax,
    filterTanggalPO,
    filterEstimasiDiterima,
    filterSupplier,
    filterKode,
    filterStatusPengiriman,
    filterStatus,
    filterDiorderOleh,
  ]);

  const loadPOData = () => {
    const stored = localStorage.getItem("poData");
    if (stored) {
      const parsedData = JSON.parse(stored);
      // Ensure type safety
      const validatedData = parsedData.map((po: any) => ({
        ...po,
        status: ([
          "Draft",
          "Submitted",
          "Approved",
          "Delivered",
          "Completed",
          "Menunggu",
          "Gantung",
          "Telah dibuat BTB",
        ].includes(po.status)
          ? po.status
          : "Menunggu") as POData["status"],
      })) as POData[];
      setPoData(validatedData);
    }
  };

  const loadPRData = () => {
    const stored = localStorage.getItem("prData");
    if (stored) {
      const parsedData = JSON.parse(stored);
      setPrData(parsedData);
    }
  };

  const savePOData = (data: POData[]) => {
    localStorage.setItem("poData", JSON.stringify(data));
    setPoData(data);
  };

  const handleEdit = (po: POData) => {
    // Redirect to input page for editing
    localStorage.setItem("editingPO", JSON.stringify(po));
    window.location.href = "/po/input";
  };

  const handleDelete = (id: string) => {
    if (
      confirm(
        "Apakah Anda yakin ingin menghapus PO ini? Data yang dihapus tidak dapat dikembalikan."
      )
    ) {
      try {
        const updatedData = poData.filter((po) => po.id !== id);
        savePOData(updatedData);

        // Remove from selected POs if it was selected
        setSelectedPOs(selectedPOs.filter((poId) => poId !== id));

        // Show success message
        alert("PO berhasil dihapus!");

        // Reload data to ensure consistency
        loadPOData();
      } catch (error) {
        console.error("Error deleting PO:", error);
        alert("Terjadi kesalahan saat menghapus PO. Silakan coba lagi.");
      }
    }
  };

  const handleSelectPO = (poId: string, checked: boolean) => {
    if (checked) {
      setSelectedPOs([...selectedPOs, poId]);
    } else {
      setSelectedPOs(selectedPOs.filter((id) => id !== poId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPOs(filteredPOData.map((po) => po.id));
    } else {
      setSelectedPOs([]);
    }
  };

  // Filter data
  const filteredPOData = poData
    .map((po) => {
      let status = po.status || "Menunggu";
      return { ...po, status };
    })
    .filter((po) => {
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
        (filterTotalMax === "" || po.totalPembayaran <= Number(filterTotalMax));

      const matchesTanggalPO =
        filterTanggalPO.length === 0 || filterTanggalPO.includes(po.tanggalPO);

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
    })
    .filter((po) =>
      po.poItems.some((poItem) =>
        poItem.items.some((item) => item.jumlahPO > 0)
      )
    );

  // Pagination logic
  const totalPages = Math.ceil(filteredPOData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredPOData.slice(
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
        po.poItems.flatMap((poItem) => poItem.items.map((item) => item.satuan))
      )
    )
  ).sort();
  const uniqueSuppliers = Array.from(
    new Set(poData.map((po) => po.supplier).filter((s) => s && s.trim() !== ""))
  ).sort();
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
    new Set(
      poData
        .map((po) => po.tanggalPO)
        .filter((t): t is string => t !== undefined && t.trim() !== "")
    )
  ).sort();
  const uniqueEstimasiDiterima = Array.from(
    new Set(
      poData
        .map((po) => po.estimasiTanggalDiterima)
        .filter((t): t is string => t !== undefined && t.trim() !== "")
    )
  ).sort();
  const uniqueKode = Array.from(
    new Set(
      poData
        .map((po) => po.statusPermintaan)
        .filter((k): k is string => k !== undefined && k.trim() !== "")
    )
  ).sort() as string[];
  const uniqueStatusPengiriman = Array.from(
    new Set(
      poData
        .map((po) => po.statusPengiriman)
        .filter((s): s is string => s !== undefined && s.trim() !== "")
    )
  ).sort() as string[];
  const uniqueDiorderOleh = Array.from(
    new Set(
      poData
        .map((po) => po.orderedBy)
        .filter((o): o is string => o !== undefined && o.trim() !== "")
    )
  ).sort();

  // Data untuk export sesuai mode
  const getExportPOData = () => {
    if (exportMode === "selected") {
      return filteredPOData.filter((po) => selectedPOs.includes(po.id));
    }
    if (exportMode === "range" && exportStartDate && exportEndDate) {
      return filteredPOData.filter(
        (po) => po.tanggalPO >= exportStartDate && po.tanggalPO <= exportEndDate
      );
    }
    return filteredPOData;
  };

  const handleExport = async () => {
    const exportPOData = getExportPOData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monitoring PO");

    const headers = [
      "No. PO",
      "Daftar Barang",
      "Quantity",
      "Satuan",
      "Keterangan",
      "Harga Satuan",
      "Total",
      "Tanggal PO",
      "Estimasi Diterima",
      "Supplier",
      "Total Pembayaran",
      "Kode",
      "Status Pengiriman",
      "Status",
      "Diorder oleh",
    ];

    // Add header row with bold font
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "left" };
    });

    // Prepare and add data rows
    exportPOData.forEach((po) => {
      // Flatten all items from all poItems and filter jumlahPO > 0
      const allItems = po.poItems.flatMap((poItem) =>
        poItem.items
          .filter((item) => item.jumlahPO > 0)
          .map((item) => ({
            ...item,
            noPR: poItem.noPR,
          }))
      );

      if (allItems.length === 0) return null; // Skip PO if no valid items

      allItems.forEach((item, index) => {
        const rowData = [
          index === 0 ? po.noPO : "",
          item.namaBarang,
          String(item.jumlahPO),
          item.satuan,
          item.keterangan || "",
          index === 0 ? "" : `Rp ${item.hargaSatuan.toLocaleString("id-ID")}`,
          index === 0
            ? ""
            : `Rp ${(item.hargaSatuan * item.jumlahPO).toLocaleString(
                "id-ID"
              )}`,
          index === 0 ? po.tanggalPO : "",
          index === 0 ? po.estimasiTanggalDiterima : "",
          index === 0 ? po.supplier : "",
          index === 0 ? `Rp ${po.totalPembayaran.toLocaleString("id-ID")}` : "",
          index === 0 ? po.statusPermintaan ?? "" : "",
          index === 0 ? po.statusPengiriman ?? "" : "",
          index === 0 ? po.status ?? "" : "",
          index === 0 ? po.orderedBy ?? "" : "",
        ];

        const dataRow = worksheet.addRow(rowData);
        dataRow.eachCell((cell) => {
          cell.alignment = { horizontal: "left" };
        });
      });
    });

    // Set column widths for better readability based on content
    headers.forEach((header, index) => {
      let maxLength = header.length;

      // Check all data rows for this column to find the longest content
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          // Skip header row
          const cell = row.getCell(index + 1);
          if (cell.value) {
            const cellLength = String(cell.value).length;
            maxLength = Math.max(maxLength, cellLength);
          }
        }
      });

      // Calculate width with padding
      let width = Math.max(maxLength * 1.2, 10);

      // Special handling for certain column types
      if (header.includes("Barang") || header.includes("Keterangan")) {
        width = Math.max(width, 25); // Wider for item names and descriptions
      } else if (header.includes("Tanggal")) {
        width = Math.max(width, 12); // Medium width for dates
      } else if (header.includes("Supplier") || header.includes("No.")) {
        width = Math.max(width, 15); // Medium width for supplier names and numbers
      } else if (header.includes("Harga") || header.includes("Total")) {
        width = Math.max(width, 15); // Width for currency values
      }

      worksheet.getColumn(index + 1).width = width;
    });

    // Set row heights
    worksheet.getRow(1).height = 20; // Header row height
    for (let i = 2; i <= worksheet.rowCount; i++) {
      worksheet.getRow(i).height = 18; // Data rows height
    }

    // Generate XLSX file and trigger download
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
              <Button
                onClick={() => (window.location.href = "/po/status")}
                className="bg-primary hover:bg-primary/90 h-9"
              >
                <Plus className="h-4 w-4 mr-2" />
                Input PO Baru
              </Button>
            </div>
          </div>
        </div>

        {/* Removed filter card as filters will be in table headers */}

        {/* Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Daftar Purchase Order</CardTitle>
            <CardDescription>
              Total: {filteredPOData.length} PO | Dipilih: {selectedPOs.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="border border-gray-300">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedPOs.length === filteredPOData.length &&
                          filteredPOData.length > 0
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
                    <TableHead>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                            aria-label="Filter No. PO"
                          >
                            No. PO <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 !bg-white border border-gray-200 shadow-lg">
                          <Input
                            placeholder="Cari No. PO..."
                            value={searchTerm}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => setSearchTerm(e.target.value)}
                          />
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                            aria-label="Filter Daftar Barang"
                          >
                            Daftar Barang <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 !bg-white border border-gray-200 shadow-lg">
                          <Input
                            placeholder="Cari nama barang..."
                            value={filterNamaBarang}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => setFilterNamaBarang(e.target.value)}
                          />
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                            aria-label="Filter Qty"
                          >
                            Qty <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 !bg-white border border-gray-200 shadow-lg">
                          <div className="space-y-2">
                            <Input
                              placeholder="Min Qty"
                              value={filterQtyMin}
                              onChange={(e) =>
                                setFilterQtyMin(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                              type="number"
                            />
                            <Input
                              placeholder="Max Qty"
                              value={filterQtyMax}
                              onChange={(e) =>
                                setFilterQtyMax(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                              type="number"
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                            aria-label="Filter Satuan"
                          >
                            Satuan <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-2 !bg-white border border-gray-200 shadow-lg">
                          <Input
                            placeholder="Cari satuan..."
                            value={satuanSearchTerm}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => setSatuanSearchTerm(e.target.value)}
                          />
                          <div className="max-h-48 overflow-y-auto space-y-1">
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
                                            (s) => s !== satuan
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
                    <TableHead>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                            aria-label="Filter Keterangan"
                          >
                            Keterangan <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 !bg-white border border-gray-200 shadow-lg">
                          <Input
                            placeholder="Cari keterangan..."
                            value={filterKeterangan}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => setFilterKeterangan(e.target.value)}
                          />
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead>Harga Satuan</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                            aria-label="Filter Tanggal PO"
                          >
                            Tanggal PO <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-2 !bg-white border border-gray-200 shadow-lg">
                          <Input
                            placeholder="Cari tanggal PO..."
                            value={tanggalPOSearchTerm}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => setTanggalPOSearchTerm(e.target.value)}
                          />
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {uniqueTanggalPO
                              .filter((tanggal) =>
                                tanggal
                                  .toLowerCase()
                                  .includes(tanggalPOSearchTerm.toLowerCase())
                              )
                              .map((tanggal) => (
                                <div
                                  key={tanggal}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`tanggal-${tanggal}`}
                                    checked={filterTanggalPO.includes(tanggal)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFilterTanggalPO([
                                          ...filterTanggalPO,
                                          tanggal,
                                        ]);
                                      } else {
                                        setFilterTanggalPO(
                                          filterTanggalPO.filter(
                                            (t) => t !== tanggal
                                          )
                                        );
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor={`tanggal-${tanggal}`}
                                    className="text-sm"
                                  >
                                    {tanggal}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                            aria-label="Filter Estimasi Diterima"
                          >
                            Estimasi Diterima{" "}
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-2 !bg-white border border-gray-200 shadow-lg">
                          <Input
                            placeholder="Cari estimasi diterima..."
                            value={estimasiDiterimaSearchTerm}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => setEstimasiDiterimaSearchTerm(e.target.value)}
                          />
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {uniqueEstimasiDiterima
                              .filter((estimasi) =>
                                estimasi
                                  .toLowerCase()
                                  .includes(
                                    estimasiDiterimaSearchTerm.toLowerCase()
                                  )
                              )
                              .map((estimasi) => (
                                <div
                                  key={estimasi}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`estimasi-${estimasi}`}
                                    checked={filterEstimasiDiterima.includes(
                                      estimasi
                                    )}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFilterEstimasiDiterima([
                                          ...filterEstimasiDiterima,
                                          estimasi,
                                        ]);
                                      } else {
                                        setFilterEstimasiDiterima(
                                          filterEstimasiDiterima.filter(
                                            (e) => e !== estimasi
                                          )
                                        );
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor={`estimasi-${estimasi}`}
                                    className="text-sm"
                                  >
                                    {estimasi}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                            aria-label="Filter Supplier"
                          >
                            Supplier <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-2 !bg-white border border-gray-200 shadow-lg">
                          <Input
                            placeholder="Cari supplier..."
                            value={supplierSearchTerm}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => setSupplierSearchTerm(e.target.value)}
                          />
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {uniqueSuppliers
                              .filter((supplier) =>
                                supplier
                                  .toLowerCase()
                                  .includes(supplierSearchTerm.toLowerCase())
                              )
                              .map((supplier) => (
                                <div
                                  key={supplier}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`supplier-${supplier}`}
                                    checked={filterSupplier.includes(supplier)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFilterSupplier([
                                          ...filterSupplier,
                                          supplier,
                                        ]);
                                      } else {
                                        setFilterSupplier(
                                          filterSupplier.filter(
                                            (s) => s !== supplier
                                          )
                                        );
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor={`supplier-${supplier}`}
                                    className="text-sm"
                                  >
                                    {supplier}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                            aria-label="Filter Kode"
                          >
                            Kode <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-2 !bg-white border border-gray-200 shadow-lg">
                          <Input
                            placeholder="Cari kode..."
                            value={kodeSearchTerm}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => setKodeSearchTerm(e.target.value)}
                          />
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {uniqueKode
                              .filter((kode) =>
                                kode
                                  .toLowerCase()
                                  .includes(kodeSearchTerm.toLowerCase())
                              )
                              .map((kode) => (
                                <div
                                  key={kode}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`kode-${kode}`}
                                    checked={filterKode.includes(kode)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFilterKode([...filterKode, kode]);
                                      } else {
                                        setFilterKode(
                                          filterKode.filter((k) => k !== kode)
                                        );
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor={`kode-${kode}`}
                                    className="text-sm"
                                  >
                                    {kode}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                            aria-label="Filter Status Pengiriman"
                          >
                            Status Pengiriman{" "}
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-2 !bg-white border border-gray-200 shadow-lg">
                          <Input
                            placeholder="Cari status pengiriman..."
                            value={statusPengirimanSearchTerm}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => setStatusPengirimanSearchTerm(e.target.value)}
                          />
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {uniqueStatusPengiriman
                              .filter((status) =>
                                status
                                  .toLowerCase()
                                  .includes(
                                    statusPengirimanSearchTerm.toLowerCase()
                                  )
                              )
                              .map((status) => (
                                <div
                                  key={status}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`status-pengiriman-${status}`}
                                    checked={filterStatusPengiriman.includes(
                                      status
                                    )}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFilterStatusPengiriman([
                                          ...filterStatusPengiriman,
                                          status,
                                        ]);
                                      } else {
                                        setFilterStatusPengiriman(
                                          filterStatusPengiriman.filter(
                                            (s) => s !== status
                                          )
                                        );
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor={`status-pengiriman-${status}`}
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
                    <TableHead>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                            aria-label="Filter Status"
                          >
                            Status <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-2 !bg-white border border-gray-200 shadow-lg">
                          <Input
                            placeholder="Cari status..."
                            value={statusSearchTerm}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => setStatusSearchTerm(e.target.value)}
                          />
                          <div className="max-h-48 overflow-y-auto space-y-1">
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
                                            (s) => s !== status
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
                    <TableHead>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                            aria-label="Filter Diorder Oleh"
                          >
                            Diorder oleh <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-2 !bg-white border border-gray-200 shadow-lg">
                          <Input
                            placeholder="Cari diorder oleh..."
                            value={diorderOlehSearchTerm}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => setDiorderOlehSearchTerm(e.target.value)}
                          />
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {uniqueDiorderOleh
                              .filter((diorderOleh) =>
                                diorderOleh
                                  .toLowerCase()
                                  .includes(diorderOlehSearchTerm.toLowerCase())
                              )
                              .map((diorderOleh) => (
                                <div
                                  key={diorderOleh}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`diorder-oleh-${diorderOleh}`}
                                    checked={filterDiorderOleh.includes(
                                      diorderOleh
                                    )}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setFilterDiorderOleh([
                                          ...filterDiorderOleh,
                                          diorderOleh,
                                        ]);
                                      } else {
                                        setFilterDiorderOleh(
                                          filterDiorderOleh.filter(
                                            (d) => d !== diorderOleh
                                          )
                                        );
                                      }
                                    }}
                                  />
                                  <Label
                                    htmlFor={`diorder-oleh-${diorderOleh}`}
                                    className="text-sm"
                                  >
                                    {diorderOleh}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((po) => {
                    // Flatten all items from all poItems and filter jumlahPO > 0
                    const allItems = po.poItems.flatMap((poItem) =>
                      poItem.items
                        .filter((item) => item.jumlahPO > 0)
                        .map((item) => ({
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
                            {itemIndex === 0 && (
                              <>
                                <TableCell
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
                                  className="font-medium px-4 py-2 border-r border-gray-300 align-middle"
                                  rowSpan={allItems.length}
                                >
                                  {po.noPO}
                                </TableCell>
                              </>
                            )}
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
                              Rp {item.hargaSatuan.toLocaleString("id-ID")}
                            </TableCell>
                            {itemIndex === 0 && (
                              <>
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[120px]"
                                >
                                  Rp{" "}
                                  {po.totalPembayaran.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[120px]"
                                >
                                  {po.tanggalPO}
                                </TableCell>
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[140px]"
                                >
                                  {po.estimasiTanggalDiterima}
                                </TableCell>
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[140px]"
                                >
                                  {po.supplier}
                                </TableCell>
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[100px]"
                                >
                                  {po.statusPermintaan ?? ""}
                                </TableCell>
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[140px]"
                                >
                                  {po.statusPengiriman ?? ""}
                                </TableCell>
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[100px]"
                                >
                                  {getStatusBadge(po.status || "")}
                                </TableCell>
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[100px]"
                                >
                                  {po.orderedBy ?? ""}
                                </TableCell>
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="px-4 py-2 text-left border-gray-300 align-middle"
                                >
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEdit(po)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDelete(po.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </>
                            )}
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
        </Card>
      </div>
    </MainLayout>
  );
}
