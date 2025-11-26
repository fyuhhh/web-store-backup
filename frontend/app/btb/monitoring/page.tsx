"use client";

import type React from "react";
import * as ExcelJS from "exceljs";
import { ChevronDown } from "lucide-react";
// Tambahkan import Trash2
import { Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

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
  return "Rp " + Math.round(Number(val)).toLocaleString("id-ID"); // <-- pastikan integer
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
    : Math.round(num).toString(); // <-- pastikan integer
}

function formatTanggalLebihSehari(tgl: string) {
  if (!tgl) return "-";
  let dateObj;
  if (/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
    dateObj = dayjs(tgl).add(1, "day");
  } else if (tgl.includes("T")) {
    dateObj = dayjs.utc(tgl).add(1, "day");
  } else {
    dateObj = dayjs(tgl).add(1, "day");
  }
  return dateObj.format("DD-MM-YYYY");
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

  // Tambah state untuk modal konfirmasi dan toast
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Tambah state/modal untuk restore item BTB
  const [restoreItemModalOpen, setRestoreItemModalOpen] = useState(false);
  const [selectedBTBItemsForRestore, setSelectedBTBItemsForRestore] = useState<{ btbId: string; items: any[] }[]>([]);
  const [selectedItemIdsToRestore, setSelectedItemIdsToRestore] = useState<string[]>([]);

  // Auto-close toast
  useEffect(() => {
    if (toastOpen) {
      const timer = setTimeout(() => setToastOpen(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastOpen]);

  // Komponen Modal dan Toast
  function ConfirmModal({
    open,
    title,
    description,
    onConfirm,
    onCancel,
  }: any) {
    if (!open) return null;
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px]">
          <h2 className="text-lg font-semibold mb-2">{title}</h2>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              Hapus
            </Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  function Toast({ open, message, onClose }: any) {
    if (!open) return null;
    return createPortal(
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white border border-gray-200 shadow-lg rounded px-4 py-2 flex items-center gap-2 animate-fade-in">
          <span className="text-green-600 font-medium">{message}</span>
          <Button size="sm" variant="ghost" onClick={onClose}>
            ×
          </Button>
        </div>
      </div>,
      document.body
    );
  }

  // Hapus BTB (multi/single) - hapus juga di backend
  const handleDelete = (ids: string[] | string) => {
    const idList = Array.isArray(ids) ? ids : [ids];
    // Ambil data item dari BTB yang dipilih
    const btbItems = btbRows
      .filter((row) => idList.includes(row.id))
      .map((row) => ({
        btbId: row.id_btb,
        items: [row],
      }));
    setSelectedBTBItemsForRestore(btbItems);
    setSelectedItemIdsToRestore([]);
    setRestoreItemModalOpen(true);
  };

  // --- Fungsi restore item BTB ke PO ---
  const confirmRestoreItems = async () => {
    setRestoreItemModalOpen(false);
    try {
      const poIdsToCheck = new Set<string>();
      for (const itemId of selectedItemIdsToRestore) {
        // Ambil data item BTB
        const btbItemRes = await fetch(`http://192.168.10.10:5000/api/btb-item/${itemId}`);
        if (!btbItemRes.ok) continue;
        const btbItem = await btbItemRes.json();
        // Hapus item BTB
        await fetch(`http://192.168.10.10:5000/api/btb-item/${itemId}`, { method: "DELETE" });
        // Update jumlahPO di po_item (tambah kembali jumlah_diterima)
        const poItemRes = await fetch(`http://192.168.10.10:5000/api/po-item/${btbItem.id_POItem}`);
        if (poItemRes.ok) {
          const poItem = await poItemRes.json();
          const newJumlahPO = Number(poItem.jumlahPO) + Number(btbItem.jumlah_diterima);
          // --- Hanya update jumlahPO, JANGAN kirim field lain ---
          await fetch(`http://192.168.10.10:5000/api/po-item/${btbItem.id_POItem}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jumlahPO: newJumlahPO
            }),
          });
          if (poItem.id_PO) poIdsToCheck.add(String(poItem.id_PO));
        }
      }
      // Hapus BTB parent jika semua item sudah dihapus
      for (const { btbId } of selectedBTBItemsForRestore) {
        const btbItemRes = await fetch(`http://192.168.10.10:5000/api/btb-item?id_btb=${btbId}`);
        if (btbItemRes.ok) {
          const items = await btbItemRes.json();
          if (!items || items.length === 0) {
            await fetch(`http://192.168.10.10:5000/api/btb/${btbId}`, { method: "DELETE" });
          }
        }
      }
      setToastMsg("Item BTB berhasil dikembalikan ke PO.");
      setToastOpen(true);
      // Refresh data
      window.location.reload();
    } catch (err) {
      setToastMsg("Gagal mengembalikan item BTB.");
      setToastOpen(true);
    }
    setSelectedItemIdsToRestore([]);
  };

  // Checkbox select all (per halaman)
  const handleSelectAll = (checked: boolean) => {
    const pageIds = filteredBTBData
      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      .map((row) => row.id);
    if (checked) {
      setSelectedBTBIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      setSelectedBTBIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    }
  };

  // Checkbox per baris
  const handleSelectBTB = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedBTBIds((prev) => [...prev, id]);
    } else {
      setSelectedBTBIds((prev) => prev.filter((x) => x !== id));
    }
  };

  // Ambil data dari backend
  useEffect(() => {
    async function fetchBTBData() {
      setLoading(true);
      try {
        // Ambil semua BTB, BTB Item, User, Skema, Satuan
        const [btbRes, btbItemRes, userRes, skemaRes, satuanRes] =
          await Promise.all([
            fetch("http://192.168.10.10:5000/api/btb"),
            fetch("http://192.168.10.10:5000/api/btb-item"),
            fetch("http://192.168.10.10:5000/api/user"),
            fetch("http://192.168.10.10:5000/api/skema"),
            fetch("http://192.168.10.10:5000/api/satuan"),
          ]);
        const btbList = await btbRes.json();
        const btbItemList = await btbItemRes.json();
        const userList = await userRes.json();
        // --- FIX: pastikan skemaList adalah array ---
        let skemaListRaw = await skemaRes.json();
        const skemaList = Array.isArray(skemaListRaw)
          ? skemaListRaw
          : Object.values(skemaListRaw);
        // -------------------------------------------
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
            id_btb: item.id_btb, // <-- tambahkan id_btb parent
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

    // Helper format tanggal persis seperti frontend (formatTanggalLebihSehari)
    function formatTanggalLebihSehari(tgl: string) {
      if (!tgl) return "-";
      let dateObj;
      if (/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
        dateObj = dayjs(tgl).add(1, "day");
      } else if (tgl.includes("T")) {
        dateObj = dayjs.utc(tgl).add(1, "day");
      } else {
        dateObj = dayjs(tgl).add(1, "day");
      }
      return dateObj.format("DD-MM-YYYY");
    }
    // Helper format quantity
    function formatQtyExcel(val: any) {
      const num = Number(val);
      if (Number.isNaN(num)) return "";
      return num % 1 === 0 ? num.toString() : num.toString();
    }
    // Helper format rupiah
    function formatRupiahExcel(val: any) {
      if (val === undefined || val === "" || isNaN(val)) return "";
      return "Rp " + Math.round(Number(val)).toLocaleString("id-ID"); // <-- pastikan integer
    }

    // Add data rows persis seperti tampilan tabel
    exportBTBData.forEach((btb) => {
      worksheet.addRow([
        btb.noBTB,
        formatTanggalLebihSehari(btb.tanggal), // <-- samakan dengan frontend
        btb.nama_supplier ?? btb.supplier ?? "",
        btb.nama_barang ?? "",
        formatQtyExcel(btb.jumlah),
        btb.satuan ?? "",
        formatQtyExcel(btb.sisa),
        formatRupiahExcel(btb.biaya),
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

  // Auto-logout logic (testing: 5 detik idle)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.removeItem("userData");
        window.location.href = "/login";
      }, 600000); // 5 detik idle
    };

    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, []);

  // --- Modal restore item BTB ---
  function RestoreItemModal({
    open,
    btbItems,
    selectedIds,
    setSelectedIds,
    onConfirm,
    onCancel,
  }: any) {
    if (!open) return null;
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
        <div className="bg-white rounded-lg shadow-lg p-6 min-w-[420px] max-h-[80vh] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-2">
            Pilih Item BTB yang akan dikembalikan ke PO
          </h2>
          <div className="space-y-4">
            {btbItems.map(({ btbId, items }) => {
              // Ambil noPO dari item pertama (jika ada)
              const noPO =
                items && items.length > 0 && items[0].noPO
                  ? items[0].noPO
                  : items && items.length > 0 && items[0].noBTB
                  ? items[0].noBTB
                  : "-";
              return (
                <div key={btbId}>
                  <div className="font-semibold mb-1">
                    BTB (No. PO): {noPO}
                  </div>
                  {items.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Tidak ada item pada BTB ini.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {items.map((item: any, idx: number) => {
                        const keyId = item.id ? String(item.id) : `${item.nama_barang}-${item.jumlah}-${idx}`;
                        const valueId = item.id ? String(item.id) : "";
                        return (
                          <label key={keyId} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value={valueId}
                              checked={selectedIds.includes(valueId)}
                              disabled={!valueId}
                              onChange={(e) => {
                                if (!valueId) return;
                                if (e.target.checked) {
                                  setSelectedIds([...selectedIds, valueId]);
                                } else {
                                  setSelectedIds(selectedIds.filter((x) => x !== valueId));
                                }
                              }}
                            />
                            <span>
                              {item.nama_barang} ({item.jumlah} {item.satuan})
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
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
              Kembalikan ke PO ({selectedIds.length})
            </Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Tambahkan definisi fungsi confirmDelete agar tidak error
  function confirmDelete() {
    setConfirmDeleteOpen(false);
    // ...tambahkan logika hapus jika diperlukan...
  }

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
          {/* Export section: align like Monitoring PR/PO */}
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
                  <Label className="text-xs font-medium">Tanggal</Label>
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
                  (exportMode === "selected" && selectedBTBIds.length === 0) ||
                  (exportMode === "range" &&
                    (!exportStartDate || !exportEndDate))
                }
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
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
            {exportMode === "selected" && selectedBTBIds.length > 0 && (
              <Button
                variant="destructive"
                className="mt-2"
                onClick={() => handleDelete(selectedBTBIds)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus BTB Terpilih ({selectedBTBIds.length})
              </Button>
            )}
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
                          onCheckedChange={handleSelectAll}
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
                            Quantity Awal BTB{" "}
                            <ChevronDown className="w-4 h-4" />
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
                    {/* Tambahkan kolom aksi */}
                    <TableHead className="text-left min-w-[80px]">
                      Aksi
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
                                onCheckedChange={(checked) =>
                                  handleSelectBTB(row.id, checked as boolean)
                                }
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
                            {formatTanggalLebihSehari(row.tanggal)}
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
                          {/* Kolom aksi */}
                          <TableCell className="px-4 py-2 text-left">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(row.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
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
        {/* Modal dan Toast */}
        <ConfirmModal
          open={confirmDeleteOpen}
          title="Konfirmasi Hapus BTB"
          description={`Apakah Anda yakin ingin menghapus ${deleteIds.length} BTB? Data yang dihapus tidak dapat dikembalikan.`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteOpen(false)}
        />
        <Toast
          open={toastOpen}
          message={toastMsg}
          onClose={() => setToastOpen(false)}
        />
        <RestoreItemModal
          open={restoreItemModalOpen}
          btbItems={selectedBTBItemsForRestore}
          selectedIds={selectedItemIdsToRestore}
          setSelectedIds={setSelectedItemIdsToRestore}
          onConfirm={confirmRestoreItems}
          onCancel={() => setRestoreItemModalOpen(false)}
        />
      </div>
    </MainLayout>
  );
}
