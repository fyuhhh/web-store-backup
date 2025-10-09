"use client";

import type React from "react";
import * as ExcelJS from "exceljs";
import { ChevronDown } from "lucide-react";
import { Edit, Trash2 } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import type { BTBData } from "@/lib/dummy-data";

const columns = [
  { key: "noBTB", label: "No. BTB" },
  { key: "tanggal", label: "Tanggal BTB" },
  { key: "periode", label: "Periode" },
  { key: "supplier", label: "Nama Supplier" },
  { key: "kodeSupplier", label: "Kode Supplier" },
  { key: "barang", label: "Nama Barang" },
  { key: "jumlah", label: "Quantity" },
  { key: "satuan", label: "Satuan" },
  { key: "biaya", label: "Biaya" },
  { key: "diterimaOleh", label: "Diterima Oleh" }, // Ganti label
];

export default function BTBMonitoringPage() {
  const [btbData, setBtbData] = useState<BTBData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter states
  const [filterSupplier, setFilterSupplier] = useState<string[]>([]);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [filterKodeSupplier, setFilterKodeSupplier] = useState<string[]>([]);
  const [kodeSupplierSearchTerm, setKodeSupplierSearchTerm] = useState("");
  const [barangSearchTerm, setBarangSearchTerm] = useState("");
  const [filterSatuan, setFilterSatuan] = useState<string[]>([]);
  const [satuanSearchTerm, setSatuanSearchTerm] = useState("");
  const [filterPeriode, setFilterPeriode] = useState("");
  const [filterTanggalBTB, setFilterTanggalBTB] = useState<string[]>([]);
  const [tanggalBTBSearchTerm, setTanggalBTBSearchTerm] = useState("");
  const [filterQtyMin, setFilterQtyMin] = useState<number | "">("");
  const [filterQtyMax, setFilterQtyMax] = useState<number | "">("");
  const [filterBiayaMin, setFilterBiayaMin] = useState<number | "">("");
  const [filterBiayaMax, setFilterBiayaMax] = useState<number | "">("");
  const [periodeSearchTerm, setPeriodeSearchTerm] = useState("");
  const [uniquePeriode, setUniquePeriode] = useState<string[]>([]);
  const [poData, setPoData] = useState<any[]>([]);
  const [selectedBTBIds, setSelectedBTBIds] = useState<string[]>([]);
  const [exportMode, setExportMode] = useState<"all" | "selected" | "range">(
    "all"
  );
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setUniquePeriode(
      Array.from(
        new Set(btbData.map((btb) => btb.periode).filter(Boolean))
      ).sort()
    );
  }, [btbData]);

  useEffect(() => {
    const storedPO = localStorage.getItem("poData");
    if (storedPO) setPoData(JSON.parse(storedPO));
  }, []);

  const loadData = () => {
    const storedBTB = localStorage.getItem("btbData");

    if (storedBTB) {
      setBtbData(JSON.parse(storedBTB));
    } else {
      // Initialize with dummy BTB data
      const dummyBTB: BTBData[] = [
        {
          id: "BTB-001",
          noBTB: "BTB/2024/001",
          tanggal: "2024-06-20",
          periode: "Juni 2024",
          supplier: "PT. Supplier A",
          kodeSupplier: "SUP-001",
          barang: "Laptop Dell Latitude",
          jumlah: 5,
          satuan: "unit",
          biaya: 75000000,
          diterimaOleh: "Admin",
          poId: "PO-001",
          status: "Received",
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem("btbData", JSON.stringify(dummyBTB));
      setBtbData(dummyBTB);
    }
  };

  // Compute unique values for filters
  const uniqueSuppliers = Array.from(
    new Set(
      btbData.map((btb) => btb.supplier).filter((s) => s && s.trim() !== "")
    )
  ).sort();
  const uniqueKodeSupplier = Array.from(
    new Set(
      btbData.map((btb) => btb.kodeSupplier).filter((k) => k && k.trim() !== "")
    )
  ).sort();
  const uniqueSatuan = Array.from(
    new Set(
      btbData.map((btb) => btb.satuan).filter((s) => s && s.trim() !== "")
    )
  ).sort();
  const uniqueTanggalBTB = Array.from(
    new Set(btbData.map((btb) => btb.tanggal).filter(Boolean))
  ).sort();

  // Filter data
  const filteredBTBData = btbData.filter((btb) => {
    // Cari barang di array items jika ada
    const barangList =
      btb.items && Array.isArray(btb.items)
        ? btb.items.map((item: any) => item.barang?.toLowerCase() ?? "")
        : [btb.barang?.toLowerCase() ?? ""];

    const matchesSearch =
      btb.noBTB.toLowerCase().includes(searchTerm.toLowerCase()) ||
      btb.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      barangList.some((barang) => barang.includes(searchTerm.toLowerCase()));

    const matchesStatus = !filterStatus || btb.status === filterStatus;

    // Filter barang (popover filter)
    const matchesBarangSearch =
      !barangSearchTerm ||
      barangList.some((barang) =>
        barang.includes(barangSearchTerm.toLowerCase())
      );

    // Filter supplier
    const matchesSupplier =
      filterSupplier.length === 0 || filterSupplier.includes(btb.supplier);

    // Filter kode supplier
    const matchesKodeSupplier =
      filterKodeSupplier.length === 0 ||
      filterKodeSupplier.includes(btb.kodeSupplier);

    // Filter satuan
    const satuanList =
      btb.items && Array.isArray(btb.items)
        ? btb.items.map((item: any) => item.satuan)
        : [btb.satuan];
    const matchesSatuan =
      filterSatuan.length === 0 ||
      satuanList.some((satuan) => filterSatuan.includes(satuan));

    // Filter tanggal BTB
    const matchesTanggalBTB =
      filterTanggalBTB.length === 0 || filterTanggalBTB.includes(btb.tanggal);

    // Filter periode
    const matchesPeriode =
      !filterPeriode ||
      btb.periode === filterPeriode ||
      btb.periode?.toLowerCase().includes(periodeSearchTerm.toLowerCase());

    // Filter quantity
    const qtyList =
      btb.items && Array.isArray(btb.items)
        ? btb.items.map((item: any) => item.jumlah)
        : [btb.jumlah];
    const matchesQtyMin =
      filterQtyMin === "" ||
      qtyList.some((qty) => Number(qty) >= Number(filterQtyMin));
    const matchesQtyMax =
      filterQtyMax === "" ||
      qtyList.some((qty) => Number(qty) <= Number(filterQtyMax));

    // Filter biaya
    const biayaVal = Number(btb.biaya) || 0;
    const matchesBiayaMin =
      filterBiayaMin === "" || biayaVal >= Number(filterBiayaMin);
    const matchesBiayaMax =
      filterBiayaMax === "" || biayaVal <= Number(filterBiayaMax);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesBarangSearch &&
      matchesSupplier &&
      matchesKodeSupplier &&
      matchesSatuan &&
      matchesPeriode &&
      matchesTanggalBTB &&
      matchesQtyMin &&
      matchesQtyMax &&
      matchesBiayaMin &&
      matchesBiayaMax
    );
  });

  // Filter data untuk export
  const getExportData = () => {
    if (exportMode === "selected") {
      return filteredBTBData.filter((btb) => selectedBTBIds.includes(btb.id));
    }
    if (exportMode === "range" && exportStartDate && exportEndDate) {
      return filteredBTBData.filter((btb) => {
        return btb.tanggal >= exportStartDate && btb.tanggal <= exportEndDate;
      });
    }
    // default: all
    return filteredBTBData;
  };

  // Export Excel function
  const handleExport = async () => {
    const exportBTBData = getExportData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monitoring BTB");

    // Header sesuai tabel monitoring
    const headers = [
      "No. BTB",
      "Tanggal BTB",
      "Periode",
      "Nama Supplier",
      "Kode Supplier",
      "Nama Barang",
      "Quantity",
      "Satuan",
      "Biaya",
      "Diterima Oleh",
    ];

    // Add header row
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "left", vertical: "middle" };
    });

    // Add data rows
    exportBTBData.forEach((btb) => {
      const items =
        btb.items && Array.isArray(btb.items) && btb.items.length > 0
          ? btb.items
          : btb.barang
          ? [{ barang: btb.barang, jumlah: btb.jumlah, satuan: btb.satuan }]
          : [];
      if (items.length === 0) return;
      items.forEach((item, idx) => {
        worksheet.addRow([
          idx === 0 ? btb.noBTB : "",
          idx === 0 ? btb.tanggal : "",
          idx === 0 ? btb.periode : "",
          idx === 0 ? btb.supplier : "",
          idx === 0 ? btb.kodeSupplier : "",
          item.barang ?? "",
          item.jumlah ?? "",
          item.satuan ?? "",
          idx === 0
            ? "Rp " + (btb.biaya?.toLocaleString?.("id-ID") ?? btb.biaya)
            : "",
          idx === 0 ? btb.diterimaOleh ?? "" : "",
        ]);
      });
    });

    // Auto-fit columns based on max length of cell values
    worksheet.columns.forEach((column) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? String(cell.value) : "";
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = maxLength;
    });

    // Set row heights for better readability
    worksheet.eachRow((row, rowNumber) => {
      row.height = rowNumber === 1 ? 22 : 18;
      row.alignment = { vertical: "middle" };
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
    a.download = `monitoring-btb-${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleEdit = (btb: BTBData) => {
    // Redirect to input page for editing
    localStorage.setItem("editingBTB", JSON.stringify(btb));
    window.location.href = "/btb/input";
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus BTB ini?")) {
      const updatedData = btbData.filter((btb) => btb.id !== id);
      localStorage.setItem("btbData", JSON.stringify(updatedData));
      setBtbData(updatedData);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Monitoring BTB (Bukti Terima Barang)
            </h1>
            <p className="text-muted-foreground">
              Pantau penerimaan barang dari Purchase Order
            </p>
          </div>
          <div className="flex items-center gap-3 bg-muted/40 px-4 py-2 rounded-lg">
            <div className="flex flex-col gap-1">
              <Label htmlFor="exportMode" className="text-xs font-medium">
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
            </div>
            {exportMode === "range" && (
              <div className="flex flex-col gap-1">
                <Label className="text-xs font-medium">Tanggal</Label>
                <div className="flex items-center gap-2">
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
              </div>
            )}
            <Button
              onClick={handleExport}
              className="bg-primary hover:bg-primary/90 h-9"
              disabled={
                (exportMode === "selected" && selectedBTBIds.length === 0) ||
                (exportMode === "range" && (!exportStartDate || !exportEndDate))
              }
            >
              <ChevronDown className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>
        {/* Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Daftar Bukti Terima Barang</CardTitle>
            <CardDescription>
              Total: {filteredBTBData.length} BTB
              {filteredBTBData.length > 0 && (
                <>
                  {" | "}
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredBTBData.length)}
                  {" dari "}
                  {filteredBTBData.length} BTB
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="border border-gray-300">
                <TableHeader>
                  <TableRow>
                    {/* Checkbox header untuk export terpilih */}
                    <TableHead>
                      {exportMode === "selected" && (
                        <Checkbox
                          checked={filteredBTBData
                            .slice(
                              (currentPage - 1) * itemsPerPage,
                              currentPage * itemsPerPage
                            )
                            .every((btb: any) =>
                              selectedBTBIds.includes(btb.id)
                            )}
                          onCheckedChange={(checked) => {
                            const pageIds = filteredBTBData
                              .slice(
                                (currentPage - 1) * itemsPerPage,
                                currentPage * itemsPerPage
                              )
                              .map((btb: any) => btb.id);
                            if (checked) {
                              setSelectedBTBIds((prev) =>
                                Array.from(new Set([...prev, ...pageIds]))
                              );
                            } else {
                              setSelectedBTBIds((prev) =>
                                prev.filter((id) => !pageIds.includes(id))
                              );
                            }
                          }}
                        />
                      )}
                    </TableHead>
                    {/* No. BTB */}
                    <TableHead className="text-left min-w-[140px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            No. BTB <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari No. BTB..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Tanggal BTB */}
                    <TableHead className="text-left min-w-[120px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Tanggal BTB <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari tanggal..."
                            value={tanggalBTBSearchTerm}
                            onChange={(e) =>
                              setTanggalBTBSearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueTanggalBTB
                              .filter((t) =>
                                t
                                  .toLowerCase()
                                  .includes(tanggalBTBSearchTerm.toLowerCase())
                              )
                              .map((t) => (
                                <div
                                  key={t}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`tanggal-${t}`}
                                    checked={filterTanggalBTB.includes(t)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterTanggalBTB([
                                          ...filterTanggalBTB,
                                          t,
                                        ]);
                                      else
                                        setFilterTanggalBTB(
                                          filterTanggalBTB.filter(
                                            (x) => x !== t
                                          )
                                        );
                                    }}
                                  />
                                  <Label
                                    htmlFor={`tanggal-${t}`}
                                    className="text-sm"
                                  >
                                    {t}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Periode */}
                    <TableHead className="text-left min-w-[120px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Periode <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari periode..."
                            value={periodeSearchTerm}
                            onChange={(e) =>
                              setPeriodeSearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniquePeriode
                              .filter((p) =>
                                p
                                  .toLowerCase()
                                  .includes(periodeSearchTerm.toLowerCase())
                              )
                              .map((p) => (
                                <div
                                  key={p}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`periode-${p}`}
                                    checked={filterPeriode === p}
                                    onCheckedChange={(checked) => {
                                      setFilterPeriode(checked ? p : "");
                                    }}
                                  />
                                  <Label
                                    htmlFor={`periode-${p}`}
                                    className="text-sm"
                                  >
                                    {p}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Nama Supplier */}
                    <TableHead className="text-left min-w-[160px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Nama Supplier <ChevronDown className="w-4 h-4" />
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
                                  <Label
                                    htmlFor={`supplier-${s}`}
                                    className="text-sm"
                                  >
                                    {s}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Kode Supplier */}
                    <TableHead className="text-left min-w-[120px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Kode Supplier <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari kode supplier..."
                            value={kodeSupplierSearchTerm}
                            onChange={(e) =>
                              setKodeSupplierSearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueKodeSupplier
                              .filter((k) =>
                                k
                                  .toLowerCase()
                                  .includes(
                                    kodeSupplierSearchTerm.toLowerCase()
                                  )
                              )
                              .map((k) => (
                                <div
                                  key={k}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`kode-supplier-${k}`}
                                    checked={filterKodeSupplier.includes(k)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterKodeSupplier([
                                          ...filterKodeSupplier,
                                          k,
                                        ]);
                                      else
                                        setFilterKodeSupplier(
                                          filterKodeSupplier.filter(
                                            (x) => x !== k
                                          )
                                        );
                                    }}
                                  />
                                  <Label
                                    htmlFor={`kode-supplier-${k}`}
                                    className="text-sm"
                                  >
                                    {k}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Nama Barang */}
                    <TableHead className="text-left min-w-[160px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Nama Barang <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari barang..."
                            value={barangSearchTerm}
                            onChange={(e) =>
                              setBarangSearchTerm(e.target.value)
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Quantity */}
                    <TableHead className="text-left min-w-[90px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Quantity <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <div className="space-y-2">
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
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Satuan */}
                    <TableHead className="text-left min-w-[90px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
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
                                  <Label
                                    htmlFor={`satuan-${s}`}
                                    className="text-sm"
                                  >
                                    {s}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Sisa Stok */}
                    <TableHead className="text-left min-w-[90px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Sisa Stok <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          {/* Filter sisa stok bisa ditambah di sini jika diinginkan */}
                          <span className="text-xs text-muted-foreground">
                            Filter sisa stok manual diimplementasi jika perlu
                          </span>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Biaya */}
                    <TableHead className="text-left min-w-[120px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Biaya <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <div className="space-y-2">
                            <Input
                              placeholder="Min Biaya"
                              type="number"
                              value={filterBiayaMin}
                              onChange={(e) =>
                                setFilterBiayaMin(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                )
                              }
                            />
                            <Input
                              placeholder="Max Biaya"
                              type="number"
                              value={filterBiayaMax}
                              onChange={(e) =>
                                setFilterBiayaMax(
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
                    {/* Diterima Oleh */}
                    <TableHead className="text-left min-w-[120px]">
                      Diterima Oleh
                    </TableHead>
                    {/* Aksi */}
                    <TableHead className="text-left min-w-[90px]">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBTBData
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .map((btb: any) => {
                      const items =
                        btb.items &&
                        Array.isArray(btb.items) &&
                        btb.items.length > 0
                          ? btb.items
                          : btb.barang
                          ? [
                              {
                                barang: btb.barang,
                                jumlah: btb.jumlah,
                                satuan: btb.satuan,
                                sisa: btb.sisa ?? btb.jumlah,
                              },
                            ]
                          : [];
                      if (items.length === 0) return null;
                      return items.map((item: any, idx: number) => (
                        <TableRow key={btb.id + "-" + idx}>
                          {/* Checkbox per baris untuk export terpilih */}
                          <TableCell>
                            {exportMode === "selected" && idx === 0 && (
                              <Checkbox
                                checked={selectedBTBIds.includes(btb.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedBTBIds((prev) =>
                                    checked
                                      ? [...prev, btb.id]
                                      : prev.filter((id) => id !== btb.id)
                                  );
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell className="font-medium px-4 py-2 text-left">
                            {idx === 0 ? btb.noBTB : ""}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-left">
                            {idx === 0 ? btb.tanggal : ""}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-left">
                            {idx === 0 ? btb.periode : ""}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-left">
                            {idx === 0 ? btb.supplier : ""}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-left">
                            {idx === 0 ? btb.kodeSupplier : ""}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-left">
                            {item.barang}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-left">
                            {item.jumlah}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-left">
                            {item.satuan}
                          </TableCell>
                          {/* Sisa stok */}
                          <TableCell className="px-4 py-2 text-left">
                            <Badge
                              variant={
                                item.sisa > 0 ? "default" : "destructive"
                              }
                            >
                              {item.sisa ?? item.jumlah}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-2 text-left">
                            {idx === 0
                              ? "Rp " +
                                (btb.biaya?.toLocaleString?.("id-ID") ??
                                  btb.biaya)
                              : ""}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-left">
                            {idx === 0 ? btb.diterimaOleh ?? "" : ""}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-left">
                            {idx === 0 && (
                              <div className="flex gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => handleEdit(btb)}
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="outline" // <-- ubah dari "destructive" ke "outline"
                                  onClick={() => handleDelete(btb.id)}
                                  title="Hapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ));
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
              {Array.from(
                { length: Math.ceil(filteredBTBData.length / itemsPerPage) },
                (_, i) => i + 1
              ).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage(
                      Math.min(
                        Math.ceil(filteredBTBData.length / itemsPerPage),
                        currentPage + 1
                      )
                    )
                  }
                  className={
                    currentPage ===
                    Math.ceil(filteredBTBData.length / itemsPerPage)
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
