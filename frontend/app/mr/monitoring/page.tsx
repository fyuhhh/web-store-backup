"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
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

export default function MonitoringMRPage() {
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

    // Schema Filter
    const [userSkemaId, setUserSkemaId] = useState<string | null>(null);

    // Selection


    const [userDivisiId, setUserDivisiId] = useState<string | null>(null);
    const [isDivisiUser, setIsDivisiUser] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);

    // Delete States
    const [deleteChoiceOpen, setDeleteChoiceOpen] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleteItemModalOpen, setDeleteItemModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null); // ID MR to delete
    const [deleteMode, setDeleteMode] = useState<"mr" | "item" | null>(null);
    const [selectedItemIdsToDelete, setSelectedItemIdsToDelete] = useState<string[]>([]);
    const [localMRItemsForDelete, setLocalMRItemsForDelete] = useState<any[]>([]); // New state for delete modal
    
    // Toast State (reuse or add if missing)
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMsg, setToastMsg] = useState("");
    const [toastType, setToastType] = useState<"success" | "error">("success");

    const tableWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        setUserSkemaId(userData.id_skema || userData.skema || null);
        setUserDivisiId(userData.id_divisi || null);
        // Check if user is Divisi (id_peran 2 or role 'divisi')
        if (Number(userData.id_peran) === 2 || (userData.role && userData.role.toLowerCase() === 'divisi')) {
            setIsDivisiUser(true);
        }
        
        const userId = Number(userData.id_user || userData.id || 0);
        if ([112, 113, 168, 169].includes(userId)) {
            setIsReadOnly(true);
        }
        
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
    const [exportMode, setExportMode] = useState<"all" | "range">("all");
    const [exportStartDate, setExportStartDate] = useState("");
    const [exportEndDate, setExportEndDate] = useState("");

    // Helper functions for Export Data filtering
    const getExportMRData = () => {
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

        // 6. Filter by Schema (User Context) - SKIP for Divisi User (they rely on id_divisi)
        if (userSkemaId && !isDivisiUser) {
             res = res.filter(item => {
                if (item.id_skema === null || item.id_skema === undefined) return false; 
                return String(item.id_skema) === String(userSkemaId);
             });
        }

        // 7. Filter by Division (for Divisi User)
        if (isDivisiUser && userDivisiId) {
            res = res.filter(item => {
               if (!item.id_divisi) return false;
               return String(item.id_divisi) === String(userDivisiId);
            });
       }

        setFilteredData(res);
    }, [originalData, searchTerm, filterNoMR, filterNamaBarang, filterStartDate, filterEndDate, filterTanggalMR, userSkemaId, userDivisiId, isDivisiUser]);

    // Group items by No MR
    const groupedData = filteredData.reduce((acc, item) => {
        const key = item.no_mr || "UNKNOWN";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {} as Record<string, any[]>);

    const uniqueMRs = Array.from(new Set(filteredData.map(item => item.no_mr)));


    // Selection


    // Export Excel
    const handleExportExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Monitoring MR");

        const headers = [
            "NO. MR", "TANGGAL MR", 
            "NAMA BARANG", "QUANTITY", "SATUAN", "SPESIFIKASI", "KETERANGAN",
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
                    item.spesifikasi || "-",
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
            const colsToMerge = [13, 14, 15, 16];

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
        a.download = `Monitoring_MR_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
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

    // Delete Handlers
    const handleDelete = (id_mr: string) => {
        console.log("handleDelete called with ID:", id_mr);
        if (!id_mr) {
            console.error("handleDelete received null/undefined ID!");
            return;
        }
        setDeleteId(id_mr);
        setDeleteChoiceOpen(true);
        setDeleteMode(null);
    };

    const handleDeleteChoice = (mode: "mr" | "item") => {
        setDeleteMode(mode);
        setDeleteChoiceOpen(false);
        if (mode === "mr") {
            setConfirmDeleteOpen(true);
        } else if (mode === "item") {
            // Prepare items in format similar to PR Monitoring: [{ mrId, items }]
            // groupedData is keyed by no_mr, but we need to find by id_mr (deleteId)
            let targetNoMR = "";
            let targetItems: any[] = [];
            
            // Find the MR data
            for (const [no, items] of Object.entries(groupedData)) {
                const typedItems = items as any[];
                if (typedItems[0]?.id_mr === deleteId) {
                    targetNoMR = no;
                    targetItems = typedItems;
                    break;
                }
            }

            // Set state for modal
            // We use 'selectedPRItemsForDelete' structure
            // New state needed: selectedMRItemsForDelete
            setLocalMRItemsForDelete([{ mrId: deleteId, noMR: targetNoMR, items: targetItems }]);
            setSelectedItemIdsToDelete([]);
            setDeleteItemModalOpen(true);
        }
    };

    const confirmDeleteMR = async () => {
        console.log("confirmDeleteMR called, deleteId:", deleteId);
        if (!deleteId) {
            console.error("No deleteId set!");
            return;
        }
        setConfirmDeleteOpen(false);
        try {
            const url = `${API_BASE_URL}/api/mr/${deleteId}`;
            console.log("Sending DELETE request to:", url);
            const res = await fetch(url, { method: "DELETE" });
            const json = await res.json();
            console.log("Delete response:", res.status, json);

            if (res.ok) {
                setToastMsg("MR berhasil dihapus");
                setToastType("success");
                setToastOpen(true);
                fetchData(); // Reload data
            } else {
                setToastMsg(json.message || "Gagal menghapus MR");
                setToastType("error");
                setToastOpen(true);
            }
        } catch (err) {
            console.error("Error in confirmDeleteMR:", err);
            setToastMsg("Terjadi kesalahan sistem: " + String(err));
            setToastType("error");
            setToastOpen(true);
        }
        setDeleteId(null);
    };

    const confirmDeleteItems = async () => {
        console.log("confirmDeleteItems called. selectedIds:", selectedItemIdsToDelete);
        setDeleteItemModalOpen(false);
        try {
            // Logic similar to PR Monitoring: Delete by ID
            const errors = [];
            for (const itemId of selectedItemIdsToDelete) {
               console.log("Deleting item ID:", itemId);
               const res = await fetch(`${API_BASE_URL}/api/mr/items/${itemId}`, { method: "DELETE" });
               if (!res.ok) {
                   const json = await res.json();
                   errors.push(`ID ${itemId}: ${json.message}`);
               }
            }
            
            if (errors.length > 0) {
                console.error("Errors deleting items:", errors);
                setToastMsg("Beberapa item gagal dihapus");
                setToastType("error");
            } else {
                setToastMsg("Item MR berhasil dihapus");
                setToastType("success");
            }
            setToastOpen(true);
            fetchData();
        } catch (err) {
             console.error("Error in confirmDeleteItems:", err);
             setToastMsg("Gagal menghapus item: " + String(err));
             setToastType("error");
             setToastOpen(true);
        }
        setDeleteId(null);
        setSelectedItemIdsToDelete([]);
    };

    const handleEdit = (mr: any) => {
        // Redirect to input page with ID
        window.location.href = `/mr/input?id=${mr.id_mr}`;
    };

    return (
        <MainLayout>
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Monitoring Material Request</h1>
                        <p className="text-muted-foreground">Lihat dan kelola Material Request yang sudah dibuat</p>
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
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="all" className="text-xs">Semua</TabsTrigger>
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

                <Card className="bg-white border-0 shadow-sm ring-1 ring-slate-200">
                    <CardHeader>
                        <CardTitle>Daftar Material Request</CardTitle>
                        <CardDescription>
                            Total: {uniqueMRs.length} MR
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

                                        
                                        {/* No MR with Filter */}
                                        <TableHead className="w-[200px] text-center border p-0 z-20" style={{ ...headerStyle, left: 0 }}>
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
                                        <TableHead className="w-[180px] text-center border font-bold uppercase" style={headerStyle}>SPESIFIKASI</TableHead>
                                        <TableHead className="w-[200px] text-center border font-bold uppercase" style={headerStyle}>KETERANGAN</TableHead>
                                        <TableHead className="w-[300px] text-center border font-bold uppercase" style={headerStyle}>SUPPLIER</TableHead>
                                        <TableHead className="w-[120px] text-center border font-bold uppercase" style={headerStyle}>TGL BELI</TableHead>
                                        <TableHead className="w-[120px] text-center border font-bold uppercase" style={headerStyle}>HARGA</TableHead>
                                        <TableHead className="w-[80px] text-center border p-0 font-bold uppercase" style={headerStyle}>DISC %</TableHead>
                                        <TableHead className="w-[100px] text-center border font-bold uppercase" style={headerStyle}>DISC RP</TableHead>
                                        <TableHead className="w-[120px] text-center border font-bold uppercase" style={headerStyle}>SUB</TableHead>
                                        <TableHead className="w-[80px] text-center border p-0 font-bold uppercase" style={headerStyle}>PPN %</TableHead>
                                        <TableHead className="w-[100px] text-center border font-bold uppercase" style={headerStyle}>PPN RP</TableHead>
                                        
                                        {/* Grand Total (Merged) */}
                                        <TableHead className="w-[150px] text-center border font-bold uppercase" style={headerStyle}>TOTAL MR</TableHead>

                                        {/* Right Merged Columns */}
                                        <TableHead className="w-[180px] px-4 text-center border font-bold uppercase" style={headerStyle}>DIVISI</TableHead>
                                        {/* AKSI Column */}
                                        {!isDivisiUser && !isReadOnly && (
                                            <TableHead className="w-[80px] text-center border font-bold uppercase" style={headerStyle}>AKSI</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={17} className="h-24 text-center">Loading...</TableCell>
                                        </TableRow>
                                    ) : uniqueMRs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={17} className="h-24 text-center text-muted-foreground">Tidak ada data.</TableCell>
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
                                                        {/* Left Merged: No MR, Tanggal */}
                                                        {isFirst && (
                                                            <>
                                                                <TableCell rowSpan={items.length} className="text-center align-top border bg-white font-medium p-2 align-middle" style={{ verticalAlign: 'top' }}>
                                                                    <div 
                                                                        className={`pt-2 ${!isDivisiUser ? "cursor-pointer hover:text-blue-600 hover:underline" : ""}`}
                                                                        onClick={() => !isDivisiUser && !isReadOnly && handleEdit(items[0])}
                                                                        title={(!isDivisiUser && !isReadOnly) ? "Klik untuk edit" : ""}
                                                                    >
                                                                        {item.no_mr}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell rowSpan={items.length} className="text-center align-top border bg-white p-2 align-middle" style={{ verticalAlign: 'top' }}>
                                                                    <div className="pt-2">{formatDate(item.tanggal_mr)}</div>
                                                                </TableCell>
                                                            </>
                                                        )}

                                                        {/* Item Details */}
                                                        <TableCell className="border p-2">
                                                            {item.id_mr_item ? item.nama_barang : <span className="text-gray-400 italic">No items</span>}
                                                        </TableCell>
                                                        <TableCell className="text-center border p-2">{formatNumber(qty)}</TableCell>
                                                        <TableCell className="text-center border p-2">{item.satuan}</TableCell>
                                                        <TableCell className="border text-xs text-muted-foreground p-2">
                                                            <TruncatedText text={item.spesifikasi} />
                                                        </TableCell>
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

                                                         {/* Right Merged: Divisi & Aksi */}
                                                         {isFirst && (
                                                            <>
                                                                <TableCell rowSpan={items.length} className="text-center align-top border bg-white p-2" style={{ verticalAlign: 'top' }}>
                                                                    <div className="pt-2">{item.nama_divisi}</div>
                                                                </TableCell>
                                                                {!isDivisiUser && !isReadOnly && (
                                                                    <TableCell className="border text-center align-middle" rowSpan={items.length}>
                                                                        <div className="flex flex-col gap-1 items-center">
                                                                            <Button 
                                                                                variant="outline" 
                                                                                size="sm" 
                                                                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                                                                onClick={() => handleEdit(item)}
                                                                            >
                                                                                <Download className="h-4 w-4 rotate-180" /> 
                                                                            </Button>
                                                                            <Button 
                                                                                variant="outline" 
                                                                                size="sm" 
                                                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                                                onClick={() => handleDelete(item.id_mr)}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </TableCell>
                                                                )}
                                                            </>
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
            {/* Modals */}
             <DeleteChoiceModal 
                open={deleteChoiceOpen} 
                onClose={() => setDeleteChoiceOpen(false)} 
                onChoose={handleDeleteChoice} 
            />
            <ConfirmModal
                open={confirmDeleteOpen} 
                title="Hapus MR" 
                description="Apakah anda yakin ingin menghapus MR ini? Tindakan ini tidak dapat dibatalkan."
                onConfirm={confirmDeleteMR}
                onCancel={() => setConfirmDeleteOpen(false)} 
            />
            <DeleteItemModal
                open={deleteItemModalOpen}
                mrItems={localMRItemsForDelete}
                selectedIds={selectedItemIdsToDelete}
                setSelectedIds={setSelectedItemIdsToDelete}
                onConfirm={confirmDeleteItems}
                onCancel={() => setDeleteItemModalOpen(false)}
            />
             <Toast 
                open={toastOpen} 
                onClose={() => setToastOpen(false)} 
                message={toastMsg} 
                type={toastType} 
            />
             </div>
        </MainLayout>
    );
}

function DeleteChoiceModal({ open, onClose, onChoose }: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  console.log("DeleteChoiceModal render:", { open, mounted });

  if (!open || !mounted) return null;
  
  const body = document.querySelector("body");
  if (!body) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px]">
        <h2 className="text-lg font-semibold mb-2">Pilih Jenis Hapus</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Anda ingin menghapus seluruh MR beserta semua item, atau hanya
          menghapus item tertentu dari MR yang dipilih?
        </p>
        <div className="flex flex-col gap-2">
          <Button variant="destructive" onClick={() => onChoose("mr")}>
            Hapus MR (Semua)
          </Button>
          <Button variant="outline" onClick={() => onChoose("item")}>
            Hapus Item pada MR
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
        </div>
      </div>
    </div>,
    body
  );
}

function ConfirmModal({ open, title, description, onConfirm, onCancel }: any) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!open || !mounted) return null;

    const body = document.querySelector("body");
    if (!body) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                <h2 className="text-lg font-bold mb-2">{title}</h2>
                <p className="mb-4 text-sm text-gray-600">{description}</p>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onCancel}>Batal</Button>
                    <Button variant="destructive" onClick={onConfirm}>Hapus</Button>
                </div>
            </div>
        </div>,
        body
    );
}

function DeleteItemModal({
  open,
  mrItems,
  selectedIds,
  setSelectedIds,
  onConfirm,
  onCancel,
}: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;

  const body = document.querySelector("body");
  if (!body) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[420px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">
          Pilih Item MR yang akan dihapus
        </h2>
        <div className="space-y-4">
          {mrItems.map(({ mrId, noMR, items }: any) => (
            <div key={mrId}>
              <div className="font-semibold mb-1">
                MR: {noMR || mrId}
              </div>
              {items.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Tidak ada item pada MR ini.
                </div>
              ) : (
                <div className="space-y-1">
                  {items.map((item: any, idx: number) => {
                    const valueId = String(item.id_mr_item);
                    return (
                      <label key={valueId} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={valueId}
                          checked={selectedIds.includes(valueId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds([...selectedIds, valueId]);
                            } else {
                              setSelectedIds(
                                selectedIds.filter((x: string) => x !== valueId)
                              );
                            }
                          }}
                        />
                        <span>
                          {item.nama_barang} ({item.quantity} {item.satuan})
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={selectedIds.length === 0}
          >
            Hapus Item Terpilih ({selectedIds.length})
          </Button>
        </div>
      </div>
    </div>,
    body
  );
}

function Toast({ open, onClose, message, type = "success" }: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
      setMounted(true);
      if (open) {
          const timer = setTimeout(onClose, 3000);
          return () => clearTimeout(timer);
      }
  }, [open, onClose]);

  if (!open || !mounted) return null;
  const body = document.querySelector("body");
  if (!body) return null;

  return createPortal(
    <div className={`fixed top-4 right-4 z-[9999] px-4 py-2 rounded shadow-lg text-white ${type === "error" ? "bg-red-600" : "bg-green-600"}`}>
      {message}
    </div>,
    body
  );
}
