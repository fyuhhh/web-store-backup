"use client";

import React, { useEffect, useState, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown, Trash2, FileSpreadsheet } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_BASE_URL } from "@/lib/config";
import * as ExcelJS from "exceljs";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Helper Formatters
const formatCurrency = (val: any) => {
    const num = Number(val) || 0;
    return "Rp " + num.toLocaleString("id-ID", { maximumFractionDigits: 0 });
};

const formatNumber = (val: any) => {
    const num = Number(val) || 0;
    return num.toLocaleString("id-ID");
};

const formatDate = (val: string) => {
    if (!val) return "-";
    const date = new Date(val);
    return isNaN(date.getTime()) ? val : date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
};

const TruncatedText = ({ text, maxLength = 15 }: { text: string; maxLength?: number }) => {
    if (!text) return <span>-</span>;
    if (text.length <= maxLength) return <span>{text}</span>;
    return (
        <div className="group relative cursor-pointer" title={text}>
            <span className="block truncate">{text.substring(0, maxLength)}...</span>
        </div>
    );
};

export default function DivisiMonitoringMRPage() {
    const [originalData, setOriginalData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters State
    const [filterNoMR, setFilterNoMR] = useState<string[]>([]);
    const [noMRSearchTerm, setNoMRSearchTerm] = useState("");
    const [searchTerm, setSearchTerm] = useState(""); // Global Search

    const [filterNamaBarang, setFilterNamaBarang] = useState("");
    
    // Global Date Range Filter
    const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
    const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
    
    // Column Date Filter (Checkbox)
    const [filterTanggalMR, setFilterTanggalMR] = useState<string[]>([]);
    const [tanggalMRSearchTerm, setTanggalMRSearchTerm] = useState("");

    // Schema & Divisi Filter
    const [userSkemaId, setUserSkemaId] = useState<string | null>(null);
    const [userDivisiId, setUserDivisiId] = useState<string | null>(null);

    // Selection
    const [selectedMRs, setSelectedMRs] = useState<string[]>([]);

    const tableWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        // Prioritize id_skema, verify if it aligns with DB types (string vs number)
        const skema = localStorage.getItem("selectedSkemaId") || (userData.id_skema ?? userData.skema ?? null);
        setUserSkemaId(skema ? String(skema) : null);

        // Divisi Filter
        const divisi = userData.id_divisi ?? null;
        setUserDivisiId(divisi ? String(divisi) : null);

        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/api/mr/items/all`);
            if (!response.ok) throw new Error("Failed to fetch");
            const result = await response.json();
            if (Array.isArray(result)) {
                setOriginalData(result);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };
    
    // Export State
    const [exportMode, setExportMode] = useState<"all" | "selected" | "range">("all");
    const [exportStartDate, setExportStartDate] = useState("");
    const [exportEndDate, setExportEndDate] = useState("");

    // Helper functions for Export Data filtering
    const getExportMRData = () => {
        if (exportMode === "selected" && selectedMRs.length > 0) {
            return filteredData.filter(item => selectedMRs.includes(item.no_mr));
        }
        if (exportMode === "range" && exportStartDate && exportEndDate) {
            const start = new Date(exportStartDate);
            const end = new Date(exportEndDate);
            end.setHours(23, 59, 59, 999);
            
            return filteredData.filter(item => {
                if (!item.tanggal_mr) return false;
                const d = new Date(item.tanggal_mr);
                return d >= start && d <= end;
            });
        }
        return filteredData; // Default: All visible data
    };

    // Derived Lists for Filters
    const uniqueNoMR = Array.from(new Set(originalData.map(d => d.no_mr))).sort();
    const uniqueTanggalMR = Array.from(new Set(originalData.map(d => d.tanggal_mr).filter(d => d))).sort();

    // Set default date range to current month
    useEffect(() => {
        if (filterStartDate === null && filterEndDate === null) {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            setFilterStartDate(firstDay);
            setFilterEndDate(lastDay);
        }
    }, [filterStartDate, filterEndDate]);

    // Filter Logic
    useEffect(() => {
        let res = [...originalData];

        // 1. Global Search (No MR or Nama Barang)
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            res = res.filter(item => 
                (item.no_mr && item.no_mr.toLowerCase().includes(lower)) ||
                (item.nama_barang && item.nama_barang.toLowerCase().includes(lower))
            );
        }

        // 2. Filter No MR (Column)
        if (filterNoMR.length > 0) {
            res = res.filter(item => filterNoMR.includes(item.no_mr));
        }

        // 3. Filter Nama Barang (Column)
        if (filterNamaBarang) {
            const lower = filterNamaBarang.toLowerCase();
            res = res.filter(item => item.nama_barang && item.nama_barang.toLowerCase().includes(lower));
        }

        // 4. Filter Tanggal MR (Global Date Range)
        if (filterStartDate && filterEndDate) {
            res = res.filter(item => {
                if (!item.tanggal_mr) return false;
                const dateParts = item.tanggal_mr.split('T')[0].split('-');
                const itemDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
                
                const end = new Date(filterEndDate);
                end.setHours(23, 59, 59, 999);

                return itemDate >= filterStartDate && itemDate <= end;
            });
        }

        // 5. Filter Tanggal MR (Column Checkbox)
        if (filterTanggalMR.length > 0) {
            res = res.filter(item => filterTanggalMR.includes(item.tanggal_mr));
        }

        // 6. Filter by Schema (User Context)
        if (userSkemaId) {
             res = res.filter(item => {
                if (item.id_skema === null || item.id_skema === undefined) return false; 
                return String(item.id_skema) === String(userSkemaId);
             });
        }

        // 7. Filter by User Divisi (Strict)
        if (userDivisiId) {
            res = res.filter(item => String(item.id_divisi) === String(userDivisiId));
        }

        setFilteredData(res);
    }, [originalData, searchTerm, filterNoMR, filterNamaBarang, filterStartDate, filterEndDate, filterTanggalMR, userSkemaId, userDivisiId]);

    // Group items by No MR
    const groupedData = filteredData.reduce((acc, item) => {
        const key = item.no_mr || "UNKNOWN";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {} as Record<string, any[]>);

    const uniqueMRs = Array.from(new Set(filteredData.map(item => item.no_mr)));


    // Selection
    const toggleSelectAll = (checked: boolean) => {
        if (checked) setSelectedMRs(uniqueMRs);
        else setSelectedMRs([]);
    };

    const toggleSelectMR = (noMR: string, checked: boolean) => {
        if (checked) setSelectedMRs(prev => [...prev, noMR]);
        else setSelectedMRs(prev => prev.filter(id => id !== noMR));
    };

    // Export Excel
    const handleExportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Monitoring MR");

        const headers = [
            "NO. MR", "TANGGAL MR", 
            "NAMA BARANG", "QUANTITY", "SATUAN", "KETERANGAN",
            "HARGA SATUAN", "DISKON (%)", "DISKON (RP.)", "SUB", "PPN (%)", "PPN (RP.)", "TOTAL",
            "NAMA SUPPLIER", "TANGGAL PEMBELIAN", "DIVISI"
        ];

        // Header Styling
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFEEEEEE" },
            };
            cell.border = {
                top: { style: "thin" },
                right: { style: "thin" },
                bottom: { style: "thin" },
                left: { style: "thin" },
            };
        });

        let currentRow = 2;

        const dataToExport = getExportMRData();
        // Group by MR
        const exportGroupedData = dataToExport.reduce((acc, item) => {
            const key = item.no_mr || "UNKNOWN";
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {} as Record<string, any[]>);
        const exportUniqueMRs = Array.from(new Set(dataToExport.map((item: any) => item.no_mr)));

        exportUniqueMRs.forEach(noMR => {
            const items = exportGroupedData[noMR as string]; // Cast as string since map returns string
            if (!items) return;

            const startRow = currentRow;

            // Calculate Grand Total for this MR
            const totalMR = items.reduce((acc: number, curr: any) => acc + (Number(curr.total) || 0), 0);
            
            items.forEach((item: any, index: number) => {
                 const qty = Number(item.quantity) || 0;
                 const harga = Number(item.harga_satuan) || 0;
                 const diskonRp = Number(item.diskon_rp) || 0;
                 const sub = (qty * harga) - diskonRp;

                worksheet.addRow([
                    item.no_mr,
                    dayjs(item.tanggal_mr).format("DD/MM/YYYY"), // Force DD/MM/YYYY
                    item.nama_barang,
                    qty,
                    item.satuan,
                    item.keterangan,
                    harga,
                    item.diskon_persen,
                    diskonRp,
                    sub,
                    item.ppn_persen,
                    Number(item.ppn_rp) || 0,
                    index === 0 ? totalMR : "", 
                    item.nama_supplier,
                    item.tanggal_pembelian ? dayjs(item.tanggal_pembelian).format("DD/MM/YYYY") : "-", // Force DD/MM/YYYY
                    item.nama_divisi
                ]);
                
                // Formatting
                const r = worksheet.getRow(currentRow);
                r.getCell(4).numFmt = '#,##0'; // Qty
                r.getCell(7).numFmt = '"Rp" #,##0'; // Harga
                r.getCell(9).numFmt = '"Rp" #,##0'; // Diskon Rp
                r.getCell(10).numFmt = '"Rp" #,##0'; // Sub
                r.getCell(12).numFmt = '"Rp" #,##0'; // PPN Rp
                
                // Grand Total Formatting
                if (index === 0) {
                     r.getCell(13).numFmt = '"Rp" #,##0'; 
                }

                 currentRow++;
            });

             // Merge Cells Logic (Left: Col 1, 2; Right: Col 14, 15, 16; Middle: Col 13 Total MR)
            const endRow = currentRow - 1;
            const colsToMerge = [1, 2, 13, 14, 15, 16];

            if (endRow > startRow) {
                colsToMerge.forEach(col => {
                    worksheet.mergeCells(startRow, col, endRow, col);
                     // Center align merged cells
                    worksheet.getCell(startRow, col).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                });
            } else {
                 colsToMerge.forEach(col => {
                    worksheet.getCell(startRow, col).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                });
            }
        });

        // Auto Width Strategy
        for (let i = 1; i <= 16; i++) {
             const column = worksheet.getColumn(i);
             let maxLength = 0;

             // Header length
             const headerVal = worksheet.getRow(1).getCell(i).value;
             maxLength = headerVal ? String(headerVal).length : 0;

             // Data length
             worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                 const cell = row.getCell(i);
                 const val = cell.value;
                 if (val) {
                     // Approximate length for numbers/dates formatted might differ, 
                     // but string length is a good proxy.
                     const len = String(val).length;
                     if (len > maxLength) maxLength = len;
                 }
             });
             
             // Initial Buffer
             column.width = maxLength + 5; 
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Monitoring_MR_Divisi_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Header CSS Style to match PR Page
    const headerStyle: React.CSSProperties = {
        position: 'sticky', 
        top: 0, 
        zIndex: 10, 
        background: "#f3f4f6", // Light gray background
        boxShadow: "inset 0 -2px 0 #d1d5db",
        borderRight: "1px solid #d1d5db",
        verticalAlign: "middle"
    };

    return (
        <MainLayout>
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Monitoring Material Request (Divisi)</h1>
                        <p className="text-muted-foreground">Lihat dan kelola Material Request Anda</p>
                    </div>
                     {/* Export Popover */}
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="h-10 px-4 gap-2 border-dashed border-gray-400 hover:bg-gray-50 hover:border-gray-500" disabled={loading || uniqueMRs.length === 0}>
                                <Download className="h-4 w-4" />
                                <span className="font-medium">Export Excel</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4 z-[9999] bg-white" align="end">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                                        Export Data MR
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                        Pilih format dan filter data yang ingin diunduh.
                                    </p>
                                </div>

                                <Tabs defaultValue={exportMode} onValueChange={(v) => setExportMode(v as any)} className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="all" className="text-xs">Semua</TabsTrigger>
                                        <TabsTrigger value="selected" className="text-xs">Pilihan</TabsTrigger>
                                        <TabsTrigger value="range" className="text-xs">Tanggal</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="all" className="mt-4 space-y-2">
                                        <div className="p-3 bg-gray-50 rounded-md border text-center">
                                            <span className="text-xs text-muted-foreground block mb-1">Total Data</span>
                                            <span className="text-xl font-bold text-primary">{filteredData.length} Items</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground text-center">
                                            Mengunduh semua data yang tampil saat ini.
                                        </p>
                                    </TabsContent>

                                    <TabsContent value="selected" className="mt-4 space-y-2">
                                        <div className="p-3 bg-gray-50 rounded-md border text-center">
                                            <span className="text-xs text-muted-foreground block mb-1">Data Terpilih</span>
                                            <span className={`text-xl font-bold ${selectedMRs.length > 0 ? 'text-primary' : 'text-gray-400'}`}>
                                                {selectedMRs.length} MR
                                            </span>
                                        </div>
                                        {selectedMRs.length === 0 && (
                                            <p className="text-[10px] text-red-500 text-center">
                                                Pilih checkbox pada tabel terlebih dahulu.
                                            </p>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="range" className="mt-4 space-y-3">
                                        <div className="grid gap-2">
                                            <div className="grid gap-1">
                                                <Label className="text-xs">Tanggal Mulai</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="date"
                                                        value={exportStartDate}
                                                        onChange={(e) => setExportStartDate(e.target.value)}
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-1">
                                                <Label className="text-xs">Tanggal Akhir</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="date"
                                                        value={exportEndDate}
                                                        onChange={(e) => setExportEndDate(e.target.value)}
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>

                                <Button
                                    onClick={handleExportExcel}
                                    className="w-full h-9 bg-green-600 hover:bg-green-700 text-white gap-2"
                                    disabled={
                                        (exportMode === "selected" && selectedMRs.length === 0) ||
                                        (exportMode === "range" && (!exportStartDate || !exportEndDate))
                                    }
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Download .xlsx
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Search Bar & Global Date Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Input
                        placeholder="Cari No. MR atau Nama Barang..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-[320px]"
                    />
                     <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">Tanggal MR:</span>
                        <DatePicker
                            selected={filterStartDate}
                            onChange={(date) => setFilterStartDate(date)}
                            selectsStart
                            startDate={filterStartDate}
                            endDate={filterEndDate}
                            dateFormat="yyyy-MM-dd"
                            placeholderText="Mulai"
                            className="w-[110px] px-2 py-1 border rounded-md bg-white text-xs"
                            maxDate={filterEndDate || undefined}
                            isClearable
                        />
                        <span className="mx-1">-</span>
                        <DatePicker
                            selected={filterEndDate}
                            onChange={(date) => setFilterEndDate(date)}
                            selectsEnd
                            startDate={filterStartDate}
                            endDate={filterEndDate}
                            dateFormat="yyyy-MM-dd"
                            placeholderText="Selesai"
                            className="w-[110px] px-2 py-1 border rounded-md bg-white text-xs"
                            minDate={filterStartDate || undefined}
                            isClearable
                        />
                         <style jsx global>{`
                            .react-datepicker__day.datepicker-red {
                                color: #e53935 !important;
                                font-weight: bold;
                            }
                            .react-datepicker-popper {
                                position: absolute !important;
                                top: 0 !important;
                                left: 0 !important;
                                z-index: 9999 !important;
                            }
                        `}</style>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Material Request</CardTitle>
                        <CardDescription>
                            Total: {uniqueMRs.length} MR | Dipilih: {selectedMRs.length}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-4">
                         {/* Wrapper for overflow handling */}
                         <div 
                            ref={tableWrapperRef}
                            className="w-full overflow-x-auto overflow-y-auto border rounded-md"
                            style={{ maxHeight: "70vh" }}
                        >
                             <Table className="min-w-[2000px] border-collapse" style={{ tableLayout: 'fixed' }}>
                                <TableHeader>
                                    <TableRow className="h-10">
                                         {/* Sticky Checkbox (Most Left) */}
                                        <TableHead className="w-[50px] text-center border p-0 z-20" style={{ ...headerStyle, left: 0 }}>
                                            <div className="flex justify-center items-center h-full">
                                                <Checkbox
                                                    checked={uniqueMRs.length > 0 && selectedMRs.length === uniqueMRs.length}
                                                    onCheckedChange={toggleSelectAll}
                                                />
                                            </div>
                                        </TableHead>
                                        
                                        {/* No MR with Filter */}
                                        <TableHead className="w-[200px] text-center border p-0" style={headerStyle}>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" className="w-full h-full p-0 font-bold hover:bg-transparent uppercase rounded-none">
                                                        NO. MR <ChevronDown className="ml-1 h-3 w-3" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-64 p-2">
                                                    <Input 
                                                        placeholder="Cari No MR..." 
                                                        value={noMRSearchTerm} 
                                                        onChange={(e) => setNoMRSearchTerm(e.target.value)}
                                                        className="mb-2 h-8 text-xs"
                                                    />
                                                    <div className="max-h-48 overflow-y-auto space-y-1">
                                                        {uniqueNoMR.filter(no => no.toLowerCase().includes(noMRSearchTerm.toLowerCase())).map(no => (
                                                            <div key={no} className="flex items-center space-x-2">
                                                                <Checkbox 
                                                                    id={`mr-${no}`} 
                                                                    checked={filterNoMR.includes(no)}
                                                                    onCheckedChange={(c) => {
                                                                        if(c) setFilterNoMR([...filterNoMR, no]);
                                                                        else setFilterNoMR(filterNoMR.filter(x => x !== no));
                                                                    }}
                                                                />
                                                                <Label htmlFor={`mr-${no}`} className="text-xs font-normal cursor-pointer">{no}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </TableHead>

                                        {/* Tanggal MR with Filter */}
                                        <TableHead className="w-[120px] text-center border p-0" style={headerStyle}>
                                             <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" className="w-full h-full p-0 font-bold hover:bg-transparent uppercase rounded-none">
                                                        TANGGAL <ChevronDown className="ml-1 h-3 w-3" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-4 max-h-[300px] overflow-y-auto">
                                                    <Input 
                                                        placeholder="Cari Tanggal..." 
                                                        value={tanggalMRSearchTerm}
                                                        onChange={(e) => setTanggalMRSearchTerm(e.target.value)}
                                                        className="mb-2 h-8 text-xs"
                                                    />
                                                    <div className="space-y-1">
                                                        {uniqueTanggalMR.filter(t => formatDate(t).includes(tanggalMRSearchTerm)).map(date => (
                                                            <div key={date} className="flex items-center space-x-2">
                                                                <Checkbox 
                                                                    id={`date-${date}`}
                                                                    checked={filterTanggalMR.includes(date)}
                                                                    onCheckedChange={(c) => {
                                                                        if(c) setFilterTanggalMR([...filterTanggalMR, date]);
                                                                        else setFilterTanggalMR(filterTanggalMR.filter(d => d !== date));
                                                                    }}
                                                                />
                                                                <Label htmlFor={`date-${date}`} className="text-xs">{formatDate(date)}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </TableHead>

                                        {/* Items Columns (Middle) */}
                                        <TableHead className="w-[280px] text-center border p-0" style={headerStyle}>
                                             <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" className="w-full h-full p-0 font-bold hover:bg-transparent uppercase rounded-none">
                                                        NAMA BARANG <ChevronDown className="ml-1 h-3 w-3" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-64 p-2">
                                                    <Input 
                                                        placeholder="Filter Nama Barang..." 
                                                        value={filterNamaBarang} 
                                                        onChange={(e) => setFilterNamaBarang(e.target.value)}
                                                        className="h-8 text-xs"
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </TableHead>
                                        <TableHead className="w-[80px] text-center border font-bold uppercase" style={headerStyle}>QTY</TableHead>
                                        <TableHead className="w-[80px] text-center border font-bold uppercase" style={headerStyle}>SATUAN</TableHead>
                                        <TableHead className="w-[200px] text-center border font-bold uppercase" style={headerStyle}>KETERANGAN</TableHead>
                                        <TableHead className="w-[300px] text-center border font-bold uppercase" style={headerStyle}>SUPPLIER</TableHead>
                                        <TableHead className="w-[120px] text-center border font-bold uppercase" style={headerStyle}>TGL BELI</TableHead>
                                        <TableHead className="w-[120px] text-center border font-bold uppercase" style={headerStyle}>HARGA</TableHead>
                                        <TableHead className="w-[80px] text-center border font-bold uppercase" style={headerStyle}>DISC %</TableHead>
                                        <TableHead className="w-[100px] text-center border font-bold uppercase" style={headerStyle}>DISC RP</TableHead>
                                        <TableHead className="w-[120px] text-center border font-bold uppercase" style={headerStyle}>SUB</TableHead>
                                        <TableHead className="w-[80px] text-center border font-bold uppercase" style={headerStyle}>PPN %</TableHead>
                                        <TableHead className="w-[100px] text-center border font-bold uppercase" style={headerStyle}>PPN RP</TableHead>
                                        
                                        {/* Grand Total (Merged) */}
                                        <TableHead className="w-[150px] text-center border font-bold uppercase" style={headerStyle}>TOTAL MR</TableHead>

                                        {/* Right Merged Columns */}
                                        <TableHead className="w-[180px] px-4 text-center border font-bold uppercase" style={headerStyle}>DIVISI</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={16} className="h-24 text-center">Loading...</TableCell>
                                        </TableRow>
                                    ) : uniqueMRs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={16} className="h-24 text-center text-muted-foreground">Tidak ada data.</TableCell>
                                        </TableRow>
                                    ) : (
                                        uniqueMRs.map((noMR) => {
                                            const items = groupedData[noMR];
                                            if (!items) return null;

                                            return items.map((item: any, index: number) => {
                                                const qty = Number(item.quantity) || 0;
                                                const harga = Number(item.harga_satuan) || 0;
                                                const diskonRp = Number(item.diskon_rp) || 0;
                                                const sub = (qty * harga) - diskonRp;
                                                const isFirst = index === 0;

                                                return (
                                                    <TableRow key={index + "_" + item.id_mr_item} className="hover:bg-gray-50 even:bg-gray-50">
                                                        {/* Left Merged: Checkbox, No MR, Tanggal */}
                                                        {isFirst && (
                                                            <>
                                                                <TableCell rowSpan={items.length} className="text-center align-top border bg-white p-0" style={{ position: 'sticky', left: 0, zIndex: 9, verticalAlign: 'top' }}>
                                                                    <div className="flex justify-center pt-3">
                                                                         <Checkbox
                                                                            checked={selectedMRs.includes(noMR)}
                                                                            onCheckedChange={(c) => toggleSelectMR(noMR, !!c)}
                                                                        />
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell rowSpan={items.length} className="text-center align-top border bg-white font-medium p-2 align-middle" style={{ verticalAlign: 'top' }}>
                                                                    <div className="pt-2">{item.no_mr}</div>
                                                                </TableCell>
                                                                <TableCell rowSpan={items.length} className="text-center align-top border bg-white p-2 align-middle" style={{ verticalAlign: 'top' }}>
                                                                    <div className="pt-2">{formatDate(item.tanggal_mr)}</div>
                                                                </TableCell>
                                                            </>
                                                        )}

                                                        {/* Item Details */}
                                                        <TableCell className="border p-2">{item.nama_barang}</TableCell>
                                                        <TableCell className="text-center border p-2">{formatNumber(qty)}</TableCell>
                                                        <TableCell className="text-center border p-2">{item.satuan}</TableCell>
                                                        <TableCell className="border text-xs text-muted-foreground p-2">
                                                            <TruncatedText text={item.keterangan} />
                                                        </TableCell>
                                                        {isFirst ? (
                                                            <>
                                                                <TableCell rowSpan={items.length} className="text-center align-top border bg-white p-2 whitespace-nowrap overflow-hidden text-ellipsis" style={{ verticalAlign: 'top', maxWidth: '300px' }}>
                                                                    <div className="pt-2" title={item.nama_supplier}>{item.nama_supplier}</div>
                                                                </TableCell>
                                                                <TableCell rowSpan={items.length} className="text-center align-top border bg-white p-2" style={{ verticalAlign: 'top' }}>
                                                                    <div className="pt-2">{formatDate(item.tanggal_pembelian)}</div>
                                                                </TableCell>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {/* Empty cells to maintain grid alignment for spanned rows */}
                                                            </>
                                                        )}
                                                        <TableCell className="text-right border whitespace-nowrap p-2">{formatCurrency(harga)}</TableCell>
                                                        <TableCell className="text-center border p-2">{Number(item.diskon_persen) ? parseFloat(item.diskon_persen) + "%" : "-"}</TableCell>
                                                        <TableCell className="text-right border whitespace-nowrap p-2">{item.diskon_rp ? formatCurrency(item.diskon_rp) : "-"}</TableCell>
                                                        <TableCell className="text-right border whitespace-nowrap p-2">{formatCurrency(sub)}</TableCell>
                                                        <TableCell className="text-center border p-2">{Number(item.ppn_persen) ? parseFloat(item.ppn_persen) + "%" : "-"}</TableCell>
                                                        <TableCell className="text-right border whitespace-nowrap p-2">{item.ppn_rp ? formatCurrency(item.ppn_rp) : "-"}</TableCell>
                                                        
                                                        {/* Grand Total Column (Merged) */}
                                                        {isFirst && (
                                                            <TableCell rowSpan={items.length} className="text-center border bg-white p-2 align-middle" style={{ verticalAlign: 'middle' }}>
                                                                {formatCurrency(items.reduce((acc: number, curr: any) => acc + (Number(curr.total) || 0), 0))}
                                                            </TableCell>
                                                        )}

                                                         {/* Right Merged: Divisi */}
                                                         {isFirst && (
                                                            <TableCell rowSpan={items.length} className="text-center align-top border bg-white p-2" style={{ verticalAlign: 'top' }}>
                                                                <div className="pt-2">{item.nama_divisi}</div>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                );
                                            });
                                        })
                                    )}
                                </TableBody>
                            </Table>
                         </div>
                    </CardContent>
                </Card>
             </div>
        </MainLayout>
    );
}
