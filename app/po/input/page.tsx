"use client";

import type React from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown } from "lucide-react";
import type { PRData, POData, PRItem } from "@/lib/dummy-data";

// Tambahkan import Pagination di sini
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

export default function InputPOPage() {
  const [prData, setPrData] = useState<PRData[]>([]);
  const [poData, setPoData] = useState<POData[]>([]);

  // PO Form state
  const [poFormData, setPoFormData] = useState({
    noPO: "",
    tanggalPO: new Date().toISOString().split("T")[0],
    supplier: "",
    estimasiTanggalDiterima: "",
    diskon: "",
    ppn: "11",
    statusPengiriman: "",
    statusPermintaan: "",
    skema: "", // <-- add skema field
  });

  const [userSkema, setUserSkema] = useState("");

  // State for PO items with pricing
  const [poItems, setPoItems] = useState<
    Array<{
      prId: string;
      noPR: string;
      skema: string;
      items: Array<
        PRItem & {
          hargaSatuan: number;
          jumlahPO: number;
          jumlahAsli: number;
          diskonItem: number;
          skema: string;
          dibuatOleh: string;
        }
      >;
    }>
  >([]);

  // Discount breakdown state
  const [discountBreakdown, setDiscountBreakdown] = useState<
    Array<{ label: string; value: string; amount: number }>
  >([]);

  // Filter states
  const [filterNoPR, setFilterNoPR] = useState("");
  const [filterNamaBarang, setFilterNamaBarang] = useState("");
  const [filterQtyMin, setFilterQtyMin] = useState<number | "">("");
  const [filterQtyMax, setFilterQtyMax] = useState<number | "">("");
  const [filterSatuan, setFilterSatuan] = useState<string[]>([]);
  const [satuanSearchTerm, setSatuanSearchTerm] = useState("");
  const [filterHargaSatuanMin, setFilterHargaSatuanMin] = useState<number | "">(
    ""
  );
  const [filterHargaSatuanMax, setFilterHargaSatuanMax] = useState<number | "">(
    ""
  );
  const [filterTotalMin, setFilterTotalMin] = useState<number | "">("");
  const [filterTotalMax, setFilterTotalMax] = useState<number | "">("");
  const [filterKeterangan, setFilterKeterangan] = useState("");

  // Pagination states
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Tambahkan pagination untuk tabel PR Siap Proses ke PO
  const prItemsPerPage = 10;
  const [prCurrentPage, setPrCurrentPage] = useState(1);

  // Compute unique values for filters
  const uniqueSatuan = Array.from(
    new Set(
      poItems.flatMap((poItem) =>
        poItem.items.map((item) => item.satuan).filter(Boolean)
      )
    )
  ).sort();

  // Filtered PO items
  const filteredPOItems = poItems
    .filter((poItem) => !userSkema || poItem.skema === userSkema) // <-- filter by skema
    .map((poItem) => ({
      ...poItem,
      items: poItem.items.filter((item) => {
        const matchesNoPR =
          !filterNoPR ||
          poItem.noPR.toLowerCase().includes(filterNoPR.toLowerCase());
        const matchesNamaBarang =
          !filterNamaBarang ||
          item.namaBarang
            .toLowerCase()
            .includes(filterNamaBarang.toLowerCase());
        const matchesQty =
          (filterQtyMin === "" || item.jumlahPO >= filterQtyMin) &&
          (filterQtyMax === "" || item.jumlahPO <= filterQtyMax);
        const matchesSatuan =
          filterSatuan.length === 0 || filterSatuan.includes(item.satuan);
        const matchesHargaSatuan =
          (filterHargaSatuanMin === "" ||
            item.hargaSatuan >= filterHargaSatuanMin) &&
          (filterHargaSatuanMax === "" ||
            item.hargaSatuan <= filterHargaSatuanMax);
        const matchesTotal =
          (filterTotalMin === "" ||
            item.hargaSatuan * item.jumlahPO >= filterTotalMin) &&
          (filterTotalMax === "" ||
            item.hargaSatuan * item.jumlahPO <= filterTotalMax);
        const matchesKeterangan =
          !filterKeterangan ||
          (item.keterangan || "")
            .toLowerCase()
            .includes(filterKeterangan.toLowerCase());

        return (
          matchesNoPR &&
          matchesNamaBarang &&
          matchesQty &&
          matchesSatuan &&
          matchesHargaSatuan &&
          matchesTotal &&
          matchesKeterangan
        );
      }),
    }))
    .filter((poItem) => poItem.items.length > 0);

  // Flatten all items for pagination
  const allFilteredItems = filteredPOItems.flatMap((poItem) =>
    poItem.items.map((item) => ({
      ...item,
      noPR: poItem.noPR,
      prId: poItem.prId,
    }))
  );

  const totalPages = Math.ceil(allFilteredItems.length / itemsPerPage);
  const pagedItems = allFilteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Flatten semua item PR siap proses ke PO
  const allPRItems = filteredPOItems.flatMap((poItem) =>
    poItem.items.map((item) => ({
      ...item,
      noPR: poItem.noPR,
      prId: poItem.prId,
    }))
  );

  const prTotalPages = Math.ceil(allPRItems.length / prItemsPerPage);
  const prPagedItems = allPRItems.slice(
    (prCurrentPage - 1) * prItemsPerPage,
    prCurrentPage * prItemsPerPage
  );

  // Calculation functions
  const parseDiscounts = (discountText: string) => {
    if (!discountText.trim()) return [];

    const discounts = discountText.split("+").map((d) => d.trim());
    return discounts
      .map((discount, index) => {
        if (discount.endsWith("%")) {
          const percentage = parseFloat(discount.replace("%", ""));
          return { type: "percentage", value: percentage, original: discount };
        } else {
          const nominal = parseFloat(discount);
          return { type: "nominal", value: nominal, original: discount };
        }
      })
      .filter((d) => !isNaN(d.value));
  };

  const calculateTotal = () => {
    let subtotal = 0;

    // Calculate subtotal from all items
    poItems.forEach((poItem) => {
      poItem.items.forEach((item) => {
        subtotal += item.hargaSatuan * item.jumlahPO;
      });
    });

    // Parse discounts
    const parsedDiscounts = parseDiscounts(poFormData.diskon);

    // Calculate discount amount sequentially
    let totalDiscount = 0;
    let currentAmount = subtotal;
    const breakdown: Array<{ label: string; value: string; amount: number }> =
      [];

    parsedDiscounts.forEach((discount, index) => {
      let discountAmount = 0;
      if (discount.type === "percentage") {
        discountAmount = currentAmount * (discount.value / 100);
      } else {
        discountAmount = Math.min(discount.value, currentAmount); // Cap at current amount
      }
      totalDiscount += discountAmount;
      currentAmount -= discountAmount;

      breakdown.push({
        label: `Diskon ${index + 1}`,
        value: discount.original,
        amount: discountAmount,
      });
    });

    // Calculate PPN
    const ppnAmount =
      (subtotal - totalDiscount) * (parseFloat(poFormData.ppn) / 100);

    // Total payment
    const totalPayment = subtotal - totalDiscount + ppnAmount;

    return {
      subtotal,
      totalDiscount,
      ppnAmount, // <-- ensure this is returned
      totalPayment,
      breakdown,
    };
  };

  const [notif, setNotif] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleCreatePO = () => {
    if (!poFormData.supplier.trim()) {
      setNotif({ type: "error", message: "Supplier harus diisi!" });
      setTimeout(() => setNotif(null), 2500);
      return;
    }

    if (poItems.length === 0) {
      setNotif({ type: "error", message: "Minimal satu item harus dipilih!" });
      setTimeout(() => setNotif(null), 2500);
      return;
    }

    const calculations = calculateTotal();

    // Create new PO
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const orderedByUser = userData.username || "Admin";
    const userSkema = userData.skema || "";

    const newPO: POData = {
      id: `PO-${Date.now()}`,
      noPO: poFormData.noPO,
      tanggalPO: poFormData.tanggalPO,
      supplier: poFormData.supplier,
      diskon: calculations.totalDiscount.toString(),
      originalDiskon: poFormData.diskon,
      ppn: parseFloat(poFormData.ppn),
      ppnAmount: calculations.ppnAmount,
      totalPembayaran: calculations.totalPayment,
      orderedBy: orderedByUser,
      estimasiTanggalDiterima: poFormData.estimasiTanggalDiterima,
      statusPengiriman: poFormData.statusPengiriman,
      statusPermintaan: poFormData.statusPermintaan,
      prIds: poItems.map((poItem) => poItem.prId),
      poItems: poItems,
      status: "Menunggu",
      createdAt: new Date().toISOString(),
      skema: userSkema, // simpan skema dari user login
    };

    // Save new PO
    const updatedPOData = [...poData, newPO];
    savePOData(updatedPOData);

    // Update PR status and remaining quantities
    const updatedPRData = prData.map((pr) => {
      const poItem = poItems.find((poItem) => poItem.prId === pr.id);
      if (poItem) {
        // Update remaining quantities in PR items
        const updatedItems = pr.items.map((prItem) => {
          const poItemDetail = poItem.items.find(
            (item) => item.id === prItem.id
          );
          if (poItemDetail) {
            const remainingQty = prItem.jumlah - poItemDetail.jumlahPO;
            return { ...prItem, jumlah: Math.max(0, remainingQty) };
          }
          return prItem;
        });

        // Check if all items in this PR have been fully processed (remaining quantity = 0)
        const allItemsProcessed = updatedItems.every(
          (item) => item.jumlah === 0
        );

        if (allItemsProcessed) {
          return { ...pr, items: updatedItems, status: "Telah Selesai" as any };
        } else {
          return { ...pr, items: updatedItems, status: "Gantung" as any };
        }
      }
      return pr;
    });
    localStorage.setItem("prData", JSON.stringify(updatedPRData));

    // Reset form
    setPoFormData({
      noPO: `PO/2024/${String(updatedPOData.length + 1).padStart(3, "0")}`,
      tanggalPO: new Date().toISOString().split("T")[0],
      supplier: "",
      estimasiTanggalDiterima: "",
      diskon: "",
      ppn: "11",
      statusPengiriman: "",
      statusPermintaan: "",
      skema: userSkema, // reset skema dari user login
    });
    setPoItems([]);
    setDiscountBreakdown([]);

    setNotif({ type: "success", message: `PO ${newPO.noPO} berhasil dibuat!` });
    setTimeout(() => {
      setNotif(null);
      window.location.href = "/po/status";
    }, 1800);
  };

  useEffect(() => {
    loadData();
    // Ambil skema dari userData
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const userSkemaVal = userData.skema || "";
    setUserSkema(userSkemaVal);
    setPoFormData((prev) => ({
      ...prev,
      skema: userSkemaVal,
    }));
    // Check if there are selected PRs from status page
    const selectedFromStatus = localStorage.getItem("selectedPRsForPO");
    if (selectedFromStatus) {
      const selectedPRData = JSON.parse(selectedFromStatus);
      setSelectedPRsForPO(selectedPRData);

      // Auto-populate form with first PR data
      if (selectedPRData.length > 0) {
        setPoFormData((prev) => ({
          ...prev,
          noPO: `PO/2024/${String(poData.length + 1).padStart(3, "0")}`,
          tanggalPO: new Date().toISOString().split("T")[0],
          skema: userSkemaVal, // pastikan skema diambil dari userData.schema
        }));

        // Set PO items with individual pricing
        setPoItems(
          selectedPRData.map((pr: any) => ({
            prId: pr.id,
            noPR: pr.noPR,
            skema: pr.skema || "",
            items: pr.items.map((item: any) => ({
              ...item,
              hargaSatuan: 0, // Will be set by user
              jumlahPO: 0, // Default to 0
              jumlahAsli: item.jumlah, // Store original quantity for validation
              diskonItem: 0,
              skema: pr.skema || "",
              dibuatOleh: pr.dibuatOleh || "",
            })),
          }))
        );
      }

      // Don't remove the localStorage here, let status page handle it
    }
  }, []);

  const loadData = () => {
    const storedPR = localStorage.getItem("prData");
    const storedPO = localStorage.getItem("poData");
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const userSkema = userData.skema || "";

    if (storedPR) {
      const parsedPRData = JSON.parse(storedPR);
      // Filter PR sesuai skema user
      setPrData(
        parsedPRData.filter((pr: any) => !userSkema || pr.skema === userSkema)
      );
    }
    if (storedPO) {
      const parsedPOData = JSON.parse(storedPO);
      // Filter PO sesuai skema user
      setPoData(
        parsedPOData.filter((po: any) => !userSkema || po.skema === userSkema)
      );
    }
  };

  const savePOData = (data: POData[]) => {
    localStorage.setItem("poData", JSON.stringify(data));
    setPoData(data);
  };

  // Update discount breakdown when discount changes
  useEffect(() => {
    const calculations = calculateTotal();
    setDiscountBreakdown(calculations.breakdown);
  }, [poFormData.diskon, poItems]);

  // Dummy state for selectedPRsForPO to satisfy TypeScript
  const [selectedPRsForPO, setSelectedPRsForPO] = useState<any[]>([]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Notifikasi tengah layar */}
        {notif && (
          <div
            className={`fixed left-1/2 top-16 z-50 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-center text-base font-semibold
              ${
                notif.type === "success"
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            style={{ minWidth: 280, maxWidth: 400 }}
          >
            {notif.message}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Input PO</h1>
            <p className="text-muted-foreground">
              Form untuk membuat Purchase Order baru
            </p>
          </div>
          <Button
            onClick={() => (window.location.href = "/po/status")}
            variant="outline"
            className="bg-primary hover:bg-primary/90"
          >
            Kembali ke Status PO
          </Button>
        </div>

        {/* Keterangan PR yang sedang diproses */}
        {poItems.length > 0 && (
          <div className="mb-2 p-4 bg-muted border rounded text-sm text-muted-foreground">
            <span>
              <b>Membuat PO dari PR:</b>{" "}
              {poItems.map((poItem) => poItem.noPR).join(", ")}
            </span>
          </div>
        )}

        {/* PO Form */}
        <Card className="bg-card border-border shadow-md rounded-md">
          <CardHeader>
            <CardTitle>Buat Purchase Order</CardTitle>
            <CardDescription>
              Isi form di bawah untuk menambahkan Purchase Order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Form Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="noPO"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      No. PO
                    </Label>
                    <Input
                      id="noPO"
                      value={poFormData.noPO}
                      onChange={(e) =>
                        setPoFormData({ ...poFormData, noPO: e.target.value })
                      }
                      placeholder="Auto-generated"
                      className="border-border focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="tanggalPO"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Tanggal PO
                    </Label>
                    <Input
                      id="tanggalPO"
                      type="date"
                      value={poFormData.tanggalPO}
                      onChange={(e) =>
                        setPoFormData({
                          ...poFormData,
                          tanggalPO: e.target.value,
                        })
                      }
                      className="border-border focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="supplier"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Supplier
                  </Label>
                  <Input
                    id="supplier"
                    value={poFormData.supplier}
                    onChange={(e) =>
                      setPoFormData({
                        ...poFormData,
                        supplier: e.target.value,
                      })
                    }
                    placeholder="Nama supplier"
                    className="border-border focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="estimasiTanggalDiterima"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Estimasi Tanggal Diterima
                  </Label>
                  <Input
                    id="estimasiTanggalDiterima"
                    type="date"
                    value={poFormData.estimasiTanggalDiterima}
                    onChange={(e) =>
                      setPoFormData({
                        ...poFormData,
                        estimasiTanggalDiterima: e.target.value,
                      })
                    }
                    className="border-border focus:border-primary/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="diskon"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Diskon (contoh: 10%+5000+15%)
                    </Label>
                    <Input
                      id="diskon"
                      value={poFormData.diskon}
                      onChange={(e) =>
                        setPoFormData({
                          ...poFormData,
                          diskon: e.target.value,
                        })
                      }
                      placeholder="10%+5000+15%"
                      className="border-border focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="ppn"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      PPN (%)
                    </Label>
                    <Input
                      id="ppn"
                      type="number"
                      value={poFormData.ppn}
                      onChange={(e) =>
                        setPoFormData({ ...poFormData, ppn: e.target.value })
                      }
                      placeholder="11"
                      className="border-border focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="statusPengiriman"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Status Pengiriman
                    </Label>
                    <Select
                      value={poFormData.statusPengiriman}
                      onValueChange={(value) =>
                        setPoFormData({
                          ...poFormData,
                          statusPengiriman: value,
                        })
                      }
                    >
                      <SelectTrigger className="border-border focus:border-primary/50 bg-white">
                        <SelectValue placeholder="Pilih status pengiriman" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="Fabrikasi">Fabrikasi</SelectItem>
                        <SelectItem value="Indent Part">Indent Part</SelectItem>
                        <SelectItem value="Schedule">Schedule</SelectItem>
                        <SelectItem value="W/Payment">W/Payment</SelectItem>
                        <SelectItem value="W/Delivery">W/Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="statusPermintaan"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Kode
                    </Label>
                    <Select
                      value={poFormData.statusPermintaan}
                      onValueChange={(value) =>
                        setPoFormData({
                          ...poFormData,
                          statusPermintaan: value,
                        })
                      }
                    >
                      <SelectTrigger className="border-border focus:border-primary/50 bg-white">
                        <SelectValue placeholder="Pilih kode" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="FAB">FAB</SelectItem>
                        <SelectItem value="IND">IND</SelectItem>
                        <SelectItem value="SC">SC</SelectItem>
                        <SelectItem value="WDL">WDL</SelectItem>
                        <SelectItem value="WPY">WPY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="skema"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Skema
                  </Label>
                  <Input
                    id="skema"
                    value={poFormData.skema}
                    readOnly
                    disabled
                    className="border-border focus:border-primary/50 bg-muted"
                  />
                </div>
              </div>

              {/* Right Column - Items Table and Calculations */}
              <div className="space-y-4">
                {/* Items Table */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Detail Barang dari PR
                  </h3>
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-auto p-0 font-medium"
                                >
                                  No. PR
                                  <ChevronDown className="ml-1 h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Filter No. PR
                                  </Label>
                                  <Input
                                    placeholder="Cari No. PR..."
                                    value={filterNoPR}
                                    onChange={(e) =>
                                      setFilterNoPR(e.target.value)
                                    }
                                    className="w-full"
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TableHead>
                          <TableHead className="w-32">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-auto p-0 font-medium"
                                >
                                  Nama Barang
                                  <ChevronDown className="ml-1 h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Filter Nama Barang
                                  </Label>
                                  <Input
                                    placeholder="Cari nama barang..."
                                    value={filterNamaBarang}
                                    onChange={(e) =>
                                      setFilterNamaBarang(e.target.value)
                                    }
                                    className="w-full"
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TableHead>
                          <TableHead className="w-20">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-auto p-0 font-medium"
                                >
                                  Qty
                                  <ChevronDown className="ml-1 h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Filter Qty
                                  </Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      type="number"
                                      placeholder="Min"
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
                                      type="number"
                                      placeholder="Max"
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
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TableHead>
                          <TableHead className="w-24">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-auto p-0 font-medium"
                                >
                                  Satuan
                                  <ChevronDown className="ml-1 h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Filter Satuan
                                  </Label>
                                  <Input
                                    placeholder="Cari satuan..."
                                    value={satuanSearchTerm}
                                    onChange={(e) =>
                                      setSatuanSearchTerm(e.target.value)
                                    }
                                    className="w-full"
                                  />
                                  <div className="max-h-32 overflow-y-auto space-y-1">
                                    {uniqueSatuan
                                      .filter((satuan) =>
                                        satuan
                                          .toLowerCase()
                                          .includes(
                                            satuanSearchTerm.toLowerCase()
                                          )
                                      )
                                      .map((satuan) => (
                                        <div
                                          key={satuan}
                                          className="flex items-center space-x-2"
                                        >
                                          <Checkbox
                                            id={`satuan-${satuan}`}
                                            checked={filterSatuan.includes(
                                              satuan
                                            )}
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
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TableHead>
                          <TableHead className="w-28">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-auto p-0 font-medium"
                                >
                                  Harga Satuan
                                  <ChevronDown className="ml-1 h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Filter Harga Satuan
                                  </Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      type="number"
                                      placeholder="Min"
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
                                      type="number"
                                      placeholder="Max"
                                      value={filterHargaSatuanMax}
                                      onChange={(e) =>
                                        setFilterHargaSatuanMax(
                                          e.target.value === ""
                                            ? ""
                                            : Number(e.target.value)
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TableHead>
                          <TableHead className="w-28">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-auto p-0 font-medium"
                                >
                                  Total
                                  <ChevronDown className="ml-1 h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Filter Total
                                  </Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      type="number"
                                      placeholder="Min"
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
                                      type="number"
                                      placeholder="Max"
                                      value={filterTotalMax}
                                      onChange={(e) =>
                                        setFilterTotalMax(
                                          e.target.value === ""
                                            ? ""
                                            : Number(e.target.value)
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TableHead>
                          <TableHead className="w-40">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-auto p-0 font-medium"
                                >
                                  Keterangan
                                  <ChevronDown className="ml-1 h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Filter Keterangan
                                  </Label>
                                  <Input
                                    placeholder="Cari keterangan..."
                                    value={filterKeterangan}
                                    onChange={(e) =>
                                      setFilterKeterangan(e.target.value)
                                    }
                                    className="w-full"
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TableHead>
                          <TableHead className="w-32">Dibuat Oleh</TableHead>
                          <TableHead className="w-32">Skema</TableHead>{" "}
                          {/* <-- add Skema column */}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.noPR}
                            </TableCell>
                            <TableCell>{item.namaBarang}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max={item.jumlahAsli}
                                value={item.jumlahPO}
                                onChange={(e) => {
                                  const newQty = Math.min(
                                    Math.max(0, parseInt(e.target.value) || 0),
                                    item.jumlahAsli
                                  );
                                  setPoItems(
                                    poItems.map((pItem) =>
                                      pItem.prId === item.prId
                                        ? {
                                            ...pItem,
                                            items: pItem.items.map((i) =>
                                              i.id === item.id
                                                ? { ...i, jumlahPO: newQty }
                                                : i
                                            ),
                                          }
                                        : pItem
                                    )
                                  );
                                }}
                                className="w-16 border-border focus:border-primary/50"
                              />
                            </TableCell>
                            <TableCell>{item.satuan}</TableCell>
                            <TableCell>
                              <Input
                                type="text"
                                value={item.hargaSatuan.toLocaleString("id-ID")}
                                onChange={(e) => {
                                  // Remove dots and commas for parsing
                                  const cleanValue = e.target.value.replace(
                                    /[.,]/g,
                                    ""
                                  );
                                  const newPrice = Math.max(
                                    0,
                                    parseInt(cleanValue) || 0
                                  );
                                  setPoItems(
                                    poItems.map((pItem) =>
                                      pItem.prId === item.prId
                                        ? {
                                            ...pItem,
                                            items: pItem.items.map((i) =>
                                              i.id === item.id
                                                ? {
                                                    ...i,
                                                    hargaSatuan: newPrice,
                                                  }
                                                : i
                                            ),
                                          }
                                        : pItem
                                    )
                                  );
                                }}
                                className="w-32 text-right border-border focus:border-primary/50"
                                placeholder="0"
                              />
                            </TableCell>
                            <TableCell>
                              Rp{" "}
                              {(
                                item.hargaSatuan * item.jumlahPO
                              ).toLocaleString("id-ID")}
                            </TableCell>
                            <TableCell>
                              <Textarea
                                value={item.keterangan || ""}
                                onChange={(e) => {
                                  const newKeterangan = e.target.value;
                                  setPoItems(
                                    poItems.map((pItem) =>
                                      pItem.prId === item.prId
                                        ? {
                                            ...pItem,
                                            items: pItem.items.map((i) =>
                                              i.id === item.id
                                                ? {
                                                    ...i,
                                                    keterangan: newKeterangan,
                                                  }
                                                : i
                                            ),
                                          }
                                        : pItem
                                    )
                                  );
                                }}
                                className="w-full border-border focus:border-primary/50 resize-none"
                                rows={2}
                                placeholder="Masukkan keterangan"
                              />
                            </TableCell>
                            <TableCell>{item.dibuatOleh}</TableCell>
                            <TableCell>{item.skema}</TableCell>{" "}
                            {/* <-- show skema value */}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Pagination for items table */}
                  <Pagination className="mt-2">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : ""
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
                            setCurrentPage(
                              Math.min(totalPages, currentPage + 1)
                            )
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
                </div>
                {/* Calculation Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Ringkasan Perhitungan
                  </h3>
                  <div className="border rounded-lg p-4 space-y-3">
                    {(() => {
                      const calculations = calculateTotal();
                      return (
                        <>
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>
                              Rp {calculations.subtotal.toLocaleString("id-ID")}
                            </span>
                          </div>

                          {discountBreakdown.length > 0 && (
                            <div className="space-y-1">
                              <span>Diskon:</span>
                              {discountBreakdown.map((discount, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between text-sm text-destructive"
                                >
                                  <span>
                                    - {discount.label} ({discount.value}):
                                  </span>
                                  <span>
                                    -Rp{" "}
                                    {discount.amount.toLocaleString("id-ID")}
                                  </span>
                                </div>
                              ))}
                              <div className="flex justify-between font-medium">
                                <span>Total Diskon:</span>
                                <span className="text-destructive">
                                  -Rp{" "}
                                  {calculations.totalDiscount.toLocaleString(
                                    "id-ID"
                                  )}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between">
                            <span>PPN ({poFormData.ppn}%):</span>
                            <span className="text-success">
                              +Rp{" "}
                              {calculations.ppnAmount.toLocaleString("id-ID")}
                            </span>
                          </div>

                          {/* Tambahkan baris PPN (Rp) */}
                          <div className="flex justify-between">
                            <span>PPN (Rp):</span>
                            <span>
                              Rp{" "}
                              {calculations.ppnAmount.toLocaleString("id-ID")}
                            </span>
                          </div>

                          <hr className="my-2" />

                          <div className="flex justify-between text-lg font-bold">
                            <span>Total Pembayaran:</span>
                            <span className="text-primary">
                              Rp{" "}
                              {calculations.totalPayment.toLocaleString(
                                "id-ID"
                              )}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/po/status")}
                className="border-border hover:bg-muted/50"
              >
                Batal
              </Button>
              <Button
                onClick={handleCreatePO}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Buat PO
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
