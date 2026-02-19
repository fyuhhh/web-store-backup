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
import { Download, ChevronDown, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { API_BASE_URL } from "@/lib/config";
import * as ExcelJS from "exceljs";
import dayjs from "dayjs";

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

export default function MonitoringMRPage() {
    const [originalData, setOriginalData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters State
    const [filterNoMR, setFilterNoMR] = useState<string[]>([]);
    const [noMRSearchTerm, setNoMRSearchTerm] = useState("");

    const [filterNamaBarang, setFilterNamaBarang] = useState("");
    
    const [filterTanggalStart, setFilterTanggalStart] = useState("");
    const [filterTanggalEnd, setFilterTanggalEnd] = useState("");

    // Selection
    const [selectedMRs, setSelectedMRs] = useState<string[]>([]);

    const tableWrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
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

    // Derived Lists for Filters
    const uniqueNoMR = Array.from(new Set(originalData.map(d => d.no_mr))).sort();

    // Filter Logic
    useEffect(() => {
        let res = [...originalData];

        // 1. Filter No MR
        if (filterNoMR.length > 0) {
            res = res.filter(item => filterNoMR.includes(item.no_mr));
        }

        // 2. Filter Nama Barang
        if (filterNamaBarang) {
            const lower = filterNamaBarang.toLowerCase();
            res = res.filter(item => item.nama_barang && item.nama_barang.toLowerCase().includes(lower));
        }

        // 3. Filter Tanggal MR
        if (filterTanggalStart || filterTanggalEnd) {
            res = res.filter(item => {
                if (!item.tanggal_mr) return false;
                const d = dayjs(item.tanggal_mr);
                const start = filterTanggalStart ? dayjs(filterTanggalStart) : null;
                const end = filterTanggalEnd ? dayjs(filterTanggalEnd) : null;

                if (start && d.isBefore(start, 'day')) return false;
                if (end && d.isAfter(end, 'day')) return false;
                return true;
            });
        }

        setFilteredData(res);
    }, [originalData, filterNoMR, filterNamaBarang, filterTanggalStart, filterTanggalEnd]);

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

        uniqueMRs.forEach(noMR => {
            if (selectedMRs.length > 0 && !selectedMRs.includes(noMR)) return;
            const items = groupedData[noMR];
            if (!items) return;

            const startRow = currentRow;

            items.forEach((item) => {
                 const qty = Number(item.quantity) || 0;
                 const harga = Number(item.harga_satuan) || 0;
                 const diskonRp = Number(item.diskon_rp) || 0;
                 const sub = (qty * harga) - diskonRp;

                worksheet.addRow([
                    item.no_mr,
                    formatDate(item.tanggal_mr),
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
                    Number(item.total) || 0,
                    item.nama_supplier,
                    formatDate(item.tanggal_pembelian),
                    item.nama_divisi
                ]);
                
                // Formatting
                const r = worksheet.getRow(currentRow);
                r.getCell(4).numFmt = '#,##0'; // Qty
                r.getCell(7).numFmt = '"Rp" #,##0'; // Harga
                r.getCell(9).numFmt = '"Rp" #,##0'; // Diskon Rp
                r.getCell(10).numFmt = '"Rp" #,##0'; // Sub
                r.getCell(12).numFmt = '"Rp" #,##0'; // PPN Rp
                r.getCell(13).numFmt = '"Rp" #,##0'; // Total

                 currentRow++;
            });

             // Merge Cells Logic (Left: Col 1, 2; Right: Col 14, 15, 16)
            const endRow = currentRow - 1;
            if (endRow > startRow) {
                [1, 2, 14, 15, 16].forEach(col => {
                    worksheet.mergeCells(startRow, col, endRow, col);
                    // Center align merged cells
                    worksheet.getCell(startRow, col).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                });
            } else {
                 [1, 2, 14, 15, 16].forEach(col => {
                    worksheet.getCell(startRow, col).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                });
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Monitoring_MR_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <MainLayout>
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Monitoring Material Request</h1>
                        <p className="text-muted-foreground">Lihat dan kelola Material Request yang sudah dibuat</p>
                    </div>
                     <Button variant="outline" onClick={handleExportExcel} disabled={loading || uniqueMRs.length === 0}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Excel
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Material Request</CardTitle>
                        <CardDescription>
                            Total: {uniqueMRs.length} MR | Dipilih: {selectedMRs.length}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div 
                            ref={tableWrapperRef}
                            className="overflow-x-auto overflow-y-auto border rounded-md"
                            style={{ maxHeight: "70vh", scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                             <Table className="min-w-[1500px] border-collapse">
                                <TableHeader>
                                    <TableRow className="bg-gray-100 hover:bg-gray-100">
                                         {/* Sticky Checkbox */}
                                        <TableHead className="w-[50px] text-center border px-1" style={{ position: 'sticky', top: 0, zIndex: 20, background: '#f3f4f6', left: 0 }}>
                                            <Checkbox
                                                checked={uniqueMRs.length > 0 && selectedMRs.length === uniqueMRs.length}
                                                onCheckedChange={toggleSelectAll}
                                            />
                                        </TableHead>
                                        
                                        {/* No MR with Filter */}
                                        <TableHead className="min-w-[180px] border text-center" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f3f4f6' }}>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" className="h-auto p-0 font-bold hover:bg-transparent">
                                                        NO. MR <ChevronDown className="ml-1 h-4 w-4" />
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
                                        <TableHead className="min-w-[120px] border text-center" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f3f4f6' }}>
                                             <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" className="h-auto p-0 font-bold hover:bg-transparent">
                                                        TANGGAL <ChevronDown className="ml-1 h-4 w-4" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-4">
                                                    <div className="flex flex-col gap-2">
                                                        <Label className="text-xs">Dari</Label>
                                                        <Input type="date" className="h-8 text-xs" value={filterTanggalStart} onChange={e => setFilterTanggalStart(e.target.value)} />
                                                        <Label className="text-xs">Sampai</Label>
                                                        <Input type="date" className="h-8 text-xs" value={filterTanggalEnd} onChange={e => setFilterTanggalEnd(e.target.value)} />
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </TableHead>

                                        {/* Items Columns (Middle) */}
                                        <TableHead className="min-w-[250px] border text-center" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f3f4f6' }}>
                                             <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" className="h-auto p-0 font-bold hover:bg-transparent">
                                                        NAMA BARANG <ChevronDown className="ml-1 h-4 w-4" />
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
                                        <TableHead className="w-[80px] border text-center font-bold" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f3f4f6' }}>QTY</TableHead>
                                        <TableHead className="w-[80px] border text-center font-bold" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f3f4f6' }}>SATUAN</TableHead>
                                        <TableHead className="min-w-[150px] border text-center font-bold" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f3f4f6' }}>KETERANGAN</TableHead>
                                        <TableHead className="min-w-[120px] border text-center font-bold" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f3f4f6' }}>HARGA</TableHead>
                                        <TableHead className="w-[80px] border text-center font-bold" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f3f4f6' }}>DISC %</TableHead>
                                        <TableHead className="min-w-[100px] border text-center font-bold" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f3f4f6' }}>DISC RP</TableHead>
                                        <TableHead className="min-w-[120px] border text-center font-bold" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f3f4f6' }}>SUB</TableHead>
                                        <TableHead className="w-[80px] border text-center font-bold" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f3f4f6' }}>PPN %</TableHead>
                                        <TableHead className="min-w-[100px] border text-center font-bold" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f3f4f6' }}>PPN RP</TableHead>
                                        <TableHead className="min-w-[120px] border text-center font-bold" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f3f4f6' }}>TOTAL</TableHead>

                                        {/* Right Merged Columns */}
                                        <TableHead className="min-w-[150px] border text-center font-bold" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f3f4f6' }}>SUPPLIER</TableHead>
                                        <TableHead className="min-w-[100px] border text-center font-bold" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f3f4f6' }}>TGL BELI</TableHead>
                                        <TableHead className="min-w-[120px] border text-center font-bold" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f3f4f6' }}>DIVISI</TableHead>
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

                                            return items.map((item, index) => {
                                                const qty = Number(item.quantity) || 0;
                                                const harga = Number(item.harga_satuan) || 0;
                                                const diskonRp = Number(item.diskon_rp) || 0;
                                                const sub = (qty * harga) - diskonRp;
                                                const isFirst = index === 0;

                                                return (
                                                    <TableRow key={index + "_" + item.id_mr_item} className="hover:bg-slate-50">
                                                        {/* Left Merged: Checkbox, No MR, Tanggal */}
                                                        {isFirst && (
                                                            <>
                                                                <TableCell rowSpan={items.length} className="text-center align-top border bg-white p-0" style={{ position: 'sticky', left: 0, zIndex: 19 }}>
                                                                    <div className="flex justify-center pt-2">
                                                                         <Checkbox
                                                                            checked={selectedMRs.includes(noMR)}
                                                                            onCheckedChange={(c) => toggleSelectMR(noMR, !!c)}
                                                                        />
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell rowSpan={items.length} className="text-center align-top border bg-white font-medium align-middle">
                                                                    {item.no_mr}
                                                                </TableCell>
                                                                <TableCell rowSpan={items.length} className="text-center align-top border bg-white align-middle">
                                                                    {formatDate(item.tanggal_mr)}
                                                                </TableCell>
                                                            </>
                                                        )}

                                                        {/* Item Details */}
                                                        <TableCell className="border">{item.nama_barang}</TableCell>
                                                        <TableCell className="text-center border">{formatNumber(qty)}</TableCell>
                                                        <TableCell className="text-center border">{item.satuan}</TableCell>
                                                        <TableCell className="border text-xs text-muted-foreground">{item.keterangan}</TableCell>
                                                        <TableCell className="text-right border whitespace-nowrap">{formatCurrency(harga)}</TableCell>
                                                        <TableCell className="text-center border">{item.diskon_persen || "-"}</TableCell>
                                                        <TableCell className="text-right border whitespace-nowrap">{item.diskon_rp ? formatCurrency(item.diskon_rp) : "-"}</TableCell>
                                                        <TableCell className="text-right border whitespace-nowrap">{formatCurrency(sub)}</TableCell>
                                                        <TableCell className="text-center border">{item.ppn_persen || "-"}</TableCell>
                                                        <TableCell className="text-right border whitespace-nowrap">{item.ppn_rp ? formatCurrency(item.ppn_rp) : "-"}</TableCell>
                                                        <TableCell className="text-right border font-medium whitespace-nowrap">{formatCurrency(item.total)}</TableCell>

                                                         {/* Right Merged: Supplier, Tgl Beli, Divisi */}
                                                         {isFirst && (
                                                            <>
                                                                <TableCell rowSpan={items.length} className="text-center align-top border bg-white align-middle">
                                                                    {item.nama_supplier}
                                                                </TableCell>
                                                                <TableCell rowSpan={items.length} className="text-center align-top border bg-white align-middle">
                                                                    {formatDate(item.tanggal_pembelian)}
                                                                </TableCell>
                                                                <TableCell rowSpan={items.length} className="text-center align-top border bg-white align-middle">
                                                                    {item.nama_divisi}
                                                                </TableCell>
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
             </div>
        </MainLayout>
    );
}
