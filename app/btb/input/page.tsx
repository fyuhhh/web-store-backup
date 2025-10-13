"use client";

import type React from "react";
import React from "react";

// Import exceljs for Excel export with style support
import * as ExcelJS from "exceljs";

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
import { type POData, type PRData, type BTBData } from "@/lib/dummy-data";
import { truncateText } from "@/lib/utils";

export default function BTBInputPage() {
  const [poData, setPoData] = useState<POData[]>([]);
  const [btbData, setBtbData] = useState<BTBData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBTB, setEditingBTB] = useState<BTBData | null>(null);
  const [selectedPO, setSelectedPO] = useState<POData | null>(null);
  const [selectedPOsForBTB, setSelectedPOsForBTB] = useState<POData[]>([]);

  // PO table selection state
  const [selectedPOs, setSelectedPOs] = useState<string[]>([]);

  // Pagination states for PO table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Search filter for PO table
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

  const [filterStatusPengiriman, setFilterStatusPengiriman] = useState<
    string[]
  >([]);
  const [statusPengirimanSearchTerm, setStatusPengirimanSearchTerm] =
    useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [statusSearchTerm, setStatusSearchTerm] = useState("");
  const [filterDiorderOleh, setFilterDiorderOleh] = useState<string[]>([]);
  const [diorderOlehSearchTerm, setDiorderOlehSearchTerm] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    noBTB: "",
    tanggal: "",
    periode: "",
    supplier: "",
    kodeSupplier: "",
    barang: "",
    jumlah: "",
    satuan: "",
    biaya: "",
    diterimaOleh: "",
    poId: "",
    tanggalDiterima: "",
    skema: "", // <-- tambah field skema
  });

  // Add: for BTB form, store array of items from selected PO(s)
  const [selectedPOItems, setSelectedPOItems] = useState<
    Array<{ poId: string; noPO: string; supplier: string; items: any[] }>
  >([]);

  // Helper to get PO item remaining qty
  function getPOItemsWithSisa(po: POData) {
    return po.poItems.flatMap((poItem) =>
      poItem.items
        .filter((item) => item.jumlahPO > 0)
        .map((item) => ({
          ...item,
          qtySisa: item.qtySisa ?? item.jumlahPO, // default to jumlahPO if not set
          poItemId: poItem.noPR + "-" + item.id,
          satuan: item.satuan,
        }))
    );
  }

  // Add state for BTB input quantities
  const [btbInputQty, setBtbInputQty] = useState<Record<string, number>>({});

  // Notification state
  const [notif, setNotif] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [userSchema, setUserSchema] = useState<string>("");

  useEffect(() => {
    loadData();
    setSelectedPOsForBTB([]);
    // Ambil skema user dari localStorage
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    setUserSchema(userData.schema || "");
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filterNamaBarang,
    filterQtyMin,
    filterQtyMax,
    filterSatuan,
    filterKeterangan,
    filterHargaSatuanMin,
    filterHargaSatuanMax,
    filterTotalMin,
    filterTotalMax,
    filterTanggalPO,
    filterEstimasiDiterima,
    filterSupplier,
    filterStatusPengiriman,
    filterStatus,
    filterDiorderOleh,
  ]);

  const loadData = () => {
    const storedPO = localStorage.getItem("poData");
    const storedBTB = localStorage.getItem("btbData");

    if (storedPO) {
      setPoData(JSON.parse(storedPO));
    }

    if (storedBTB) {
      // Pastikan semua BTB punya field skema
      const btbArr = JSON.parse(storedBTB).map((btb: any) => ({
        ...btb,
        skema: btb.skema ?? "pentacity", // default jika belum ada
      }));
      setBtbData(btbArr);
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
          skema: "pentacity", // <-- tambah skema di dummy
        },
      ];
      localStorage.setItem("btbData", JSON.stringify(dummyBTB));
      setBtbData(dummyBTB);
    }
  };

  const saveBTBData = (data: BTBData[]) => {
    localStorage.setItem("btbData", JSON.stringify(data));
    setBtbData(data);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");

    // Validasi: minimal satu barang qty > 0
    const hasQty = selectedPOItems.some((po) =>
      po.items.some((item) => (btbInputQty[item.poItemId] ?? 0) > 0)
    );
    if (!hasQty) {
      setNotif({
        type: "error",
        message: "Isi minimal satu barang dengan qty > 0.",
      });
      setTimeout(() => setNotif(null), 3000);
      return;
    }
    // Validasi: tanggal wajib diisi
    if (!formData.tanggal) {
      setNotif({ type: "error", message: "Tanggal BTB wajib diisi." });
      setTimeout(() => setNotif(null), 3000);
      return;
    }

    // For each selected PO, create BTB for items with qty > 0
    const newBTBs: BTBData[] = [];
    const updatedPOs: POData[] = poData.map((po) => {
      if (!selectedPOsForBTB.some((selectedPO) => selectedPO.id === po.id))
        return po;
      // Update qtySisa for each item
      const updatedPoItems = po.poItems.map((poItem) => ({
        ...poItem,
        items: poItem.items.map((item) => {
          const poItemId = poItem.noPR + "-" + item.id;
          const qtyReceived = btbInputQty[poItemId] ?? 0;
          const qtySisa = (item.qtySisa ?? item.jumlahPO) - qtyReceived;
          return {
            ...item,
            qtySisa: qtySisa,
          };
        }),
      }));

      // Determine PO status
      const allSisaZero = updatedPoItems.every((poItem) =>
        poItem.items.every((item) => item.qtySisa === 0)
      );
      const allSisaFull = updatedPoItems.every((poItem) =>
        poItem.items.every(
          (item) => (item.qtySisa ?? item.jumlahPO) === item.jumlahPO
        )
      );
      let status: POData["status"] = "Menunggu";
      if (allSisaZero) status = "Delivered";
      else if (!allSisaFull) status = "Diterima Sebagian";

      // --- Group items with qty > 0 into one BTB entry per PO ---
      const itemsWithQty = [];
      updatedPoItems.forEach((poItem) => {
        poItem.items.forEach((item) => {
          const poItemId = poItem.noPR + "-" + item.id;
          const qtyReceived = btbInputQty[poItemId] ?? 0;
          if (qtyReceived > 0) {
            itemsWithQty.push({
              barang: item.namaBarang,
              jumlah: qtyReceived,
              satuan: item.satuan,
              biaya: item.hargaSatuan * qtyReceived,
            });
          }
        });
      });

      if (itemsWithQty.length > 0) {
        // Simpan array items ke BTB
        newBTBs.push({
          id: `BTB-${String(btbData.length + newBTBs.length + 1).padStart(
            3,
            "0"
          )}`,
          noBTB:
            formData.noBTB ||
            `BTB/2024/${String(btbData.length + newBTBs.length + 1).padStart(
              3,
              "0"
            )}`,
          tanggal: formData.tanggal,
          periode: formData.periode,
          supplier: po.supplier,
          kodeSupplier: `SUP-${po.id.split("-")[1]}`,
          items: itemsWithQty,
          biaya: itemsWithQty.reduce((sum, i) => sum + i.biaya, 0),
          diterimaOleh: userData.username || formData.diterimaOleh,
          poId: po.id,
          status: "Draft",
          createdAt: new Date().toISOString(),
          skema: userData.schema || formData.skema || "pentacity", // <-- simpan skema
        });
      }

      return { ...po, poItems: updatedPoItems, status };
    });

    saveBTBData([...btbData, ...newBTBs]);
    localStorage.setItem("poData", JSON.stringify(updatedPOs));
    setPoData(updatedPOs);

    setNotif({ type: "success", message: "BTB berhasil disimpan!" });
    setTimeout(() => setNotif(null), 1500);

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      noBTB: "",
      tanggal: "",
      periode: "",
      supplier: "",
      kodeSupplier: "",
      barang: "",
      jumlah: "",
      satuan: "",
      biaya: "",
      diterimaOleh: "",
      poId: "",
      tanggalDiterima: "",
      skema: "",
    });
    setShowForm(false);
    setEditingBTB(null);
    setSelectedPO(null);
    setSelectedPOsForBTB([]);
    setSelectedPOs([]);
    setCurrentPage(1);
    setSearchTerm("");
  };

  const handleSelectPO = (poId: string, checked: boolean) => {
    if (checked) {
      setSelectedPOs([...selectedPOs, poId]);
    } else {
      setSelectedPOs(selectedPOs.filter((id) => id !== poId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPOs(filteredPOData.map((po) => po.id));
    } else {
      setSelectedPOs([]);
    }
  };

  const handleBuatBTB = () => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    // Find selected PO objects
    const selectedPOObjects = poData.filter((po) =>
      selectedPOs.includes(po.id)
    );
    if (selectedPOObjects.length === 0) {
      alert("Pilih minimal satu PO untuk dibuat BTB.");
      return;
    }
    setSelectedPOsForBTB(selectedPOObjects);
    setShowForm(true);

    // Prepare summary of selected PO items for detail
    setSelectedPOItems(
      selectedPOObjects.map((po) => ({
        poId: po.id,
        noPO: po.noPO,
        supplier: po.supplier,
        items: getPOItemsWithSisa(po),
      }))
    );
    // Set initial BTB input qty to 0 for each item
    const qtyObj: Record<string, number> = {};
    selectedPOObjects.forEach((po) => {
      getPOItemsWithSisa(po).forEach((item) => {
        qtyObj[item.poItemId] = 0;
      });
    });
    setBtbInputQty(qtyObj);

    // Pre-fill form with first selected PO data
    const firstPO = selectedPOObjects[0];
    setFormData({
      noBTB: "",
      tanggal: new Date().toISOString().split("T")[0],
      periode: "",
      supplier: firstPO.supplier,
      kodeSupplier: `SUP-${firstPO.id.split("-")[1]}`,
      barang: "",
      jumlah: "",
      satuan: "",
      biaya: firstPO.totalPembayaran.toString(),
      diterimaOleh: "",
      poId: firstPO.id,
      tanggalDiterima: "",
      skema: userData.schema || "pentacity", // <-- otomatis isi skema
    });
  };

  // Compute unique values for filters
  const uniqueSatuan = Array.from(
    new Set(
      poData.flatMap((po) =>
        po.poItems.flatMap((poItem) => poItem.items.map((item) => item.satuan))
      )
    )
  ).sort();
  const uniqueSuppliers = Array.from(
    new Set(poData.map((po) => po.supplier).filter((s) => s && s.trim() !== ""))
  ).sort();
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
    new Set(
      poData
        .map((po) => po.tanggalPO)
        .filter((t): t is string => t !== undefined && t.trim() !== "")
    )
  ).sort();
  const uniqueEstimasiDiterima = Array.from(
    new Set(
      poData
        .map((po) => po.estimasiTanggalDiterima)
        .filter((t): t is string => t !== undefined && t.trim() !== "")
    )
  ).sort();
  const uniqueStatusPengiriman = Array.from(
    new Set(
      poData
        .map((po) => po.statusPengiriman)
        .filter((s): s is string => s !== undefined && s.trim() !== "")
    )
  ).sort() as string[];
  const uniqueDiorderOleh = Array.from(
    new Set(
      poData
        .map((po) => po.orderedBy)
        .filter((o): o is string => o !== undefined && o.trim() !== "")
    )
  ).sort();

  // Filter data untuk tabel PO (copy dari monitoring\page.tsx)
  const filteredPOData = poData
    .filter((po) => !userSchema || po.skema === userSchema) // <-- filter by schema
    .map((po) => {
      let status = po.status || "Menunggu";
      return { ...po, status };
    })
    .filter((po) => {
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
        (filterTotalMax === "" || po.totalPembayaran <= Number(filterTotalMax));

      const matchesTanggalPO =
        filterTanggalPO.length === 0 || filterTanggalPO.includes(po.tanggalPO);

      const matchesEstimasiDiterima =
        filterEstimasiDiterima.length === 0 ||
        filterEstimasiDiterima.includes(po.estimasiTanggalDiterima);

      const matchesSupplier =
        filterSupplier.length === 0 || filterSupplier.includes(po.supplier);

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
        matchesStatusPengiriman &&
        matchesStatus &&
        matchesDiorderOleh
      );
    })
    .filter((po) =>
      po.poItems.some((poItem) =>
        poItem.items.some((item) => item.jumlahPO > 0)
      )
    );

  // Pagination logic
  const totalPages = Math.ceil(filteredPOData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredPOData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Badge status (copy dari monitoring\page.tsx)
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

  // Tambahkan helper formatRupiah
  function formatRupiah(value: string | number) {
    const num = typeof value === "string" ? value.replace(/\D/g, "") : value;
    if (!num) return "";
    return Number(num).toLocaleString("id-ID");
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Notifikasi */}
        {notif && (
          <div
            className={`mb-4 px-4 py-2 rounded ${
              notif.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {notif.message}
          </div>
        )}
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Input BTB (Bukti Terima Barang)
            </h1>
            <p className="text-muted-foreground">
              Pilih PO yang sudah disetujui untuk dibuatkan BTB
            </p>
          </div>
          {/* Buat BTB button top right, only if PO(s) selected and not showing form */}
          {selectedPOs.length > 0 && !showForm && (
            <Button
              type="button"
              className="bg-primary hover:bg-primary/90"
              onClick={handleBuatBTB}
            >
              Buat BTB
            </Button>
          )}
        </div>

        {/* Tabel PO dari Monitoring PO */}
        {!showForm && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Daftar Purchase Order</CardTitle>
              <CardDescription>
                Total: {filteredPOData.length} PO | Dipilih:{" "}
                {selectedPOs.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="border border-gray-300">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedPOs.length === filteredPOData.length &&
                            filteredPOData.length > 0
                          }
                          onCheckedChange={(checked) =>
                            handleSelectAll(checked === true)
                          }
                          style={{
                            boxShadow: "0 0 0 2px #bbb, 0 2px 8px #bbb8",
                            border: "1.5px solid #bbb",
                            borderRadius: 4,
                          }}
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </TableHead>
                      <TableHead>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1"
                              aria-label="Filter No. PO"
                            >
                              No. PO <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 !bg-white border border-gray-200 shadow-lg">
                            <Input
                              placeholder="Cari No. PO..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1"
                              aria-label="Filter Daftar Barang"
                            >
                              Daftar Barang <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 !bg-white border border-gray-200 shadow-lg">
                            <Input
                              placeholder="Cari nama barang..."
                              value={filterNamaBarang}
                              onChange={(e) =>
                                setFilterNamaBarang(e.target.value)
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1"
                              aria-label="Filter Qty"
                            >
                              Qty <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 !bg-white border border-gray-200 shadow-lg">
                            <div className="space-y-2">
                              <Input
                                placeholder="Min Qty"
                                value={filterQtyMin}
                                onChange={(e) =>
                                  setFilterQtyMin(
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value)
                                  )
                                }
                                type="number"
                              />
                              <Input
                                placeholder="Max Qty"
                                value={filterQtyMax}
                                onChange={(e) =>
                                  setFilterQtyMax(
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value)
                                  )
                                }
                                type="number"
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1"
                              aria-label="Filter Satuan"
                            >
                              Satuan <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-2 !bg-white border border-gray-200 shadow-lg">
                            <Input
                              placeholder="Cari satuan..."
                              value={satuanSearchTerm}
                              onChange={(e) =>
                                setSatuanSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-48 overflow-y-auto space-y-1">
                              {uniqueSatuan
                                .filter((satuan) =>
                                  satuan
                                    .toLowerCase()
                                    .includes(satuanSearchTerm.toLowerCase())
                                )
                                .map((satuan) => (
                                  <div
                                    key={satuan}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`satuan-${satuan}`}
                                      checked={filterSatuan.includes(satuan)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setFilterSatuan([
                                            ...filterSatuan,
                                            satuan,
                                          ]);
                                        } else {
                                          setFilterSatuan(
                                            filterSatuan.filter(
                                              (s) => s !== satuan
                                            )
                                          );
                                        }
                                      }}
                                    />
                                    <Label
                                      htmlFor={`satuan-${satuan}`}
                                      className="text-sm"
                                    >
                                      {satuan}
                                    </Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1"
                              aria-label="Filter Keterangan"
                            >
                              Keterangan <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 !bg-white border border-gray-200 shadow-lg">
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
                      <TableHead>Harga Satuan</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1"
                              aria-label="Filter Tanggal PO"
                            >
                              Tanggal PO <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-2 !bg-white border border-gray-200 shadow-lg">
                            <Input
                              placeholder="Cari tanggal PO..."
                              value={tanggalPOSearchTerm}
                              onChange={(e) =>
                                setTanggalPOSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-48 overflow-y-auto space-y-1">
                              {uniqueTanggalPO
                                .filter((tanggal) =>
                                  tanggal
                                    .toLowerCase()
                                    .includes(tanggalPOSearchTerm.toLowerCase())
                                )
                                .map((tanggal) => (
                                  <div
                                    key={tanggal}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`tanggal-${tanggal}`}
                                      checked={filterTanggalPO.includes(
                                        tanggal
                                      )}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setFilterTanggalPO([
                                            ...filterTanggalPO,
                                            tanggal,
                                          ]);
                                        } else {
                                          setFilterTanggalPO(
                                            filterTanggalPO.filter(
                                              (t) => t !== tanggal
                                            )
                                          );
                                        }
                                      }}
                                    />
                                    <Label
                                      htmlFor={`tanggal-${tanggal}`}
                                      className="text-sm"
                                    >
                                      {tanggal}
                                    </Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1"
                              aria-label="Filter Estimasi Diterima"
                            >
                              Estimasi Diterima{" "}
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-2 !bg-white border border-gray-200 shadow-lg">
                            <Input
                              placeholder="Cari estimasi diterima..."
                              value={estimasiDiterimaSearchTerm}
                              onChange={(e) =>
                                setEstimasiDiterimaSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-48 overflow-y-auto space-y-1">
                              {uniqueEstimasiDiterima
                                .filter((estimasi) =>
                                  estimasi
                                    .toLowerCase()
                                    .includes(
                                      estimasiDiterimaSearchTerm.toLowerCase()
                                    )
                                )
                                .map((estimasi) => (
                                  <div
                                    key={estimasi}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`estimasi-${estimasi}`}
                                      checked={filterEstimasiDiterima.includes(
                                        estimasi
                                      )}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setFilterEstimasiDiterima([
                                            ...filterEstimasiDiterima,
                                            estimasi,
                                          ]);
                                        } else {
                                          setFilterEstimasiDiterima(
                                            filterEstimasiDiterima.filter(
                                              (e) => e !== estimasi
                                            )
                                          );
                                        }
                                      }}
                                    />
                                    <Label
                                      htmlFor={`estimasi-${estimasi}`}
                                      className="text-sm"
                                    >
                                      {estimasi}
                                    </Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1"
                              aria-label="Filter Supplier"
                            >
                              Supplier <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-2 !bg-white border border-gray-200 shadow-lg">
                            <Input
                              placeholder="Cari supplier..."
                              value={supplierSearchTerm}
                              onChange={(e) =>
                                setSupplierSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-48 overflow-y-auto space-y-1">
                              {uniqueSuppliers
                                .filter((supplier) =>
                                  supplier
                                    .toLowerCase()
                                    .includes(supplierSearchTerm.toLowerCase())
                                )
                                .map((supplier) => (
                                  <div
                                    key={supplier}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`supplier-${supplier}`}
                                      checked={filterSupplier.includes(
                                        supplier
                                      )}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setFilterSupplier([
                                            ...filterSupplier,
                                            supplier,
                                          ]);
                                        } else {
                                          setFilterSupplier(
                                            filterSupplier.filter(
                                              (s) => s !== supplier
                                            )
                                          );
                                        }
                                      }}
                                    />
                                    <Label
                                      htmlFor={`supplier-${supplier}`}
                                      className="text-sm"
                                    >
                                      {supplier}
                                    </Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1"
                              aria-label="Filter Status Pengiriman"
                            >
                              Status Pengiriman{" "}
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-2 !bg-white border border-gray-200 shadow-lg">
                            <Input
                              placeholder="Cari status pengiriman..."
                              value={statusPengirimanSearchTerm}
                              onChange={(e) =>
                                setStatusPengirimanSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-48 overflow-y-auto space-y-1">
                              {uniqueStatusPengiriman
                                .filter((status) =>
                                  status
                                    .toLowerCase()
                                    .includes(
                                      statusPengirimanSearchTerm.toLowerCase()
                                    )
                                )
                                .map((status) => (
                                  <div
                                    key={status}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`status-pengiriman-${status}`}
                                      checked={filterStatusPengiriman.includes(
                                        status
                                      )}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setFilterStatusPengiriman([
                                            ...filterStatusPengiriman,
                                            status,
                                          ]);
                                        } else {
                                          setFilterStatusPengiriman(
                                            filterStatusPengiriman.filter(
                                              (s) => s !== status
                                            )
                                          );
                                        }
                                      }}
                                    />
                                    <Label
                                      htmlFor={`status-pengiriman-${status}`}
                                      className="text-sm"
                                    >
                                      {status}
                                    </Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1"
                              aria-label="Filter Status"
                            >
                              Status <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-2 !bg-white border border-gray-200 shadow-lg">
                            <Input
                              placeholder="Cari status..."
                              value={statusSearchTerm}
                              onChange={(e) =>
                                setStatusSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-48 overflow-y-auto space-y-1">
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
                                          setFilterStatus([
                                            ...filterStatus,
                                            status,
                                          ]);
                                        } else {
                                          setFilterStatus(
                                            filterStatus.filter(
                                              (s) => s !== status
                                            )
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
                      </TableHead>
                      <TableHead>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1"
                              aria-label="Filter Diorder Oleh"
                            >
                              Diorder oleh <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-2 !bg-white border border-gray-200 shadow-lg">
                            <Input
                              placeholder="Cari diorder oleh..."
                              value={diorderOlehSearchTerm}
                              onChange={(e) =>
                                setDiorderOlehSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-48 overflow-y-auto space-y-1">
                              {uniqueDiorderOleh
                                .filter((diorderOleh) =>
                                  diorderOleh
                                    .toLowerCase()
                                    .includes(
                                      diorderOlehSearchTerm.toLowerCase()
                                    )
                                )
                                .map((diorderOleh) => (
                                  <div
                                    key={diorderOleh}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`diorder-oleh-${diorderOleh}`}
                                      checked={filterDiorderOleh.includes(
                                        diorderOleh
                                      )}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setFilterDiorderOleh([
                                            ...filterDiorderOleh,
                                            diorderOleh,
                                          ]);
                                        } else {
                                          setFilterDiorderOleh(
                                            filterDiorderOleh.filter(
                                              (d) => d !== diorderOleh
                                            )
                                          );
                                        }
                                      }}
                                    />
                                    <Label
                                      htmlFor={`diorder-oleh-${diorderOleh}`}
                                      className="text-sm"
                                    >
                                      {diorderOleh}
                                    </Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((po) => {
                      // Flatten all items from all poItems and filter jumlahPO > 0
                      const allItems = po.poItems.flatMap((poItem) =>
                        poItem.items
                          .filter((item) => item.jumlahPO > 0)
                          .map((item) => ({
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
                              {itemIndex === 0 && (
                                <>
                                  <TableCell
                                    rowSpan={allItems.length}
                                    className="px-4 py-2 border-r border-gray-300 align-middle"
                                  >
                                    <Checkbox
                                      checked={selectedPOs.includes(po.id)}
                                      onCheckedChange={(checked) =>
                                        handleSelectPO(po.id, checked === true)
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
                                    className="font-medium px-4 py-2 border-r border-gray-300 align-middle"
                                    rowSpan={allItems.length}
                                  >
                                    {po.noPO}
                                  </TableCell>
                                </>
                              )}
                              <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[200px]">
                                {item.namaBarang}
                              </TableCell>
                              <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[80px]">
                                {item.jumlahPO}
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
                              {itemIndex === 0 && (
                                <>
                                  <TableCell
                                    rowSpan={allItems.length}
                                    className="text-left border-r border-gray-300 align-middle min-w-[120px]"
                                  >
                                    Rp{" "}
                                    {po.totalPembayaran.toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell
                                    rowSpan={allItems.length}
                                    className="text-left border-r border-gray-300 align-middle min-w-[120px]"
                                  >
                                    {po.tanggalPO}
                                  </TableCell>
                                  <TableCell
                                    rowSpan={allItems.length}
                                    className="text-left border-r border-gray-300 align-middle min-w-[140px]"
                                  >
                                    {po.estimasiTanggalDiterima}
                                  </TableCell>
                                  <TableCell
                                    rowSpan={allItems.length}
                                    className="text-left border-r border-gray-300 align-middle min-w-[140px]"
                                  >
                                    {po.supplier}
                                  </TableCell>
                                  <TableCell
                                    rowSpan={allItems.length}
                                    className="text-left border-r border-gray-300 align-middle min-w-[140px]"
                                  >
                                    {po.statusPengiriman ?? ""}
                                  </TableCell>
                                  <TableCell
                                    rowSpan={allItems.length}
                                    className="text-left border-r border-gray-300 align-middle min-w-[100px]"
                                  >
                                    {getStatusBadge(po.status || "")}
                                  </TableCell>
                                  <TableCell
                                    rowSpan={allItems.length}
                                    className="text-left border-r border-gray-300 align-middle min-w-[100px]"
                                  >
                                    {po.orderedBy ?? ""}
                                  </TableCell>
                                </>
                              )}
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
        )}

        {/* BTB Form - show only when showForm is true */}
        {showForm && (
          <Card className="bg-card border-border shadow-md rounded-md">
            <CardHeader>
              <CardTitle>
                {editingBTB ? "Edit BTB" : "Tambah BTB Baru"}
              </CardTitle>
              <CardDescription>
                Isi form di bawah untuk{" "}
                {editingBTB ? "mengubah" : "menambahkan"} Bukti Terima Barang
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Detail PO yang dipilih */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">
                  Detail PO yang dipilih
                </h3>
                <div className="border rounded-lg p-3 bg-muted/50">
                  {selectedPOItems.map((po) => (
                    <div key={po.poId} className="mb-3">
                      <div className="font-medium">
                        No. PO: {po.noPO} | Supplier: {po.supplier}
                      </div>
                      <ul className="list-disc ml-6 text-sm">
                        {po.items
                          .filter((item) => item.qtySisa > 0) // Only show items with qty > 0
                          .map((item, idx) => (
                            <li key={item.poItemId}>
                              {item.namaBarang} - Sisa: {item.qtySisa}{" "}
                              {item.satuan}
                              <div className="flex items-center gap-2 mt-1">
                                <Label className="text-xs">Qty diterima:</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={item.qtySisa}
                                  value={btbInputQty[item.poItemId] ?? ""}
                                  onChange={(e) => {
                                    // Remove leading zeros and ensure integer
                                    let val = e.target.value.replace(
                                      /^0+(\d)/,
                                      "$1"
                                    );
                                    val =
                                      val === ""
                                        ? ""
                                        : Math.max(
                                            0,
                                            Math.min(Number(val), item.qtySisa)
                                          );
                                    setBtbInputQty((prev) => ({
                                      ...prev,
                                      [item.poItemId]: val,
                                    }));
                                  }}
                                  className="w-20"
                                />
                                <span className="text-xs text-muted-foreground">
                                  / {item.qtySisa} {item.satuan}
                                </span>
                              </div>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="noBTB">No. BTB</Label>
                    <Input
                      id="noBTB"
                      value={formData.noBTB}
                      onChange={(e) =>
                        setFormData({ ...formData, noBTB: e.target.value })
                      }
                      placeholder="Auto-generated"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tanggal">Tanggal BTB</Label>
                    <Input
                      id="tanggal"
                      type="date"
                      value={
                        formData.tanggal ||
                        new Date().toISOString().split("T")[0]
                      }
                      onChange={(e) =>
                        setFormData({ ...formData, tanggal: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="periode">Periode</Label>
                    <Input
                      id="periode"
                      value={formData.periode}
                      onChange={(e) =>
                        setFormData({ ...formData, periode: e.target.value })
                      }
                      placeholder="Contoh: Juni 2024"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier">Nama Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) =>
                        setFormData({ ...formData, supplier: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="kodeSupplier">Kode Supplier</Label>
                    <Input
                      id="kodeSupplier"
                      value={formData.kodeSupplier}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          kodeSupplier: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="barang">Nama Barang</Label>
                    <div className="border rounded px-2 py-1 bg-muted/50 min-h-[40px]">
                      {selectedPOItems.length > 0
                        ? selectedPOItems
                            .flatMap((po) =>
                              po.items
                                .filter(
                                  (item) =>
                                    (btbInputQty[item.poItemId] ?? 0) > 0
                                )
                                .map((item) => item.namaBarang)
                            )
                            .map((barang, idx) => <div key={idx}>{barang}</div>)
                        : formData.barang}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="jumlah">Quantity</Label>
                    <div className="border rounded px-2 py-1 bg-muted/50 min-h-[40px]">
                      {selectedPOItems.length > 0
                        ? selectedPOItems
                            .flatMap((po) =>
                              po.items
                                .filter(
                                  (item) =>
                                    (btbInputQty[item.poItemId] ?? 0) > 0
                                )
                                .map((item) => btbInputQty[item.poItemId] ?? 0)
                            )
                            .map((qty, idx) => <div key={idx}>{qty}</div>)
                        : formData.jumlah}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="satuan">Satuan</Label>
                    <div className="border rounded px-2 py-1 bg-muted/50 min-h-[40px]">
                      {selectedPOItems.length > 0
                        ? selectedPOItems
                            .flatMap((po) =>
                              po.items
                                .filter(
                                  (item) =>
                                    (btbInputQty[item.poItemId] ?? 0) > 0
                                )
                                .map((item) => item.satuan)
                            )
                            .map((satuan, idx) => <div key={idx}>{satuan}</div>)
                        : formData.satuan}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="biaya">Biaya</Label>
                    <Input
                      id="biaya"
                      type="text"
                      inputMode="numeric"
                      value={formatRupiah(formData.biaya)}
                      onChange={(e) => {
                        // Hanya angka, tanpa titik
                        const raw = e.target.value.replace(/\D/g, "");
                        setFormData({ ...formData, biaya: raw });
                      }}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="skema">Skema</Label>
                    <div className="min-h-[40px] flex items-center text-base font-semibold text-muted-foreground">
                      {formData.skema}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 justify-end">
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90"
                  >
                    {editingBTB ? "Update BTB" : "Simpan BTB"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedPOItems([]);
                    }}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
