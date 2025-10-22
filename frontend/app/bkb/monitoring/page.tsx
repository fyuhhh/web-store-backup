"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import * as ExcelJS from "exceljs";
import { Checkbox } from "@/components/ui/checkbox";

// Helper format tanggal DD-MM-YYYY
function formatTanggal(tgl: string | null | undefined) {
  if (!tgl) return "-";
  const [date] = tgl.split("T");
  const [y, m, d] = date.split("-");
  if (!y || !m || !d) return tgl;
  return `${d}-${m}-${y}`;
}

export default function BKBMonitoringPage() {
  const [bkbRows, setBkbRows] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(false);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [skemaMap, setSkemaMap] = useState<Record<string, string>>({});
  const [satuanMap, setSatuanMap] = useState<Record<string, string>>({});
  const [btbMap, setBtbMap] = useState<Record<string, string>>({});
  const [userSkemaId, setUserSkemaId] = useState<string>(""); // Tambah state id_skema user

  // Tambahkan state untuk export
  const [exportMode, setExportMode] = useState<"all" | "selected" | "range">(
    "all"
  );
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [selectedBKBIds, setSelectedBKBIds] = useState<string[]>([]);

  // Fetch satuan list from backend and build mapping
  useEffect(() => {
    fetch("http://localhost:5000/api/satuan")
      .then((res) => res.json())
      .then((data) => {
        const map: Record<string, string> = {};
        data.forEach((s: any) => {
          map[String(s.id_satuan)] = s.satuan;
        });
        setSatuanMap(map);
      });
  }, []);

  // Ambil data dari backend
  useEffect(() => {
    async function fetchBKBData() {
      setLoading(true);
      try {
        // Ambil semua BKB, BKB Item, User, Skema, Satuan, BTB
        const [bkbRes, bkbItemRes, userRes, skemaRes, , btbRes] =
          await Promise.all([
            fetch("http://localhost:5000/api/bkb"),
            fetch("http://localhost:5000/api/bkb-item"),
            fetch("http://localhost:5000/api/user"),
            fetch("http://localhost:5000/api/skema"),
            fetch("http://localhost:5000/api/satuan"),
            fetch("http://localhost:5000/api/btb"),
          ]);
        const bkbList = await bkbRes.json();
        const bkbItemList = await bkbItemRes.json();
        const userList = await userRes.json();
        const skemaList = await skemaRes.json();
        // satuanList tidak perlu, sudah di-fetch di atas
        const btbList = await btbRes.json();

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

        // Buat mapping id_btb_item -> no_btb (asal BTB)
        const btbMapObj: Record<string, string> = {};
        btbList.forEach((btb: any) => {
          btbMapObj[String(btb.id_btb)] = btb.no_btb;
        });
        setBtbMap(btbMapObj);

        // Gabungkan: untuk setiap bkb_item, cari parent bkb dan label satuan
        const rows = bkbItemList.map((item: any) => {
          const bkb = bkbList.find((b: any) => b.id_bkb === item.id_bkb);
          return {
            id: item.id_bkb_item,
            noBKB: bkb?.no_bkb ?? "",
            tanggalBKB: bkb?.tanggal_bkb ?? "",
            namaBarang: item.nama_barang ?? "",
            quantity: item.jumlah_keluar ?? "",
            satuan: satuanMap[String(item.id_satuan)] ?? "", // tampilkan label satuan
            keterangan: item.keterangan ?? "",
            dikeluarkanOleh: bkb?.dikeluarkan_oleh ?? "",
            skema: bkb?.id_skema ?? "",
          };
        });
        setBkbRows(rows);
      } catch (err) {
        setBkbRows([]);
      }
      setLoading(false);
    }
    fetchBKBData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [satuanMap]); // refetch rows when satuanMap ready

  // Ambil id_skema user dari localStorage
  useEffect(() => {
    const userRaw = localStorage.getItem("userData");
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        setUserSkemaId(String(user.id_skema ?? user.skema ?? ""));
      } catch {}
    }
  }, []);

  // Filter data
  const filteredBKBData = bkbRows
    // Filter hanya BKB dengan id_skema sesuai user login
    .filter((row) => !userSkemaId || String(row.skema) === String(userSkemaId))
    .filter((row) => {
      const matchesSearch =
        row.noBKB.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.namaBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.keterangan.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

  // Data untuk export sesuai mode
  const getExportBKBData = () => {
    if (exportMode === "selected") {
      return filteredBKBData.filter((row) => selectedBKBIds.includes(row.id));
    }
    if (exportMode === "range" && exportStartDate && exportEndDate) {
      return filteredBKBData.filter(
        (row) =>
          row.tanggalBKB >= exportStartDate && row.tanggalBKB <= exportEndDate
      );
    }
    return filteredBKBData;
  };

  // Export Excel function
  const handleExport = async () => {
    const exportBKBData = getExportBKBData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monitoring BKB");

    // Header sesuai urutan tabel monitoring BKB
    const headers = [
      "No. BKB",
      "Tanggal BKB",
      "Nama Barang",
      "Quantity BKB",
      "Satuan",
      "Keterangan",
      "Dikeluarkan Oleh",
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

    // Add data rows persis seperti tampilan tabel
    exportBKBData.forEach((row) => {
      worksheet.addRow([
        row.noBKB,
        formatTanggalExcel(row.tanggalBKB),
        row.namaBarang,
        formatQtyExcel(row.quantity),
        row.satuan ?? "",
        row.keterangan ?? "",
        userMap[String(row.dikeluarkanOleh)] ?? row.dikeluarkanOleh ?? "",
        skemaMap[String(row.skema)] ?? row.skema ?? "",
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
    a.download = `monitoring-bkb-${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredBKBData.length / itemsPerPage);
  const paginatedData = filteredBKBData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Monitoring BKB (Bukti Keluar Barang)
            </h1>
            <p className="text-muted-foreground">
              Pantau pengeluaran barang dari BTB
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
                (exportMode === "selected" && selectedBKBIds.length === 0) ||
                (exportMode === "range" && (!exportStartDate || !exportEndDate))
              }
            >
              Export Excel
            </Button>
          </div>
        </div>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Daftar Bukti Keluar Barang</CardTitle>
            <CardDescription>
              Total: {filteredBKBData.length} BKB Item
              {filteredBKBData.length > 0 && (
                <>
                  {" | "}
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredBKBData.length)}
                  {" dari "}
                  {filteredBKBData.length} BKB Item
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
                          checked={paginatedData.every((row) =>
                            selectedBKBIds.includes(row.id)
                          )}
                          onCheckedChange={(checked) => {
                            const pageIds = paginatedData.map((row) => row.id);
                            if (checked) {
                              setSelectedBKBIds((prev) =>
                                Array.from(new Set([...prev, ...pageIds]))
                              );
                            } else {
                              setSelectedBKBIds((prev) =>
                                prev.filter((id) => !pageIds.includes(id))
                              );
                            }
                          }}
                        />
                      )}
                    </TableHead>
                    <TableHead>No. BKB</TableHead>
                    <TableHead>Tanggal BKB</TableHead>
                    <TableHead>Nama Barang</TableHead>
                    <TableHead>Quantity BKB</TableHead>
                    <TableHead>Satuan</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Dikeluarkan Oleh</TableHead>
                    <TableHead>Skema</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8}>Loading...</TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((row, idx) => (
                      <TableRow key={row.id}>
                        {/* Checkbox cell agar jumlah kolom selalu sama */}
                        {exportMode === "selected" ? (
                          <TableCell>
                            <Checkbox
                              checked={selectedBKBIds.includes(row.id)}
                              onCheckedChange={(checked) => {
                                setSelectedBKBIds((prev) =>
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
                        <TableCell>{row.noBKB}</TableCell>
                        <TableCell>{formatTanggal(row.tanggalBKB)}</TableCell>
                        <TableCell>{row.namaBarang}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              Number(row.quantity) > 0
                                ? "default"
                                : "destructive"
                            }
                          >
                            {row.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.satuan}</TableCell>
                        <TableCell>{row.keterangan}</TableCell>
                        <TableCell>
                          {userMap[String(row.dikeluarkanOleh)] ??
                            row.dikeluarkanOleh}
                        </TableCell>
                        <TableCell>
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
