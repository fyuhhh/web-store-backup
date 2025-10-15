"use client";

import React, { useState, useEffect } from "react";

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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { type PRData } from "@/lib/dummy-data";

export default function MonitoringPRPage() {
  const [prData, setPrData] = useState<PRData[]>([]);
  const [selectedPRs, setSelectedPRs] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  // Filter states
  const [filterNamaBarang, setFilterNamaBarang] = useState("");
  // New state for Qty dropdown filter
  const [filterQty, setFilterQty] = useState<number[]>([]);
  const [filterQtySearchTerm, setFilterQtySearchTerm] = useState("");
  // Remove old min/max Qty states
  // const [filterQtyMin, setFilterQtyMin] = useState<number | "">("");
  // const [filterQtyMax, setFilterQtyMax] = useState<number | "">("");
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

  // Compute unique values
  const uniqueSatuan = Array.from(
    new Set(prData.flatMap((pr) => pr.items?.map((item) => item.satuan) || []))
  ).sort();

  // Compute unique quantities for Qty filter dropdown
  const uniqueQty = Array.from(
    new Set(prData.flatMap((pr) => pr.items?.map((item) => item.jumlah) || []))
  ).sort((a, b) => a - b);

  const uniqueUrgensi = ["Low", "Medium", "High"];
  const uniqueDivisi = ["IT", "Civil", "Eng", "FAD", "HRD"];
  const uniqueStatus = [
    "Draft",
    "Submitted",
    "Approved",
    "Processed",
    "Clear",
    "Gantung",
    "Menunggu",
    "Telah Selesai",
  ];
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
        .filter((d): d is string => d !== undefined && d.trim() !== "")
    )
  ).sort();
  const uniqueSkema = Array.from(
    new Set(prData.map((pr) => pr.skema).filter((s) => !!s))
  ).sort();

  const [userSchema, setUserSchema] = useState<string>("");
  const [userSkema, setUserSkema] = useState<string>("");

  const [divisiOptions, setDivisiOptions] = useState<any[]>([]);
  const [urgensiOptions, setUrgensiOptions] = useState<any[]>([]);
  const [satuanOptions, setSatuanOptions] = useState<any[]>([]);
  useEffect(() => {
    // initializeDummyData(); // HAPUS BARIS INI
    fetch("http://localhost:5000/api/divisi")
      .then((res) => res.json())
      .then((data) => setDivisiOptions(data));
    fetch("http://localhost:5000/api/urgensi")
      .then((res) => res.json())
      .then((data) => setUrgensiOptions(data));
    fetch("http://localhost:5000/api/satuan")
      .then((res) => res.json())
      .then((data) => setSatuanOptions(data));
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    setUserSchema(userData.schema || "");
    setUserSkema(userData.skema || "");
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
    filterQty,
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
    const prRes = await fetch("http://localhost:5000/api/pr");
    const prList = await prRes.json();
    const prItemRes = await fetch("http://localhost:5000/api/pr-item");
    const prItemList = await prItemRes.json();

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
      const items = prItemList
        .filter((item: any) => String(item.id_PR) === String(pr.id_PR))
        .map((item: any) => ({
          // Ganti namabarang -> namaBarang agar konsisten dengan backend
          namaBarang: item.namaBarang, // <-- perbaikan di sini
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
        urgensi: urgensiMap[String(pr.id_urgensi)] || pr.id_urgensi, // tampilkan nama urgensi
        divisi: divisiMap[String(pr.id_divisi)] || pr.id_divisi, // tampilkan nama divisi
        status: pr.status,
        dibuatOleh: pr.dibuatOleh,
        skema: pr.id_skema,
        skemaLabel: pr.skemaLabel ?? "",
      };
    });
    setPrData(validatedData);
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

  const handleDelete = (id: string) => {
    if (
      confirm(
        "Apakah Anda yakin ingin menghapus PR ini? Data yang dihapus tidak dapat dikembalikan."
      )
    ) {
      try {
        const updatedData = prData.filter((pr) => pr.id !== id);
        savePRData(updatedData);

        // Remove from selected PRs if it was selected
        setSelectedPRs(selectedPRs.filter((prId) => prId !== id));

        // Show success message
        alert("PR berhasil dihapus!");

        // Reload data to ensure consistency
        loadPRData();
      } catch (error) {
        console.error("Error deleting PR:", error);
        alert("Terjadi kesalahan saat menghapus PR. Silakan coba lagi.");
      }
    }
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

  // Filter data
  const filteredPRData = prData
    .filter((pr) => !userSkema || pr.skema === userSkema) // ganti schema -> skema
    .map((pr) => {
      // Status default "Diproses" jika belum ada status, atau gunakan status yang sudah ada
      let status = pr.status || "Diproses";
      return { ...pr, status };
    })
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

      // Updated matchesQty to check if item's jumlah is in filterQty array if filterQty is not empty
      const matchesQty =
        filterQty.length === 0 ||
        pr.items?.some((item) => filterQty.includes(item.jumlah));

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

      return (
        matchesSearch &&
        matchesNamaBarang &&
        matchesQty &&
        matchesQtyPRAwal &&
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
    });
  //.filter((pr) => pr.items?.some((item) => item.jumlah > 0));

  // Pagination logic
  const totalPages = Math.ceil(filteredPRData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredPRData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

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

  const getStatusBadge = (status: string) => {
    if (status === "Menunggu") {
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-300">
          Menunggu
        </Badge>
      );
    }
    if (status === "Gantung") {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-300">
          Gantung
        </Badge>
      );
    }
    if (status === "Diproses") {
      return (
        <Badge className="bg-gray-200 text-gray-700 border-gray-300">
          Diproses
        </Badge>
      );
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const [exportMode, setExportMode] = useState<"all" | "selected" | "range">(
    "all"
  );
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  // Data untuk export sesuai mode
  const getExportPRData = () => {
    if (exportMode === "selected") {
      return filteredPRData.filter((pr) => selectedPRs.includes(pr.id));
    }
    if (exportMode === "range" && exportStartDate && exportEndDate) {
      return filteredPRData.filter(
        (pr) => pr.tanggalPR >= exportStartDate && pr.tanggalPR <= exportEndDate
      );
    }
    return filteredPRData;
  };

  const handleExport = async () => {
    const exportPRData = getExportPRData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monitoring PR");

    const headers = [
      "No. PR",
      "Tanggal PR",
      "Daftar Barang",
      "Quantity",
      "Qty PR Awal",
      "Satuan",
      "Keterangan",
      "Urgensi",
      "Divisi",
      "Status",
      "Dibuat Oleh",
    ];

    // Add header row with bold font
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "left", vertical: "middle" };
    });

    // Prepare and add data rows
    exportPRData.forEach((pr) => {
      const validItems = pr.items?.filter((item) => item.jumlah > 0) || [];
      if (validItems.length > 0) {
        validItems.forEach((item, index) => {
          const rowData = [
            index === 0 ? pr.noPR : "",
            index === 0 ? pr.tanggalPR : "",
            item.namaBarang,
            String(item.jumlah),
            String(item.quantityAwalPR),
            item.satuan,
            item.keterangan || "",
            index === 0 ? pr.urgensi : "",
            index === 0 ? pr.divisi : "",
            index === 0 ? pr.status : "",
            index === 0 ? pr.dibuatOleh : "",
          ];

          const dataRow = worksheet.addRow(rowData);
          dataRow.eachCell((cell) => {
            cell.alignment = { horizontal: "left", vertical: "middle" };
          });
        });
      } else {
        // Handle PR without items
        const rowData = [
          pr.noPR,
          pr.tanggalPR,
          "",
          "",
          "",
          "",
          pr.urgensi,
          pr.divisi,
          pr.status,
          pr.dibuatOleh,
        ];

        const dataRow = worksheet.addRow(rowData);
        dataRow.eachCell((cell) => {
          cell.alignment = { horizontal: "left", vertical: "middle" };
        });
      }
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

        {/* Filters */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Cari berdasarkan nama barang atau no PR..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[150px] justify-between"
                  >
                    Divisi ({filterDivisi.length || "Semua"})
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 !bg-white border border-gray-200 shadow-lg">
                  <Input
                    placeholder="Cari divisi..."
                    value={divisiSearchTerm}
                    onChange={(e) => setDivisiSearchTerm(e.target.value)}
                    className="mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all-divisi"
                        checked={
                          filterDivisi.length === uniqueDivisi.length &&
                          uniqueDivisi.length > 0
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilterDivisi([...uniqueDivisi]);
                          } else {
                            setFilterDivisi([]);
                          }
                        }}
                      />
                      <Label htmlFor="select-all-divisi" className="text-sm">
                        Pilih Semua
                      </Label>
                    </div>
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
                                setFilterDivisi([...filterDivisi, divisi]);
                              } else {
                                setFilterDivisi(
                                  filterDivisi.filter((f) => f !== divisi)
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[150px] justify-between"
                  >
                    Status ({filterStatus.length || "Semua"})
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 !bg-white border border-gray-200 shadow-lg">
                  <Input
                    placeholder="Cari status..."
                    value={statusSearchTerm}
                    onChange={(e) => setStatusSearchTerm(e.target.value)}
                    className="mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all-status"
                        checked={
                          filterStatus.length === uniqueStatus.length &&
                          uniqueStatus.length > 0
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilterStatus([...uniqueStatus]);
                          } else {
                            setFilterStatus([]);
                          }
                        }}
                      />
                      <Label htmlFor="select-all-status" className="text-sm">
                        Pilih Semua
                      </Label>
                    </div>
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
                                setFilterStatus([...filterStatus, status]);
                              } else {
                                setFilterStatus(
                                  filterStatus.filter((f) => f !== status)
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
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Daftar Purchase Request</CardTitle>
            <CardDescription>
              Total: {filteredPRData.length} PR | Dipilih: {selectedPRs.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto min-w-[1200px]">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">
                      {/* Checkbox Select All */}
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
                    <TableHead className="min-w-[140px]">No. PR</TableHead>
                    <TableHead className="min-w-[140px]">Tanggal PR</TableHead>
                    <TableHead className="min-w-[180px]">
                      Daftar Barang
                    </TableHead>
                    <TableHead className="min-w-[90px]">Qty</TableHead>
                    <TableHead className="min-w-[90px]">Qty PR Awal</TableHead>
                    <TableHead className="min-w-[90px]">Satuan</TableHead>
                    <TableHead className="min-w-[160px]">Keterangan</TableHead>
                    <TableHead className="min-w-[100px]">Urgensi</TableHead>
                    <TableHead className="min-w-[100px]">Divisi</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">Dibuat Oleh</TableHead>
                    <TableHead className="min-w-[120px]">Skema</TableHead>
                    <TableHead className="min-w-[120px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((pr) => {
                    const validItems = pr.items || [];
                    if (validItems.length === 0) return null;

                    const tanggalPR = pr.tanggalPR
                      ? pr.tanggalPR.split("T")[0]
                      : "";

                    return (
                      <React.Fragment key={pr.id}>
                        <TableRow>
                          <TableCell rowSpan={validItems.length}>
                            {/* Checkbox per baris */}
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
                            className="font-medium"
                            rowSpan={validItems.length}
                          >
                            {pr.noPR}
                          </TableCell>
                          <TableCell rowSpan={validItems.length}>
                            {tanggalPR}
                          </TableCell>
                          <TableCell>{validItems[0]?.namaBarang}</TableCell>
                          <TableCell>
                            {parseFloat(validItems[0]?.jumlah) % 1 === 0
                              ? parseInt(validItems[0]?.jumlah)
                              : validItems[0]?.jumlah}
                          </TableCell>
                          <TableCell>
                            {parseFloat(validItems[0]?.quantityAwalPR) % 1 === 0
                              ? parseInt(validItems[0]?.quantityAwalPR)
                              : validItems[0]?.quantityAwalPR}
                          </TableCell>
                          <TableCell>{validItems[0]?.satuan}</TableCell>
                          <TableCell>
                            <div
                              className="text-sm text-muted-foreground max-w-xs truncate"
                              title={validItems[0]?.keterangan}
                            >
                              {validItems[0]?.keterangan}
                            </div>
                          </TableCell>
                          <TableCell rowSpan={validItems.length}>
                            {getUrgensiBadge(pr.urgensi)}
                          </TableCell>
                          <TableCell rowSpan={validItems.length}>
                            {pr.divisi}
                          </TableCell>
                          <TableCell rowSpan={validItems.length}>
                            {getStatusBadge(pr.status)}
                          </TableCell>
                          <TableCell rowSpan={validItems.length}>
                            {pr.dibuatOleh}
                          </TableCell>
                          <TableCell rowSpan={validItems.length}>
                            {pr.skemaLabel ?? pr.skema ?? ""}
                          </TableCell>
                          <TableCell rowSpan={validItems.length}>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(pr)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
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
                        {validItems.slice(1).map((item, index) => (
                          <TableRow key={`${pr.id}-item-${index + 1}`}>
                            <TableCell>{item.namaBarang}</TableCell>
                            <TableCell>
                              {parseFloat(item.jumlah) % 1 === 0
                                ? parseInt(item.jumlah)
                                : item.jumlah}
                            </TableCell>
                            <TableCell>
                              {parseFloat(item.quantityAwalPR) % 1 === 0
                                ? parseInt(item.quantityAwalPR)
                                : item.quantityAwalPR}
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
