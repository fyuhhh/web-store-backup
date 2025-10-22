"use client";

import type React from "react";
import * as ExcelJS from "exceljs";
import { ChevronDown } from "lucide-react";

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

// Helper untuk format rupiah
function formatRupiah(val: any) {
  if (val === undefined || val === "" || isNaN(val)) return "";
  return "Rp " + Number(val).toLocaleString("id-ID");
}

// Helper untuk format tanggal DD-MM-YYYY
function formatTanggal(tgl: string | null | undefined) {
  if (!tgl) return "-";
  const [date] = tgl.split("T");
  const [y, m, d] = date.split("-");
  if (!y || !m || !d) return tgl;
  return `${d}-${m}-${y}`;
}

// Helper untuk format integer tanpa .00
function formatInt(val: any) {
  if (val === undefined || val === null || val === "") return "";
  const num = Number(val);
  return Number.isNaN(num)
    ? ""
    : num % 1 === 0
    ? num.toString()
    : num.toFixed(2);
}

export default function BTBMonitoringPage() {
  const [btbRows, setBtbRows] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter states
  const [filterSupplier, setFilterSupplier] = useState<string[]>([]);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
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
  const [exportMode, setExportMode] = useState<"all" | "selected" | "range">(
    "all"
  );
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [userSchema, setUserSchema] = useState<string>("");
  const [userSkemaId, setUserSkemaId] = useState<string>(""); // Tambah state id_skema user
  const [loading, setLoading] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [skemaMap, setSkemaMap] = useState<Record<string, string>>({});
  // Tambahkan state selectedBTBIds
  const [selectedBTBIds, setSelectedBTBIds] = useState<string[]>([]);

  // Ambil data dari backend
  useEffect(() => {
    async function fetchBTBData() {
      setLoading(true);
      try {
        // Ambil semua BTB, BTB Item, User, Skema, Satuan
        const [btbRes, btbItemRes, userRes, skemaRes, satuanRes] =
          await Promise.all([
            fetch("http://localhost:5000/api/btb"),
            fetch("http://localhost:5000/api/btb-item"),
            fetch("http://localhost:5000/api/user"),
            fetch("http://localhost:5000/api/skema"),
            fetch("http://localhost:5000/api/satuan"),
          ]);
        const btbList = await btbRes.json();
        const btbItemList = await btbItemRes.json();
        const userList = await userRes.json();
        const skemaList = await skemaRes.json();
        const satuanList = await satuanRes.json();

        // Buat mapping id_user -> nama_pengguna
        const userMapObj: Record<string, string> = {};
        userList.forEach((u: any) => {
          userMapObj[String(u.id_user)] = u.nama_pengguna;
        });
        setUserMap(userMapObj);

        // Buat mapping id_skema -> skema
        const skemaMapObj: Record<string, string> = {};
        skemaList.forEach((s: any) => {
          skemaMapObj[String(s.id_skema)] = s.skema;
        });
        setSkemaMap(skemaMapObj);

        // Buat mapping id_satuan -> satuanLabel
        const satuanMap: Record<string, string> = {};
        satuanList.forEach((s: any) => {
          satuanMap[String(s.id_satuan)] = s.satuan;
        });

        // Gabungkan: untuk setiap btb_item, cari parent btb
        const rows = btbItemList.map((item: any) => {
          const btb = btbList.find((b: any) => b.id_btb === item.id_btb);
          return {
            id: item.id_btb_item,
            noBTB: btb?.no_btb ?? "",
            tanggal: btb?.tanggal_btb ?? "", // <-- gunakan tanggal_btb
            periode: btb?.periode ?? "",
            id_supplier: btb?.id_supplier ?? "", // simpan id_supplier
            nama_supplier: btb?.nama_supplier ?? "", // simpan nama_supplier
            supplier: btb?.id_supplier ?? "", // legacy, bisa dihapus jika tidak dipakai
            nama_barang: item.nama_barang ?? "",
            jumlah: item.jumlah_diterima ?? "",
            satuan: satuanMap[String(item.id_satuan)] ?? item.satuanLabel ?? "",
            sisa: item.qty_sisa ?? "",
            biaya: btb?.biaya ?? "",
            diterimaOleh: btb?.id_user ?? "",
            skema: btb?.id_skema ?? "",
          };
        });
        setBtbRows(rows);
      } catch (err) {
        setBtbRows([]);
      }
      setLoading(false);
    }
    fetchBTBData();
  }, []);

  useEffect(() => {
    setUniquePeriode(
      Array.from(
        new Set(btbRows.map((row) => row.periode).filter(Boolean))
      ).sort()
    );
  }, [btbRows]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    setUserSchema(userData.skema || "");
    setUserSkemaId(String(userData.id_skema ?? userData.skema ?? "")); // Set id_skema user
  }, []);

  // Compute unique values for filters dari btbRows
  const uniqueSuppliers = Array.from(
    new Set(btbRows.map((row) => row.supplier).filter((s) => s && s !== ""))
  ).sort();
  const uniqueSatuan = Array.from(
    new Set(btbRows.map((row) => row.satuan).filter((s) => s && s !== ""))
  ).sort();
  const uniqueTanggalBTB = Array.from(
    new Set(btbRows.map((row) => row.tanggal).filter(Boolean))
  ).sort();

  // Filter data
  const filteredBTBData = btbRows
    // Filter hanya BTB dengan id_skema sesuai user login
    .filter((row) => !userSkemaId || String(row.skema) === String(userSkemaId))
    .filter((row) => {
      const matchesSearch =
        row.noBTB.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(row.supplier).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(row.barang ?? "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus = !filterStatus || row.status === filterStatus;

      // Filter barang (popover filter)
      const matchesBarangSearch =
        !barangSearchTerm ||
        row.barang.toLowerCase().includes(barangSearchTerm.toLowerCase());

      // Filter supplier
      const matchesSupplier =
        filterSupplier.length === 0 || filterSupplier.includes(row.supplier);

      // Filter satuan
      const matchesSatuan =
        filterSatuan.length === 0 || filterSatuan.includes(row.satuan);

      // Filter tanggal BTB
      const matchesTanggalBTB =
        filterTanggalBTB.length === 0 || filterTanggalBTB.includes(row.tanggal);

      // Filter periode
      const matchesPeriode =
        !filterPeriode ||
        row.periode === filterPeriode ||
        row.periode?.toLowerCase().includes(periodeSearchTerm.toLowerCase());

      // Filter quantity
      const matchesQtyMin =
        filterQtyMin === "" || Number(row.jumlah) >= Number(filterQtyMin);
      const matchesQtyMax =
        filterQtyMax === "" || Number(row.jumlah) <= Number(filterQtyMax);

      // Filter biaya
      const biayaVal = Number(row.biaya) || 0;
      const matchesBiayaMin =
        filterBiayaMin === "" || biayaVal >= Number(filterBiayaMin);
      const matchesBiayaMax =
        filterBiayaMax === "" || biayaVal <= Number(filterBiayaMax);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesBarangSearch &&
        matchesSupplier &&
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

    // Header sesuai urutan tabel monitoring BTB
    const headers = [
      "No. BTB",
      "Tanggal BTB",
      "Periode",
      "Nama Supplier",
      "Nama Barang",
      "Quantity",
      "Satuan",
      "Sisa Stok",
      "Biaya",
      "Diterima Oleh",
      "Skema",
    ];

    // Add header row
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "left", vertical: "middle" };
    });

    // Helper format tanggal ke dd-mm-yyyy
    function formatTanggalExcel(tgl: string | null | undefined) {
      if (!tgl) return "";
      const [date] = tgl.split("T");
      const [y, m, d] = date.split("-");
      return y && m && d ? `${d}-${m}-${y}` : tgl;
    }
    // Helper format quantity
    function formatQtyExcel(val: any) {
      const num = Number(val);
      if (Number.isNaN(num)) return "";
      return num % 1 === 0 ? num.toString() : num.toString();
    }
    // Helper format rupiah
    function formatRupiah(val: any) {
      if (val === undefined || val === "" || isNaN(val)) return "";
      return "Rp " + Number(val).toLocaleString("id-ID");
    }

    // Add data rows persis seperti tampilan tabel
    exportBTBData.forEach((btb) => {
      worksheet.addRow([
        btb.noBTB,
        formatTanggalExcel(btb.tanggal),
        btb.periode,
        btb.nama_supplier ?? btb.supplier ?? "",
        btb.nama_barang ?? "",
        formatQtyExcel(btb.jumlah),
        btb.satuan ?? "",
        formatQtyExcel(btb.sisa),
        formatRupiah(btb.biaya),
        userMap[String(btb.diterimaOleh)] ?? btb.diterimaOleh ?? "",
        skemaMap[String(btb.skema)] ?? btb.skema ?? "",
      ]);
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
              Total: {filteredBTBData.length} BTB Item
              {filteredBTBData.length > 0 && (
                <>
                  {" | "}
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredBTBData.length)}
                  {" dari "}
                  {filteredBTBData.length} BTB Item
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
                          <button className="inline-flex items-center gap-1">
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
                          <button className="inline-flex items-center gap-1">
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
                          <button className="inline-flex items-center gap-1">
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
                          <button className="inline-flex items-center gap-1">
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
                              .filter(
                                (s) =>
                                  typeof s === "string" &&
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
                    {/* Nama Barang */}
                    <TableHead className="text-left min-w-[160px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
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
                          <button className="inline-flex items-center gap-1">
                            Quantity BTB <ChevronDown className="w-4 h-4" />
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
                          <button className="inline-flex items-center gap-1">
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
                          <button className="inline-flex items-center gap-1">
                            Biaya <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
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
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Diterima Oleh */}
                    <TableHead className="text-left min-w-[120px]">
                      Diterima Oleh
                    </TableHead>
                    {/* Skema */}
                    <TableHead className="text-left min-w-[120px]">
                      Skema
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11}>Loading...</TableCell>
                    </TableRow>
                  ) : (
                    filteredBTBData
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage
                      )
                      .map((row, idx) => (
                        <TableRow key={row.id}>
                          {/* Checkbox cell agar jumlah kolom selalu sama */}
                          {exportMode === "selected" ? (
                            <TableCell>
                              <Checkbox
                                checked={selectedBTBIds.includes(row.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedBTBIds((prev) =>
                                    checked
                                      ? [...prev, row.id]
                                      : prev.filter((id) => id !== row.id)
                                  );
                                }}
                              />
                            </TableCell>
                          ) : (
                            <TableCell />
                          )}
                          {/* No. BTB */}
                          <TableCell className="font-medium px-4 py-2 text-left">
                            {row.noBTB}
                          </TableCell>
                          {/* Tanggal BTB */}
                          <TableCell className="px-4 py-2 text-left">
                            {formatTanggal(row.tanggal)}
                          </TableCell>
                          {/* Periode */}
                          <TableCell className="px-4 py-2 text-left">
                            {row.periode}
                          </TableCell>
                          {/* Nama Supplier */}
                          <TableCell className="px-4 py-2 text-left">
                            {row.nama_supplier || "-"}
                          </TableCell>
                          {/* Nama Barang */}
                          <TableCell className="px-4 py-2 text-left">
                            {row.nama_barang && row.nama_barang !== ""
                              ? row.nama_barang
                              : row.nama_supplier || "-"}
                          </TableCell>
                          {/* Quantity */}
                          <TableCell className="px-4 py-2 text-left">
                            {formatInt(row.jumlah)}
                          </TableCell>
                          {/* Satuan */}
                          <TableCell className="px-4 py-2 text-left">
                            {row.satuan}
                          </TableCell>
                          {/* Sisa Stok */}
                          <TableCell className="px-4 py-2 text-left">
                            <Badge
                              variant={
                                Number(row.sisa) > 0 ? "default" : "destructive"
                              }
                            >
                              {formatInt(row.sisa)}
                            </Badge>
                          </TableCell>
                          {/* Biaya */}
                          <TableCell className="px-4 py-2 text-left">
                            {formatRupiah(row.biaya)}
                          </TableCell>
                          {/* Diterima Oleh */}
                          <TableCell className="px-4 py-2 text-left">
                            {userMap[String(row.diterimaOleh)] ??
                              row.diterimaOleh}
                          </TableCell>
                          {/* Skema */}
                          <TableCell className="px-4 py-2 text-left">
                            {skemaMap[String(row.skema)] ?? row.skema}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
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
