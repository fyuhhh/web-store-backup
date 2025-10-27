"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

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
function formatTanggal(tgl: string) {
  if (!tgl) return "";
  // Tambahkan 1 hari ke tanggal sebelum ditampilkan
  let dateObj;
  if (/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
    // Format "YYYY-MM-DD"
    dateObj = dayjs(tgl).add(1, "day");
  } else if (tgl.includes("T")) {
    // Format ISO
    dateObj = dayjs.utc(tgl).add(1, "day");
  } else {
    dateObj = dayjs(tgl).add(1, "day");
  }
  return dateObj.format("DD-MM-YYYY");
}

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
  const [skemaSearchTerm, setSkemaSearchTerm] = useState("");
  const [filterSkema, setFilterSkema] = useState<string[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [exportMode, setExportMode] = useState<"all" | "selected" | "range">(
    "all"
  );
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  // User schema state
  const [userSkema, setUserSkema] = useState<string>("");
  const [userSkemaId, setUserSkemaId] = useState<string>("");
  const [skemaMap, setSkemaMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch PO / related data from backend dan mapping seperti biasa
    const fetchAll = async () => {
      try {
        const [
          poRes,
          poItemRes,
          prItemRes,
          prRes,
          supRes,
          statusPermintaanRes,
          statusPengirimanRes,
          skemaRes,
          userRes, // <-- tambahkan fetch user
        ] = await Promise.all([
          fetch("http://192.168.10.10:5000/api/po"),
          fetch("http://192.168.10.10:5000/api/po-item"),
          fetch("http://192.168.10.10:5000/api/pr-item"),
          fetch("http://192.168.10.10:5000/api/pr"),
          fetch("http://192.168.10.10:5000/api/supplier"),
          fetch("http://192.168.10.10:5000/api/status-permintaan"),
          fetch("http://192.168.10.10:5000/api/status-pengiriman"),
          fetch("http://192.168.10.10:5000/api/skema"),
          fetch("http://192.168.10.10:5000/api/user"), // <-- fetch user
        ]);

        const [
          poList,
          poItemList,
          prItemList,
          prList,
          supplierList,
          statusPermintaanList,
          statusPengirimanList,
          skemaList,
          userList, // <-- userList
        ] = await Promise.all([
          poRes.json(),
          poItemRes.json(),
          prItemRes.json(),
          prRes.json(),
          supRes.json(),
          statusPermintaanRes.json(),
          statusPengirimanRes.json(),
          skemaRes.json(),
          userRes.json(), // <-- userList
        ]);

        // LOG: Data PO raw dari backend
        console.log("PO RAW dari backend:", poList);

        // Build helper maps
        const prMap = Object.fromEntries(
          prList.map((p: any) => [String(p.id_PR), p.noPR])
        );
        const prItemMap = Object.fromEntries(
          prItemList.map((pi: any) => [String(pi.id_PRItem), pi])
        );
        const supplierMap = Object.fromEntries(
          supplierList.map((s: any) => [String(s.id_supplier), s.namaSupplier])
        );
        const statusPermintaanMap = Object.fromEntries(
          statusPermintaanList.map((s: any) => [
            String(s.id_statusPermintaan),
            s.status_permintaan,
          ])
        );
        const statusPengirimanMap = Object.fromEntries(
          statusPengirimanList.map((s: any) => [
            String(s.id_statusPengiriman),
            s.status_pengiriman,
          ])
        );
        const skemaMapObj = Object.fromEntries(
          skemaList.map((s: any) => [String(s.id_skema), s.skema])
        );
        setSkemaMap(skemaMapObj);
        const userMap = Object.fromEntries(
          userList.map((u: any) => [String(u.id_user), u.nama_pengguna])
        );

        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const userSkemaVal = userData.skema || "";
        const userSkemaIdVal = String(
          userData.id_skema ?? userData.skema ?? ""
        );
        setUserSkema(userSkemaVal);
        setUserSkemaId(userSkemaIdVal);

        // Helper to normalize dates:
        const toISOFromPossibleDDMMYYYY = (val: any) => {
          if (!val) return "";
          if (typeof val !== "string") return String(val);
          const parts = val.split("-");
          if (parts.length === 3 && parts[0].length === 2) {
            // dd-mm-yyyy -> yyyy-mm-dd
            return `${parts[2]}-${parts[1].padStart(
              2,
              "0"
            )}-${parts[0].padStart(2, "0")}`;
          }
          return val;
        };

        // Map each PO
        const mappedPOs = (poList || []).map((po: any) => {
          // --- LOG: tipe dan isi tanggal dari backend ---
          console.log(
            `[MONITORING PO] typeof tanggalPO:`,
            typeof po.tanggalPO,
            "| value:",
            po.tanggalPO,
            "| typeof estimasiTanggalTerima:",
            typeof po.estimasiTanggalTerima,
            "| value:",
            po.estimasiTanggalTerima
          );
          // --- LOG: tanggal raw dari backend ---
          console.log(
            `[MONITORING PO] Tanggal PO raw:`,
            po.tanggalPO,
            "| Estimasi Diterima raw:",
            po.estimasiTanggalTerima
          );
          // --- LOG: tanggal yang akan ditampilkan di frontend ---
          console.log(
            `[MONITORING PO] Tanggal PO tampil:`,
            formatTanggal(po.tanggalPO),
            "| Estimasi Diterima tampil:",
            formatTanggal(po.estimasiTanggalTerima)
          );

          // ISO for range filtering
          const prMap = Object.fromEntries(
            prList.map((p: any) => [String(p.id_PR), p.noPR])
          );
          const prItemMap = Object.fromEntries(
            prItemList.map((pi: any) => [String(pi.id_PRItem), pi])
          );
          const supplierMap = Object.fromEntries(
            supplierList.map((s: any) => [
              String(s.id_supplier),
              s.namaSupplier,
            ])
          );
          const statusPermintaanMap = Object.fromEntries(
            statusPermintaanList.map((s: any) => [
              String(s.id_statusPermintaan),
              s.status_permintaan,
            ])
          );
          const statusPengirimanMap = Object.fromEntries(
            statusPengirimanList.map((s: any) => [
              String(s.id_statusPengiriman),
              s.status_pengiriman,
            ])
          );
          const skemaMap = Object.fromEntries(
            skemaList.map((s: any) => [String(s.id_skema), s.skema])
          );

          // Group items by PR (noPR)
          const itemsForPO = (poItemList || []).filter(
            (pi: any) => String(pi.id_PO) === String(po.id_PO || po.id)
          );
          const poItemsGrouped: any[] = [];
          const groupMap: Record<string, number> = {};

          itemsForPO.forEach((pi: any) => {
            const prItem = prItemMap[String(pi.id_PRItem)] || {};
            const prId = String(prItem.id_PR || prItem.id_pr || pi.id_PR || "");
            const noPR = prMap[prId] || prItem.noPR || prItem.id_PR || "";
            const item = {
              id: prItem.id_PRItem ?? prItem.id ?? pi.id_PRItem ?? null,
              namaBarang: prItem.namaBarang ?? prItem.namabarang ?? "",
              jumlahPO: Number(pi.jumlahPO) || Number(pi.jumlah) || 0,
              jumlahAsli: Number(pi.jumlahAsli) || Number(pi.jumlah) || 0,
              satuan:
                prItem.satuanLabel || prItem.satuan || prItem.id_satuan || "",
              hargaSatuan: Number(pi.hargaSatuan) || 0,
              keterangan: pi.keterangan || prItem.keterangan || "",
            };
            const key = String(noPR || prId || "__noPR__");
            if (groupMap[key] === undefined) {
              groupMap[key] = poItemsGrouped.length;
              poItemsGrouped.push({
                prId: prId || "",
                noPR: key,
                items: [item],
              });
            } else {
              poItemsGrouped[groupMap[key]].items.push(item);
            }
          });

          // Build labels using maps (prefer label maps, fallback to existing fields)
          const statusPermintaanLabel =
            statusPermintaanMap[String(po.id_statusPermintaan)] ||
            po.statusPermintaan ||
            String(po.id_statusPermintaan || "");
          const statusPengirimanLabel =
            statusPengirimanMap[String(po.id_statusPengiriman)] ||
            po.statusPengiriman ||
            String(po.id_statusPengiriman || "");

          // Ambil nama user dari userMap berdasarkan orderedBy (id_user)
          const orderedByName =
            userMap[String(po.orderedBy)] ||
            po.orderedBy ||
            po.dipesanOleh ||
            "";

          return {
            id: po.id_PO ?? po.id,
            noPO: po.noPO ?? "",
            tanggalPO: formatTanggal(po.tanggalPO), // gunakan dayjs lokal
            estimasiTanggalTerima: formatTanggal(po.estimasiTanggalTerima), // gunakan dayjs lokal
            supplier:
              supplierMap[String(po.id_supplier)] ||
              po.supplier ||
              String(po.id_supplier || ""),
            poItems: poItemsGrouped,
            totalPembayaran: Number(po.totalPembayaran) || 0,
            statusPermintaan: statusPermintaanLabel,
            statusPengiriman: statusPengirimanLabel,
            status: po.status ?? "Menunggu",
            orderedBy: orderedByName, // <-- tampilkan nama user
            skema: po.id_skema ?? "", // <-- simpan id_skema, bukan label
            rawSkemaId: po.id_skema ?? null, // <-- id_skema untuk filter
          };
        });

        // Filter by user skema (id_skema, bukan label)
        const validated = mappedPOs.filter(
          (p: any) =>
            !userSkemaVal || String(p.rawSkemaId) === String(userSkemaVal)
        );
        // LOG: Data PO hasil mapping sebelum ditampilkan
        console.log("PO hasil mapping (frontend):", validated);

        setPoData(validated);
      } catch (err) {
        console.error("Gagal memuat data PO:", err);
        setPoData([]); // fallback
      }
    };

    fetchAll();
  }, []);

  const handleEdit = (po: POData) => {
    // Redirect to input page for editing
    window.location.href = "/po/input";
  };

  // --- Tambah state untuk modal konfirmasi dan toast ---
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // --- Add auto-close for toast ---
  useEffect(() => {
    if (toastOpen) {
      const timer = setTimeout(() => setToastOpen(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastOpen]);

  // --- Komponen Modal dan Toast ---
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

  // --- Perbaiki handleDelete agar bisa multi dan pakai modal ---
  const handleDelete = async (ids: string[] | string) => {
    const idList = Array.isArray(ids) ? ids : [ids];
    setDeleteIds(idList);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    setConfirmDeleteOpen(false);
    try {
      for (const id of deleteIds) {
        await fetch(`http://192.168.10.10:5000/api/po/${id}`, { method: "DELETE" });
      }
      setPoData((prev) => prev.filter((po) => !deleteIds.includes(po.id)));
      setSelectedPOs((prev) => prev.filter((id) => !deleteIds.includes(id)));
      setToastMsg("PO berhasil dihapus.");
      setToastOpen(true);
    } catch (error) {
      setToastMsg("Terjadi kesalahan saat menghapus PO.");
      setToastOpen(true);
    }
    setDeleteIds([]);
  };

  // --- Perbaiki handleSelectAll agar hanya memilih PO yang sedang dipaging ---
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPOs(paginatedData.map((po) => po.id));
    } else {
      setSelectedPOs([]);
    }
  };

  // Filter data
  const filteredPOData = poData
    // Filter hanya PO dengan id_skema sesuai user login
    .filter((po) => !userSkemaId || String(po.skema) === String(userSkemaId))
    .map((po) => {
      let status = po.status || "Menunggu";
      return { ...po, status };
    })
    .filter(
      (po) => {
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
          (filterTotalMax === "" ||
            po.totalPembayaran <= Number(filterTotalMax));

        const matchesTanggalPO =
          filterTanggalPO.length === 0 ||
          filterTanggalPO.includes(po.tanggalPO);

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
      }
      // Pada filter data PO, hapus filter yang menghilangkan item dengan jumlahPO = 0
      // Ganti bagian ini:
      // .filter((po) =>
      //   po.poItems.some((poItem) =>
      //     poItem.items.some((item) => item.jumlahPO > 0)
      //   )
      // );
      // Menjadi:
      // ...jangan filter berdasarkan jumlahPO...
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
        po.poItems.flatMap((poItem) =>
          poItem.items.map((item) => String(item.satuan ?? ""))
        )
      )
    )
  )
    .filter((s) => s.trim() !== "")
    .sort();

  const uniqueSuppliers = Array.from(
    new Set(poData.map((po) => String(po.supplier ?? "")))
  )
    .filter((s) => s.trim() !== "")
    .sort();
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
    new Set(poData.map((po) => String(po.tanggalPO ?? "")))
  )
    .filter((t) => t.trim() !== "")
    .sort();
  const uniqueEstimasiDiterima = Array.from(
    new Set(poData.map((po) => String(po.estimasiTanggalDiterima ?? "")))
  )
    .filter((t) => t.trim() !== "")
    .sort();
  const uniqueKode = Array.from(
    new Set(poData.map((po) => String(po.statusPermintaan ?? "")))
  )
    .filter((k) => k.trim() !== "")
    .sort() as string[];
  const uniqueStatusPengiriman = Array.from(
    new Set(poData.map((po) => String(po.statusPengiriman ?? "")))
  )
    .filter((s) => s.trim() !== "")
    .sort() as string[];
  const uniqueDiorderOleh = Array.from(
    new Set(poData.map((po) => String(po.orderedBy ?? "")))
  )
    .filter((o) => o.trim() !== "")
    .sort();

  // Data untuk export sesuai mode
  const getExportPOData = () => {
    if (exportMode === "selected") {
      return filteredPOData.filter((po) => selectedPOs.includes(po.id));
    }
    if (exportMode === "range" && exportStartDate && exportEndDate) {
      // Use normalized ISO date for comparisons if available
      return filteredPOData.filter((po) => {
        const d = po.tanggalPOISO || po.tanggalPO || "";
        return d >= exportStartDate && d <= exportEndDate;
      });
    }
    return filteredPOData;
  };

  const handleExport = async () => {
    const exportPOData = getExportPOData();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monitoring PO");

    // Header sesuai urutan tabel monitoring PO (update: tambah Quantity Awal PO setelah Quantity PO)
    const headers = [
      "No. PO",
      "Daftar Barang",
      "Quantity PO",
      "Quantity Awal PO",
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
      "Skema",
    ];

    // Add header row with bold font
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "left", vertical: "middle" };
    });

    // Helper: format tanggal persis seperti frontend (tambah 1 hari, fallback jika gagal)
    function formatTanggalExcel(tgl: string) {
      if (!tgl) return "";
      let dateObj;
      if (/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
        dateObj = dayjs(tgl).add(1, "day");
      } else if (tgl.includes("T")) {
        dateObj = dayjs.utc(tgl).add(1, "day");
      } else {
        dateObj = dayjs(tgl).add(1, "day");
      }
      // Jika dateObj valid, return string, jika tidak, return tgl asli
      return dateObj.isValid() ? dateObj.format("DD-MM-YYYY") : tgl ?? "";
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

    // Prepare and add data rows persis seperti tampilan tabel
    exportPOData.forEach((po) => {
      // Flatten all items from all poItems
      const allItems = po.poItems.flatMap((poItem) =>
        poItem.items.map((item) => ({
          ...item,
          noPR: poItem.noPR,
        }))
      );

      if (allItems.length === 0) return;

      allItems.forEach((item, index) => {
        worksheet.addRow([
          index === 0 ? po.noPO : "",
          item.namaBarang,
          formatQtyExcel(item.jumlahPO),
          formatQtyExcel(item.jumlahAsli),
          item.satuan,
          item.keterangan || "",
          formatRupiah(item.hargaSatuan),
          formatRupiah(item.hargaSatuan * item.jumlahPO),
          index === 0 ? formatTanggalExcel(po.tanggalPO) : "",
          index === 0 ? formatTanggalExcel(po.estimasiTanggalTerima) : "",
          index === 0 ? po.supplier : "",
          index === 0 ? formatRupiah(po.totalPembayaran) : "",
          index === 0 ? po.statusPermintaan ?? "" : "",
          index === 0 ? po.statusPengiriman ?? "" : "",
          index === 0 ? po.status ?? "" : "",
          index === 0 ? po.orderedBy ?? "" : "",
          index === 0 ? skemaMap[String(po.skema)] ?? po.skema ?? "" : "",
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

  const handleSelectPO = (poId: string, checked: boolean) => {
    if (checked) {
      setSelectedPOs((prev) => [...prev, poId]);
    } else {
      setSelectedPOs((prev) => prev.filter((id) => id !== poId));
    }
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
            {selectedPOs.length > 0 && (
              <Button
                variant="destructive"
                className="mt-2"
                onClick={() => handleDelete(selectedPOs)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus PO Terpilih ({selectedPOs.length})
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto min-w-[1400px]">
              <Table className="min-w-[1400px] border border-gray-300">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">
                      {/* Checkbox Select All */}
                      <Checkbox
                        checked={
                          selectedPOs.length === paginatedData.length &&
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
                    <TableHead className="min-w-[140px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            No. PO <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari No. PO..."
                            value={kodeSearchTerm}
                            onChange={(e) => setKodeSearchTerm(e.target.value)}
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueKode
                              .filter((k) =>
                                k
                                  .toLowerCase()
                                  .includes(kodeSearchTerm.toLowerCase())
                              )
                              .map((k) => (
                                <div
                                  key={k}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    checked={filterKode.includes(k)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterKode([...filterKode, k]);
                                      else
                                        setFilterKode(
                                          filterKode.filter((x) => x !== k)
                                        );
                                    }}
                                  />
                                  <Label className="text-sm">{k}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[180px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Daftar Barang <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari barang..."
                            value={filterNamaBarang}
                            onChange={(e) =>
                              setFilterNamaBarang(e.target.value)
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[90px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Quantity PO <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
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
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    {/* Tambahkan kolom Quantity Awal PO */}
                    <TableHead className="min-w-[90px]">
                      Quantity Awal PO
                    </TableHead>
                    <TableHead className="min-w-[90px]">
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
                                  <Label className="text-sm">{s}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[160px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Keterangan <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari keterangan..."
                            value={filterKeterangan}
                            onChange={(e) =>
                              setFilterKeterangan(e.target.value)
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[120px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Harga Satuan <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Min Harga"
                            type="number"
                            value={filterHargaSatuanMin}
                            onChange={(e) =>
                              setFilterHargaSatuanMin(
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                          />
                          <Input
                            placeholder="Max Harga"
                            type="number"
                            value={filterHargaSatuanMax}
                            onChange={(e) =>
                              setFilterHargaSatuanMax(
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[120px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Total <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Min Total"
                            type="number"
                            value={filterTotalMin}
                            onChange={(e) =>
                              setFilterTotalMin(
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                          />
                          <Input
                            placeholder="Max Total"
                            type="number"
                            value={filterTotalMax}
                            onChange={(e) =>
                              setFilterTotalMax(
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[120px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Tanggal PO <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari tanggal..."
                            value={tanggalPOSearchTerm}
                            onChange={(e) =>
                              setTanggalPOSearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueTanggalPO
                              .filter((tgl) =>
                                tgl
                                  .toLowerCase()
                                  .includes(tanggalPOSearchTerm.toLowerCase())
                              )
                              .map((tgl) => (
                                <div
                                  key={tgl}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    checked={filterTanggalPO.includes(tgl)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterTanggalPO([
                                          ...filterTanggalPO,
                                          tgl,
                                        ]);
                                      else
                                        setFilterTanggalPO(
                                          filterTanggalPO.filter(
                                            (x) => x !== tgl
                                          )
                                        );
                                    }}
                                  />
                                  <Label className="text-sm">{tgl}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[140px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Estimasi Diterima{" "}
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari estimasi..."
                            value={estimasiDiterimaSearchTerm}
                            onChange={(e) =>
                              setEstimasiDiterimaSearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueEstimasiDiterima
                              .filter((tgl) =>
                                tgl
                                  .toLowerCase()
                                  .includes(
                                    estimasiDiterimaSearchTerm.toLowerCase()
                                  )
                              )
                              .map((tgl) => (
                                <div
                                  key={tgl}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    checked={filterEstimasiDiterima.includes(
                                      tgl
                                    )}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterEstimasiDiterima([
                                          ...filterEstimasiDiterima,
                                          tgl,
                                        ]);
                                      else
                                        setFilterEstimasiDiterima(
                                          filterEstimasiDiterima.filter(
                                            (x) => x !== tgl
                                          )
                                        );
                                    }}
                                  />
                                  <Label className="text-sm">{tgl}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[140px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Supplier <ChevronDown className="w-4 h-4" />
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
                                  <Label className="text-sm">{s}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[100px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Kode <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari kode..."
                            value={kodeSearchTerm}
                            onChange={(e) => setKodeSearchTerm(e.target.value)}
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueKode
                              .filter((k) =>
                                k
                                  .toLowerCase()
                                  .includes(kodeSearchTerm.toLowerCase())
                              )
                              .map((k) => (
                                <div
                                  key={k}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    checked={filterKode.includes(k)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterKode([...filterKode, k]);
                                      else
                                        setFilterKode(
                                          filterKode.filter((x) => x !== k)
                                        );
                                    }}
                                  />
                                  <Label className="text-sm">{k}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[140px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Status Pengiriman{" "}
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari status pengiriman..."
                            value={statusPengirimanSearchTerm}
                            onChange={(e) =>
                              setStatusPengirimanSearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueStatusPengiriman
                              .filter((s) =>
                                s
                                  .toLowerCase()
                                  .includes(
                                    statusPengirimanSearchTerm.toLowerCase()
                                  )
                              )
                              .map((s) => (
                                <div
                                  key={s}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    checked={filterStatusPengiriman.includes(s)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterStatusPengiriman([
                                          ...filterStatusPengiriman,
                                          s,
                                        ]);
                                      else
                                        setFilterStatusPengiriman(
                                          filterStatusPengiriman.filter(
                                            (x) => x !== s
                                          )
                                        );
                                    }}
                                  />
                                  <Label className="text-sm">{s}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[100px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Status <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari status..."
                            value={statusSearchTerm}
                            onChange={(e) =>
                              setStatusSearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueStatus
                              .filter((s) =>
                                s
                                  .toLowerCase()
                                  .includes(statusSearchTerm.toLowerCase())
                              )
                              .map((s) => (
                                <div
                                  key={s}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    checked={filterStatus.includes(s)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterStatus([...filterStatus, s]);
                                      else
                                        setFilterStatus(
                                          filterStatus.filter((x) => x !== s)
                                        );
                                    }}
                                  />
                                  <Label className="text-sm">{s}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[100px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Diorder oleh <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari user..."
                            value={diorderOlehSearchTerm}
                            onChange={(e) =>
                              setDiorderOlehSearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueDiorderOleh
                              .filter((o) =>
                                o
                                  .toLowerCase()
                                  .includes(diorderOlehSearchTerm.toLowerCase())
                              )
                              .map((o) => (
                                <div
                                  key={o}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    checked={filterDiorderOleh.includes(o)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterDiorderOleh([
                                          ...filterDiorderOleh,
                                          o,
                                        ]);
                                      else
                                        setFilterDiorderOleh(
                                          filterDiorderOleh.filter(
                                            (x) => x !== o
                                          )
                                        );
                                    }}
                                  />
                                  <Label className="text-sm">{o}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[100px]">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Skema <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari skema..."
                            value={skemaSearchTerm}
                            onChange={(e) => setSkemaSearchTerm(e.target.value)}
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueKode
                              .filter((s) =>
                                String(s)
                                  .toLowerCase()
                                  .includes(skemaSearchTerm.toLowerCase())
                              )
                              .map((s) => (
                                <div
                                  key={s}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    checked={filterSkema.includes(s)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterSkema([...filterSkema, s]);
                                      else
                                        setFilterSkema(
                                          filterSkema.filter((x) => x !== s)
                                        );
                                    }}
                                  />
                                  <Label className="text-sm">{s}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="min-w-[120px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((po) => {
                    // Flatten all items from all poItems ~ REMOVE jumlahPO > 0 filter
                    const allItems = po.poItems.flatMap((poItem) =>
                      poItem.items.map((item) => ({
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
                            {itemIndex === 0 ? (
                              <>
                                <TableCell
                                  key="checkbox"
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
                                  key="noPO"
                                  className="font-medium px-4 py-2 border-r border-gray-300 align-middle"
                                  rowSpan={allItems.length}
                                >
                                  {po.noPO}
                                </TableCell>
                              </>
                            ) : null}
                            <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[200px]">
                              {item.namaBarang}
                            </TableCell>
                            <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[80px]">
                              {item.jumlahPO}
                            </TableCell>
                            {/* Tambahkan cell Quantity Awal PO */}
                            <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[80px]">
                              {item.jumlahAsli ?? ""}
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
                            {itemIndex === 0 ? (
                              <>
                                <TableCell
                                  key="totalPembayaran"
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[120px]"
                                >
                                  Rp{" "}
                                  {po.totalPembayaran.toLocaleString("id-ID")}
                                </TableCell>
                                <TableCell
                                  key="tanggalPO"
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[120px]"
                                >
                                  {po.tanggalPO}{" "}
                                </TableCell>
                                <TableCell
                                  key="estimasiTanggalDiterima"
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[140px]"
                                >
                                  {po.estimasiTanggalTerima}{" "}
                                  {/* Use exact field name from backend */}
                                </TableCell>
                                <TableCell
                                  key="supplier"
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[140px]"
                                >
                                  {po.supplier}
                                </TableCell>
                                <TableCell
                                  key="statusPermintaan"
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[100px]"
                                >
                                  {po.statusPermintaan ?? ""}
                                </TableCell>
                                <TableCell
                                  key="statusPengiriman"
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[140px]"
                                >
                                  {po.statusPengiriman ?? ""}
                                </TableCell>
                                <TableCell
                                  key="statusBadge"
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[100px]"
                                >
                                  {getStatusBadge(po.status || "")}
                                </TableCell>
                                <TableCell
                                  key="orderedBy"
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[100px]"
                                >
                                  {po.orderedBy ?? ""}
                                </TableCell>
                                <TableCell
                                  key="skema"
                                  rowSpan={allItems.length}
                                  className="text-left border-gray-300 align-middle min-w-[100px]"
                                >
                                  {skemaMap[String(po.skema)] ?? po.skema ?? ""}
                                </TableCell>
                                <TableCell
                                  key="actions"
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
                            ) : null}
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
        {/* --- Add modal and toast to the layout --- */}
        <ConfirmModal
          open={confirmDeleteOpen}
          title="Konfirmasi Hapus PO"
          description={`Apakah Anda yakin ingin menghapus ${deleteIds.length} PO? Data yang dihapus tidak dapat dikembalikan.`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteOpen(false)}
        />
        <Toast
          open={toastOpen}
          message={toastMsg}
          onClose={() => setToastOpen(false)}
        />
      </div>
    </MainLayout>
  );
}
