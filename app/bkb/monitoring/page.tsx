"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import * as ExcelJS from "exceljs";
import { Edit, Trash2 } from "lucide-react";
import type { BKBData, BTBData } from "@/lib/dummy-data";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function MonitoringBKBPage() {
  const [bkbData, setBkbData] = useState<BKBData[]>([]);
  const [btbData, setBtbData] = useState<BTBData[]>([]);
  const [searchNoBKB, setSearchNoBKB] = useState("");
  const [searchNoBTB, setSearchNoBTB] = useState("");
  const [searchBarang, setSearchBarang] = useState("");
  const [searchKeterangan, setSearchKeterangan] = useState("");
  const [searchSatuan, setSearchSatuan] = useState("");
  const [searchPeriode, setSearchPeriode] = useState("");
  const [filterTanggalMulai, setFilterTanggalMulai] = useState("");
  const [filterTanggalAkhir, setFilterTanggalAkhir] = useState("");
  const [selectedBKBIds, setSelectedBKBIds] = useState<string[]>([]);
  const [exportMode, setExportMode] = useState<"all" | "selected" | "range">(
    "all"
  );
  const [filterNoBKB, setFilterNoBKB] = useState<string[]>([]);
  const [noBKBSearchTerm, setNoBKBSearchTerm] = useState("");
  const [filterTanggalBKB, setFilterTanggalBKB] = useState<string[]>([]);
  const [tanggalBKBSearhTerm, setTanggalBKBSearhTerm] = useState("");
  const [filterNamaBarang, setFilterNamaBarang] = useState<string[]>([]);
  const [namaBarangSearchTerm, setNamaBarangSearchTerm] = useState("");
  const [filterQuantity, setFilterQuantity] = useState<string[]>([]);
  const [quantitySearchTerm, setQuantitySearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchDikeluarkanOleh, setSearchDikeluarkanOleh] = useState("");
  const [filterDikeluarkanOleh, setFilterDikeluarkanOleh] = useState<string[]>(
    []
  );
  const [userSchema, setUserSchema] = useState<string>("");

  useEffect(() => {
    const storedBKB = localStorage.getItem("bkbData");
    if (storedBKB) {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      const userSkema = userData.skema || "";
      // Filter BKB sesuai skema user
      setBkbData(
        JSON.parse(storedBKB).filter(
          (bkb: any) => !userSkema || bkb.skema === userSkema
        )
      );
    }
    const storedBTB = localStorage.getItem("btbData");
    if (storedBTB) setBtbData(JSON.parse(storedBTB));

    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    setUserSchema(userData.schema || "");
  }, []);

  // Helper: get BTB reference (No BTB) for a given btbId
  function getNoBTB(btbId: string) {
    const btb = btbData.find((b) => b.id === btbId);
    return btb?.noBTB || btbId;
  }

  // Unique values for filter dropdowns
  const uniqueNoBKB = Array.from(
    new Set(bkbData.map((b) => b.noBKB).filter(Boolean))
  ).sort();
  const uniqueTanggalBKB = Array.from(
    new Set(bkbData.map((b) => b.tanggalBKB || b.tanggal).filter(Boolean))
  ).sort();
  const uniqueNamaBarang = Array.from(
    new Set(
      bkbData
        .flatMap((b) =>
          (Array.isArray(b.items) && b.items.length > 0
            ? b.items
            : Array.isArray(b.barang)
            ? b.barang
            : b.barang
            ? [{ barang: b.barang }]
            : []
          ).map((item: any) => String(item.barang || ""))
        )
        .filter(Boolean)
    )
  ).sort();
  const uniqueQuantity = Array.from(
    new Set(
      bkbData
        .flatMap((b) =>
          (Array.isArray(b.items) && b.items.length > 0
            ? b.items
            : Array.isArray(b.barang)
            ? b.barang
            : b.barang
            ? [{ jumlah: b.jumlah }]
            : []
          ).map((item: any) => String(item.jumlah || ""))
        )
        .filter(Boolean)
    )
  ).sort();
  const uniqueSatuan = Array.from(
    new Set(
      bkbData
        .flatMap((b) =>
          (b.items ?? []).map((item: any) => item.satuan).concat(b.satuan)
        )
        .filter(Boolean)
    )
  ).sort();
  const uniqueDikeluarkanOleh = Array.from(
    new Set(bkbData.map((b) => b.dikeluarkanOleh).filter(Boolean))
  ).sort();

  // Filtered data
  const filteredBKB = bkbData
    .filter((bkb) => !userSchema || bkb.skema === userSchema) // <-- filter by schema
    .filter((bkb) => {
      // Filter tanggal
      const tanggal = bkb.tanggal || "";
      const inTanggalRange =
        (!filterTanggalMulai || tanggal >= filterTanggalMulai) &&
        (!filterTanggalAkhir || tanggal <= filterTanggalAkhir);

      // Filter No BKB
      const matchNoBKB =
        (filterNoBKB.length === 0 || filterNoBKB.includes(bkb.noBKB)) &&
        (!searchNoBKB ||
          bkb.noBKB?.toLowerCase().includes(searchNoBKB.toLowerCase()));

      // Filter Tanggal BKB
      const tanggalBKBVal = bkb.tanggalBKB || bkb.tanggal || "";
      const matchTanggalBKB =
        filterTanggalBKB.length === 0 ||
        filterTanggalBKB.includes(tanggalBKBVal);

      // Filter Nama Barang
      const items =
        Array.isArray(bkb.items) && bkb.items.length > 0
          ? bkb.items
          : Array.isArray(bkb.barang)
          ? bkb.barang
          : bkb.barang
          ? [
              {
                barang: bkb.barang,
                jumlah: bkb.jumlah,
                satuan: bkb.satuan,
                keterangan: bkb.keterangan,
                btbId: bkb.btbId,
              },
            ]
          : [];
      const matchNamaBarang =
        filterNamaBarang.length === 0 ||
        items.some((item: any) =>
          filterNamaBarang.includes(String(item.barang || ""))
        );

      // Filter Quantity
      const matchQuantity =
        filterQuantity.length === 0 ||
        items.some((item: any) =>
          filterQuantity.includes(String(item.jumlah || ""))
        );

      // Filter satuan
      const matchSatuan =
        !searchSatuan ||
        items.some((item: any) =>
          (item.satuan ?? "").toLowerCase().includes(searchSatuan.toLowerCase())
        );

      // Filter keterangan
      const matchKeterangan =
        !searchKeterangan ||
        items.some((item: any) =>
          (item.keterangan ?? "")
            .toLowerCase()
            .includes(searchKeterangan.toLowerCase())
        );

      // Filter No BTB (asal BTB)
      const matchNoBTB =
        !searchNoBTB ||
        (bkb.btbId &&
          bkb.btbId
            .split(",")
            .some((id) =>
              getNoBTB(id).toLowerCase().includes(searchNoBTB.toLowerCase())
            ));

      // Filter Di Keluarkan Oleh
      const matchDikeluarkanOleh =
        filterDikeluarkanOleh.length === 0 ||
        filterDikeluarkanOleh.includes(bkb.dikeluarkanOleh || "");

      return (
        inTanggalRange &&
        matchNoBKB &&
        matchTanggalBKB &&
        matchNoBTB &&
        matchNamaBarang &&
        matchQuantity &&
        matchSatuan &&
        matchKeterangan &&
        matchDikeluarkanOleh
      );
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredBKB.length / itemsPerPage);
  const pagedBKB = filteredBKB.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Group by No BKB for stacked rows (gunakan pagedBKB)
  const grouped = Object.values(
    pagedBKB.reduce((acc: any, bkb) => {
      if (!acc[bkb.noBKB]) acc[bkb.noBKB] = [];
      acc[bkb.noBKB].push(bkb);
      return acc;
    }, {})
  );

  // Export Excel
  const handleExport = async () => {
    let exportData = filteredBKB;
    if (exportMode === "selected") {
      exportData = filteredBKB.filter((bkb) => selectedBKBIds.includes(bkb.id));
    }
    if (exportMode === "range" && filterTanggalMulai && filterTanggalAkhir) {
      exportData = filteredBKB.filter(
        (bkb) =>
          bkb.tanggal >= filterTanggalMulai && bkb.tanggal <= filterTanggalAkhir
      );
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monitoring BKB");
    const headers = [
      "No BKB",
      "Tanggal BKB",
      "Nama Barang",
      "Quantity",
      "Satuan",
      "Keterangan",
      "Asal BTB",
      "Di Keluarkan Oleh",
      "Skema", // <-- kolom baru
    ];
    worksheet.addRow(headers).eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "left", vertical: "middle" };
    });
    exportData.forEach((bkb) => {
      const items =
        Array.isArray(bkb.items) && bkb.items.length > 0
          ? bkb.items
          : Array.isArray(bkb.barang)
          ? bkb.barang.map((b: any) => ({
              barang: b.barang,
              jumlah: b.jumlah,
              satuan: b.satuan,
              keterangan: b.keterangan || bkb.keterangan,
              btbId: b.btbId || bkb.btbId,
            }))
          : bkb.barang && typeof bkb.barang === "object" && bkb.barang.barang
          ? [bkb.barang]
          : bkb.barang
          ? [
              {
                barang: bkb.barang,
                jumlah: bkb.jumlah,
                satuan: bkb.satuan,
                keterangan: bkb.keterangan,
                btbId: bkb.btbId,
              },
            ]
          : [];
      items.forEach((item: any, idx: number) => {
        worksheet.addRow([
          idx === 0 ? bkb.noBKB : "",
          idx === 0 ? bkb.tanggal : "",
          String(item.barang || ""),
          item.jumlah || 0,
          String(item.satuan || ""),
          item.keterangan ?? "",
          getNoBTB(item.btbId ?? bkb.btbId),
          idx === 0 ? bkb.dikeluarkanOleh : "",
          idx === 0 ? bkb.skema : "", // <-- kolom baru
        ]);
      });
    });
    worksheet.columns.forEach((col) => {
      let maxLength = 10;
      col.eachCell({ includeEmpty: true }, (cell) => {
        maxLength = Math.max(maxLength, String(cell.value ?? "").length + 2);
      });
      col.width = maxLength;
    });
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `monitoring-bkb-${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleEdit = (bkb: BKBData) => {
    localStorage.setItem("editingBKB", JSON.stringify(bkb));
    window.location.href = "/bkb/input";
  };

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus BKB ini?")) {
      const updatedData = bkbData.filter((bkb) => bkb.id !== id);
      localStorage.setItem("bkbData", JSON.stringify(updatedData));
      setBkbData(updatedData);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Monitoring BKB
            </h1>
            <p className="text-muted-foreground">
              Pantau seluruh Bukti Keluar Barang yang telah dibuat
            </p>
          </div>
          <div className="flex items-center gap-3 bg-muted/40 px-4 py-2 rounded-lg">
            <Label htmlFor="exportMode" className="text-xs font-medium">
              Mode Export
            </Label>
            <Select
              value={exportMode}
              onValueChange={(val) => setExportMode(val as any)}
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
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filterTanggalMulai}
                  onChange={(e) => setFilterTanggalMulai(e.target.value)}
                  className="w-[130px] h-9"
                  placeholder="Mulai"
                />
                <span className="mx-1">-</span>
                <Input
                  type="date"
                  value={filterTanggalAkhir}
                  onChange={(e) => setFilterTanggalAkhir(e.target.value)}
                  className="w-[130px] h-9"
                  placeholder="Akhir"
                />
              </div>
            )}
            <Button
              onClick={handleExport}
              className="bg-primary hover:bg-primary/90 h-9"
              disabled={
                (exportMode === "selected" && selectedBKBIds.length === 0) ||
                (exportMode === "range" &&
                  (!filterTanggalMulai || !filterTanggalAkhir))
              }
            >
              Export Excel
            </Button>
          </div>
        </div>
        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Bukti Keluar Barang</CardTitle>
            <CardDescription>Total: {filteredBKB.length} BKB</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="border border-gray-300 min-w-[1100px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 text-center align-middle">
                      {exportMode === "selected" && (
                        <Checkbox
                          checked={
                            filteredBKB.length > 0 &&
                            filteredBKB.every((bkb) =>
                              selectedBKBIds.includes(bkb.id)
                            )
                          }
                          onCheckedChange={(checked) =>
                            setSelectedBKBIds(
                              checked ? filteredBKB.map((bkb) => bkb.id) : []
                            )
                          }
                        />
                      )}
                    </TableHead>
                    {/* No BKB */}
                    <TableHead className="min-w-[140px] align-middle">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            No BKB <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 bg-white">
                          <Input
                            placeholder="Cari No BKB..."
                            value={noBKBSearchTerm}
                            onChange={(e) => setNoBKBSearchTerm(e.target.value)}
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueNoBKB
                              .filter((n) =>
                                n
                                  .toLowerCase()
                                  .includes(noBKBSearchTerm.toLowerCase())
                              )
                              .map((n) => (
                                <div
                                  key={n}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`nobkb-${n}`}
                                    checked={filterNoBKB.includes(n)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterNoBKB([...filterNoBKB, n]);
                                      else
                                        setFilterNoBKB(
                                          filterNoBKB.filter((x) => x !== n)
                                        );
                                    }}
                                  />
                                  <Label
                                    htmlFor={`nobkb-${n}`}
                                    className="text-sm"
                                  >
                                    {n}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Tanggal BKB */}
                    <TableHead className="min-w-[120px] align-middle">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Tanggal BKB <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 bg-white">
                          <Input
                            placeholder="Cari Tanggal BKB..."
                            value={tanggalBKBSearhTerm}
                            onChange={(e) =>
                              setTanggalBKBSearhTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueTanggalBKB
                              .filter((t) =>
                                t
                                  .toLowerCase()
                                  .includes(tanggalBKBSearhTerm.toLowerCase())
                              )
                              .map((t) => (
                                <div
                                  key={t}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`tglbkb-${t}`}
                                    checked={filterTanggalBKB.includes(t)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterTanggalBKB([
                                          ...filterTanggalBKB,
                                          t,
                                        ]);
                                      else
                                        setFilterTanggalBKB(
                                          filterTanggalBKB.filter(
                                            (x) => x !== t
                                          )
                                        );
                                    }}
                                  />
                                  <Label
                                    htmlFor={`tglbkb-${t}`}
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
                    {/* Nama Barang */}
                    <TableHead className="min-w-[180px] align-middle">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Nama Barang <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 bg-white">
                          <Input
                            placeholder="Cari Nama Barang..."
                            value={namaBarangSearchTerm}
                            onChange={(e) =>
                              setNamaBarangSearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueNamaBarang
                              .filter((n) =>
                                n
                                  .toLowerCase()
                                  .includes(namaBarangSearchTerm.toLowerCase())
                              )
                              .map((n) => (
                                <div
                                  key={n}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`namabarang-${n}`}
                                    checked={filterNamaBarang.includes(n)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterNamaBarang([
                                          ...filterNamaBarang,
                                          n,
                                        ]);
                                      else
                                        setFilterNamaBarang(
                                          filterNamaBarang.filter(
                                            (x) => x !== n
                                          )
                                        );
                                    }}
                                  />
                                  <Label
                                    htmlFor={`namabarang-${n}`}
                                    className="text-sm"
                                  >
                                    {n}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Quantity */}
                    <TableHead className="min-w-[90px] align-middle">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Quantity <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2 bg-white">
                          <Input
                            placeholder="Cari Quantity..."
                            value={quantitySearchTerm}
                            onChange={(e) =>
                              setQuantitySearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueQuantity
                              .filter((q) =>
                                q
                                  .toLowerCase()
                                  .includes(quantitySearchTerm.toLowerCase())
                              )
                              .map((q) => (
                                <div
                                  key={q}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`qty-${q}`}
                                    checked={filterQuantity.includes(q)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterQuantity([
                                          ...filterQuantity,
                                          q,
                                        ]);
                                      else
                                        setFilterQuantity(
                                          filterQuantity.filter((x) => x !== q)
                                        );
                                    }}
                                  />
                                  <Label
                                    htmlFor={`qty-${q}`}
                                    className="text-sm"
                                  >
                                    {q}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Satuan */}
                    <TableHead className="min-w-[90px] align-middle">
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
                            placeholder="Cari Satuan..."
                            value={searchSatuan}
                            onChange={(e) => setSearchSatuan(e.target.value)}
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueSatuan
                              .filter((s) =>
                                s
                                  .toLowerCase()
                                  .includes(searchSatuan.toLowerCase())
                              )
                              .map((s) => (
                                <div
                                  key={s}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`satuan-${s}`}
                                    checked={searchSatuan === s}
                                    onCheckedChange={(checked) => {
                                      setSearchSatuan(checked ? s : "");
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
                    {/* Keterangan */}
                    <TableHead className="min-w-[200px] align-middle">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Keterangan <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari Keterangan..."
                            value={searchKeterangan}
                            onChange={(e) =>
                              setSearchKeterangan(e.target.value)
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Asal BTB */}
                    <TableHead className="min-w-[140px] align-middle">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Asal BTB <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari No BTB..."
                            value={searchNoBTB}
                            onChange={(e) => setSearchNoBTB(e.target.value)}
                          />
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Di Keluarkan Oleh */}
                    <TableHead className="min-w-[140px] align-middle">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Di Keluarkan Oleh{" "}
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari Di Keluarkan Oleh..."
                            value={searchDikeluarkanOleh}
                            onChange={(e) =>
                              setSearchDikeluarkanOleh(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueDikeluarkanOleh
                              .filter((n) =>
                                n
                                  .toLowerCase()
                                  .includes(searchDikeluarkanOleh.toLowerCase())
                              )
                              .map((n) => (
                                <div
                                  key={n}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`dikeluarkan-oleh-${n}`}
                                    checked={filterDikeluarkanOleh.includes(n)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterDikeluarkanOleh([
                                          ...filterDikeluarkanOleh,
                                          n,
                                        ]);
                                      else
                                        setFilterDikeluarkanOleh(
                                          filterDikeluarkanOleh.filter(
                                            (x) => x !== n
                                          )
                                        );
                                    }}
                                  />
                                  <Label
                                    htmlFor={`dikeluarkan-oleh-${n}`}
                                    className="text-sm"
                                  >
                                    {n}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Skema */}
                    <TableHead className="min-w-[140px] align-middle">
                      Skema
                    </TableHead>
                    {/* Aksi */}
                    <TableHead className="min-w-[90px] align-middle">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedBKB.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center text-muted-foreground"
                      >
                        Tidak ada data BKB.
                      </TableCell>
                    </TableRow>
                  )}
                  {grouped.map((bkbGroup: any[]) =>
                    bkbGroup.map((bkb, groupIdx) => {
                      // ...existing code for items...
                      const items =
                        Array.isArray(bkb.items) && bkb.items.length > 0
                          ? bkb.items
                          : Array.isArray(bkb.barang)
                          ? bkb.barang.map((b: any) => ({
                              barang: b.barang,
                              jumlah: b.jumlah,
                              satuan: b.satuan,
                              keterangan: b.keterangan || bkb.keterangan,
                              btbId: b.btbId || bkb.btbId,
                            }))
                          : bkb.barang &&
                            typeof bkb.barang === "object" &&
                            bkb.barang.barang
                          ? [bkb.barang]
                          : bkb.barang
                          ? [
                              {
                                barang: bkb.barang,
                                jumlah: bkb.jumlah,
                                satuan: bkb.satuan,
                                keterangan: bkb.keterangan,
                                btbId: bkb.btbId,
                              },
                            ]
                          : [];
                      return items.map((item: any, idx: number) => (
                        <TableRow
                          key={bkb.id + "-" + idx}
                          className="align-middle"
                        >
                          {idx === 0 && (
                            <>
                              <TableCell
                                rowSpan={items.length}
                                className="text-center align-middle w-10"
                              >
                                {exportMode === "selected" && (
                                  <Checkbox
                                    checked={selectedBKBIds.includes(bkb.id)}
                                    onCheckedChange={(checked) =>
                                      setSelectedBKBIds((prev) =>
                                        checked
                                          ? [...prev, bkb.id]
                                          : prev.filter((id) => id !== bkb.id)
                                      )
                                    }
                                  />
                                )}
                              </TableCell>
                              <TableCell
                                rowSpan={items.length}
                                className="align-middle"
                              >
                                {bkb.noBKB}
                              </TableCell>
                              <TableCell
                                rowSpan={items.length}
                                className="align-middle"
                              >
                                {bkb.tanggalBKB || bkb.tanggal}
                              </TableCell>
                            </>
                          )}
                          <TableCell className="align-middle">
                            {String(item.barang || "")}
                          </TableCell>
                          <TableCell className="align-middle">
                            {item.jumlah || 0}
                          </TableCell>
                          <TableCell className="align-middle">
                            {String(item.satuan || "")}
                          </TableCell>
                          <TableCell className="align-middle">
                            {item.keterangan ?? bkb.keterangan ?? ""}
                          </TableCell>
                          {idx === 0 && (
                            <TableCell
                              rowSpan={items.length}
                              className="align-middle"
                            >
                              {getNoBTB(item.btbId ?? bkb.btbId)}
                            </TableCell>
                          )}
                          <TableCell className="align-middle">
                            {idx === 0 && bkb.dikeluarkanOleh}
                          </TableCell>
                          <TableCell className="align-middle">
                            {idx === 0 && bkb.skema} {/* <-- kolom baru */}
                          </TableCell>
                          <TableCell className="align-middle">
                            {idx === 0 && (
                              <div className="flex gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => handleEdit(bkb)}
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="outline" // <-- ubah dari "destructive" ke "outline"
                                  onClick={() => handleDelete(bkb.id)}
                                  title="Hapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ));
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination */}
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
