"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/app/pr/input-baru/datepicker-red-weekend.css";

// import type React from "react"; // DUPLICATE REMOVED

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
import { Edit2, Trash2, Plus } from "lucide-react";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { API_BASE_URL } from "@/lib/config";

function InputPOContent() {
  const [prData, setPrData] = useState<PRData[]>([]);
  const [poData, setPoData] = useState<POData[]>([]);

  // PO Form state
  const [poFormData, setPoFormData] = useState({
    noPO: "",
    tanggalPO: new Date() as Date | null, // Default to Today
    supplier: "",
    estimasiTanggalDiterima: null as Date | null,
    diskon: "",
    ppn: "",
    statusPengiriman: "",
    skema: "",
    namaPembeli: "", // <-- Tambahkan state namaPembeli
    termin: "", // <-- Tambahkan state termin
  });

  // Helper date formatter needed inside component or accessible
  function formatDateForBackend(date: Date | null) {
    if (!date) return null;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const [userSkema, setUserSkema] = useState("");

  const searchParams = useSearchParams();
  const editPoId = searchParams.get("id");
  const isEditing = !!editPoId;

  // ... (rest of state) ...

  // Auto-fill PO Number on Skema/Date change (Only when creating)
  useEffect(() => {
    if (isEditing) return; // Ignore if editing existing PO

    const { skema: id_skema, tanggalPO, noPO } = poFormData;
    // Note: poFormData.skema is used here, ensure it is populated from user/selection
    if (!id_skema || !tanggalPO) return;

    // Guard: Only auto-fill if field is empty OR looks like a standard format "PO..."
    const isEmpryOrStandard = !noPO || noPO.startsWith("PO");
    if (!isEmpryOrStandard) return;

    const fetchNextNumber = async () => {
      try {
        const dateParam = formatDateForBackend(tanggalPO);
        if (!dateParam) return;

        const res = await fetch(`${API_BASE_URL}/api/po/next-number?id_skema=${id_skema}&tanggalPO=${dateParam}`);
        if (res.ok) {
          const data = await res.json();
          if (data.nextNoPO) {
            setPoFormData(prev => ({ ...prev, noPO: data.nextNoPO }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch next PO number", err);
      }
    };

    fetchNextNumber();
  }, [poFormData.skema, poFormData.tanggalPO, isEditing]);

  // Tambahkan state untuk checkbox "Harga sudah termasuk PPN"
  const [ppnIncluded, setPpnIncluded] = useState(false);


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
          diskonItem: string; // now string, e.g. "10%+5000+2%"
          ppnItem: number | ""; // per item
          skema: string;
          dibuatOleh: string;
          id_satuan: string;
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
  // const itemsPerPage = 10;
  // const [currentPage, setCurrentPage] = useState(1);

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

  // Tambahkan parser dan sorter PR (copy dari status/page.tsx)
  function parseNoPR(noPR: string | null | undefined) {
    if (!noPR || typeof noPR !== "string") return null;
    const s = noPR.trim().toUpperCase();
    const regex = /^PR\/(E-?WALK|PRQ)\/(\d{2})\/([IVXLCDM]{1,4})\/(\d{1,5})$/;
    const match = s.match(regex);
    if (!match) return null;
    const [, brand, tahun2, bulanRomawi, urutStr] = match;
    const bulanMap: Record<string, number> = {
      I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
      VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12,
    };
    const bulan = bulanMap[bulanRomawi] ?? 0;
    const tahun = 2000 + parseInt(tahun2, 10);
    const urut = parseInt(urutStr, 10);
    return { tahun, bulan, urut, brand };
  }
  function sortPRListByNoPRDesc(poItems: any[]) {
    const allValid = poItems.every((poItem) => typeof poItem.noPR === "string" && parseNoPR(poItem.noPR));
    if (allValid) {
      // Urutkan dari terlama ke terbaru (tahun, bulan, urut ASC)
      return [...poItems].sort((a, b) => {
        const pa = parseNoPR(a.noPR)!;
        const pb = parseNoPR(b.noPR)!;
        if (pa.tahun !== pb.tahun) return pa.tahun - pb.tahun;
        if (pa.bulan !== pb.bulan) return pa.bulan - pb.bulan;
        return pa.urut - pb.urut;
      });
    }
    return [...poItems];
  }

  // Filtered PO items
  const filteredPOItems = sortPRListByNoPRDesc(
    poItems
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
      .filter((poItem) => poItem.items.length > 0)
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

  // Fungsi parsing diskon persen (stacked, e.g. "10%+5%")
  function parseDiscountPersen(diskonPersen: string) {
    if (!diskonPersen || typeof diskonPersen !== "string") return [];
    return diskonPersen
      .split("+")
      .map((d) => d.trim())
      .filter((d) => d.endsWith("%"))
      .map((d) => {
        const val = parseFloat(d.replace("%", ""));
        return isNaN(val) ? null : val;
      })
      .filter((v) => v !== null) as number[];
  }

  // Fungsi parsing diskon nominal (tidak di-stack, hanya satu, e.g. "5000")
  function parseDiskonNominal(diskonNominal: string) {
    if (!diskonNominal || typeof diskonNominal !== "string") return 0;
    const val = parseFloat(diskonNominal.replace(/[^\d]/g, ""));
    return isNaN(val) ? 0 : val;
  }

  // Helper untuk menentukan mode diskon (persen/nominal) with default empty map
  function getDiskonMode(item: any, prId: string, lastMap: any = {}) {
    const key = prId + "-" + item.id;
    if (lastMap && lastMap[key]) return lastMap[key];

    // Fallback logic
    const p = item.diskonPersen || "";
    const n = item.diskonNominal || "";
    // Jika persen ada isi valid (misal "10%"), prefer persen
    if (p && p !== "0" && p !== "0%" && p !== "") return "persen";
    // Jika nominal ada isi valid (misal "5000"), gunakan nominal
    if (n && n !== "0" && n !== "") return "nominal";

    return "none";
  }

  // Helper hitung nominal diskon dari string persen
  function calculateDiskonModelPersen(subtotal: number, diskonPersenStr: string) {
    let currentAmount = subtotal;
    let totalDiskon = 0;
    const diskonPersenArr = (diskonPersenStr || "")
      .split("+")
      .map((d) => d.trim())
      .filter((d) => d.endsWith("%"))
      .map((d) => {
        const val = parseFloat(d.replace("%", "").replace(",", "."));
        return isNaN(val) ? null : val;
      })
      .filter((v) => v !== null) as number[];

    diskonPersenArr.forEach((persen) => {
      const amount = currentAmount * (persen / 100);
      totalDiskon += amount;
      currentAmount -= amount;
    });
    return totalDiskon;
  }

  const [lastDiskonChanged, setLastDiskonChanged] = useState<Record<string, "persen" | "nominal">>({});

  // Calculation functions
  const calculateTotal = () => {
    let subtotal = 0;
    let totalDiskon = 0;
    let totalPPN = 0;
    let totalPayment = 0;
    const breakdown: Array<{
      namaBarang: string;
      hargaSatuan: number;
      jumlahPO: number;
      diskonPersen: string;
      diskonNominal: string;
      ppnItem: number;
      subtotal: number;
      diskonAmount: number;
      ppnAmount: number;
      total: number;
      diskonBreakdown: Array<{ label: string; value: string; amount: number }>;
    }> = [];

    poItems.forEach((poItem) => {
      poItem.items.forEach((item: any) => {
        // Parse hargaSatuan as float, support comma/period
        let harga = 0;
        if (typeof item.hargaSatuan === "string") {
          // Robust cleaning: remove "Rp.", dots, spaces. keep comma.
          const cleanString = item.hargaSatuan.replace(/[^0-9,]/g, "");
          const normalized = cleanString.replace(",", ".");
          harga = parseFloat(normalized) || 0;
        } else {
          harga = Number(item.hargaSatuan) || 0;
        }
        const qty = Number(item.jumlahPO) || 0;
        const ppn = parseFloat(String(item.ppnItem).replace("%", "")) || 0;
        const itemSubtotal = harga * qty;

        // Determine mode using helper - use current state logic if available or passed param
        const mode = getDiskonMode(item, poItem.prId, lastDiskonChanged);
        let diskonAmount = 0;
        let diskonBreakdown: Array<{
          label: string;
          value: string;
          amount: number;
        }> = [];

        if (mode === "persen") {
          // Hitung dari persen (stacked)
          diskonAmount = calculateDiskonModelPersen(itemSubtotal, item.diskonPersen);

          // Generate breakdown for tooltip/display
          let currentBreakdown = itemSubtotal;
          const diskonPersenArr = (item.diskonPersen || "")
            .split("+")
            .map((d: any) => d.trim())
            .filter((d: any) => d.endsWith("%"))
            .map((d: any) => {
              const val = parseFloat(d.replace("%", "").replace(",", "."));
              return isNaN(val) ? null : val;
            })
            .filter((v: any) => v !== null) as number[];

          diskonPersenArr.forEach((persen, idx) => {
            const amount = currentBreakdown * (persen / 100);
            currentBreakdown -= amount;
            diskonBreakdown.push({
              label: `Diskon % ke-${idx + 1}`,
              value: persen + "%",
              amount: amount
            });
          });

        } else if (mode === "nominal") {
          // Support decimal nominal
          diskonAmount = parseFloat(
            String(item.diskonNominal).replace(",", ".")
          ) || 0;
          if (diskonAmount > 0) {
            diskonBreakdown.push({
              label: "Diskon Rp.",
              value: diskonAmount.toLocaleString("id-ID"),
              amount: diskonAmount,
            });
          }
        } else {
          diskonAmount = 0;
        }

        const afterDiskon = Math.max(0, itemSubtotal - diskonAmount);

        // --- LOGIKA BARU (FIXED): Handle PPN Inclusive/Exclusive correctly ---
        let ppnAmount = 0;
        let subtotalItem = 0; // This is the DPP (Dasar Pengenaan Pajak) / taxable amount
        let total = 0; // This is the final amount to pay (Item + Tax)

        if (ppnIncluded) {
          total = afterDiskon;
          subtotalItem = total / (1 + (ppn / 100));
          ppnAmount = total - subtotalItem;
        } else {
          subtotalItem = afterDiskon;
          ppnAmount = subtotalItem * (ppn / 100);
          total = subtotalItem + ppnAmount;
        }

        subtotal += subtotalItem;
        totalDiskon += diskonAmount;
        totalPPN += ppnAmount;
        totalPayment += total;

        breakdown.push({
          namaBarang: item.namaBarang,
          hargaSatuan: harga,
          jumlahPO: qty,
          diskonPersen: item.diskonPersen || "",
          diskonNominal: item.diskonNominal || "",
          ppnItem: ppn,
          subtotal: subtotalItem,
          diskonAmount,
          ppnAmount,
          total,
          diskonBreakdown,
        });
      });
    });

    return {
      subtotal,
      totalDiskon,
      totalPPN,
      totalPayment,
      breakdown,
    };
  };

  const [notif, setNotif] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Tambahkan state untuk dropdown supplier, status pengiriman, kode
  const [supplierOptions, setSupplierOptions] = useState<any[]>([]);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState("");

  const [statusPengirimanOptions, setStatusPengirimanOptions] = useState<any[]>(
    []
  );
  const [statusPengirimanSearch, setStatusPengirimanSearch] = useState("");
  const [showAddStatusPengiriman, setShowAddStatusPengiriman] = useState(false);
  const [newStatusPengiriman, setNewStatusPengiriman] = useState("");

  // Tambahkan state untuk edit/hapus supplier/status pengiriman
  const [editSupplierId, setEditSupplierId] = useState<string | null>(null);
  const [editSupplierValue, setEditSupplierValue] = useState("");
  const [editStatusPengirimanId, setEditStatusPengirimanId] = useState<
    string | null
  >(null);
  const [editStatusPengirimanValue, setEditStatusPengirimanValue] =
    useState("");

  // Tambahkan state untuk termin
  const [terminOptions, setTerminOptions] = useState<any[]>([]);
  const [terminSearch, setTerminSearch] = useState("");
  const [showAddTermin, setShowAddTermin] = useState(false);
  const [newTermin, setNewTermin] = useState("");
  const [editTerminId, setEditTerminId] = useState<string | null>(null);
  const [editTerminValue, setEditTerminValue] = useState("");

  // Fetch supplier, status_pengiriman, status_permintaan, termin dari backend
  useEffect(() => {
    // ... REST IS SAME ...
    fetch(API_BASE_URL + "/api/supplier")
      .then((res) => res.json())
      .then((data) => setSupplierOptions(data));
    fetch(API_BASE_URL + "/api/status-pengiriman")
      .then((res) => res.json())
      .then((data) => setStatusPengirimanOptions(data));
    fetch(API_BASE_URL + "/api/termin")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTerminOptions(data);
        } else {
          console.error("API /termin did not return an array:", data);
          setTerminOptions([]);
        }
      })
      .catch(err => {
        console.error("Failed to fetch termin:", err);
        setTerminOptions([]);
      });
  }, []);

  // Handler tambah supplier
  const handleAddSupplier = async () => {
    if (!newSupplier.trim()) return;
    const res = await fetch(API_BASE_URL + "/api/supplier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ namaSupplier: newSupplier }),
    });
    if (res.ok) {
      const data = await res.json();
      setSupplierOptions((prev) => [...prev, data]);
      setPoFormData((prev) => ({ ...prev, supplier: data.id_supplier }));
      setShowAddSupplier(false);
      setNewSupplier("");
    }
  };

  // Handler tambah status pengiriman
  const handleAddStatusPengiriman = async () => {
    if (!newStatusPengiriman.trim()) return;
    const res = await fetch(API_BASE_URL + "/api/status-pengiriman", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status_pengiriman: newStatusPengiriman }),
    });
    if (res.ok) {
      const data = await res.json();
      setStatusPengirimanOptions((prev) => [...prev, data]);
      setPoFormData((prev) => ({
        ...prev,
        statusPengiriman: data.id_statusPengiriman,
      }));
      setShowAddStatusPengiriman(false);
      setNewStatusPengiriman("");
    }
  };

  // Handler edit supplier
  const handleEditSupplier = async (id: string) => {
    if (!editSupplierValue.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/supplier/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaSupplier: editSupplierValue }),
      });
      if (res.ok) {
        fetch(API_BASE_URL + "/api/supplier")
          .then((res) => res.json())
          .then((data) => setSupplierOptions(data));
        setEditSupplierId(null);
        setEditSupplierValue("");
      }
    } catch { }
  };

  // Handler hapus supplier
  const handleDeleteSupplier = async (id: string) => {
    if (!id) return;
    if (!window.confirm("Yakin ingin menghapus supplier ini?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/supplier/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetch(API_BASE_URL + "/api/supplier")
          .then((res) => res.json())
          .then((data) => setSupplierOptions(data));
      }
    } catch { }
  };

  // Handler edit status pengiriman
  const handleEditStatusPengiriman = async (id: string) => {
    if (!editStatusPengirimanValue.trim()) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/status-pengiriman/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status_pengiriman: editStatusPengirimanValue,
          }),
        }
      );
      if (res.ok) {
        fetch(API_BASE_URL + "/api/status-pengiriman")
          .then((res) => res.json())
          .then((data) => setStatusPengirimanOptions(data));
        setEditStatusPengirimanId(null);
        setEditStatusPengirimanValue("");
      }
    } catch { }
  };

  // Handler hapus status pengiriman
  const handleDeleteStatusPengiriman = async (id: string) => {
    if (!id) return;
    if (!window.confirm("Yakin ingin menghapus status pengiriman ini?")) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/status-pengiriman/${id}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        fetch(API_BASE_URL + "/api/status-pengiriman")
          .then((res) => res.json())
          .then((data) => setStatusPengirimanOptions(data));
      }
    } catch { }
  };

  // Handler tambah termin
  const handleAddTermin = async () => {
    if (!newTermin.trim()) return;
    const res = await fetch(API_BASE_URL + "/api/termin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ termin: newTermin }),
    });
    if (res.ok) {
      const data = await res.json();
      setTerminOptions((prev) => [...prev, data]);
      setPoFormData((prev) => ({ ...prev, termin: data.id_termin || data.id }));
      setShowAddTermin(false);
      setNewTermin("");
    }
  };

  // Handler edit termin
  const handleEditTermin = async (id: string) => {
    if (!editTerminValue.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/termin/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termin: editTerminValue }),
      });
      if (res.ok) {
        fetch(API_BASE_URL + "/api/termin")
          .then((res) => res.json())
          .then((data) => setTerminOptions(data));
        setEditTerminId(null);
        setEditTerminValue("");
      }
    } catch { }
  };

  // Handler hapus termin
  const handleDeleteTermin = async (id: string) => {
    if (!id) return;
    if (!window.confirm("Yakin ingin menghapus termin ini?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/termin/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetch(API_BASE_URL + "/api/termin")
          .then((res) => res.json())
          .then((data) => {
            setTerminOptions(data);
            // Reset jika yang dihapus sedang dipilih
            if (String(poFormData.termin) === String(id)) {
              setPoFormData(prev => ({ ...prev, termin: "" }));
            }
          });
      }
    } catch { }
  };

  // Handler submit PO
  const handleCreatePO = async () => {
    // Pastikan tidak sedang menambah supplier/status pengiriman
    if (showAddSupplier || showAddStatusPengiriman) {
      setNotif({
        type: "error",
        message:
          "Selesaikan penambahan Supplier/Status Pengiriman terlebih dahulu sebelum menyimpan PO.",
      });
      setTimeout(() => setNotif(null), 2500);
      return;
    }
    // Perbaiki pengecekan supplier agar tidak error jika supplier bukan string
    if (
      !poFormData.supplier ||
      (typeof poFormData.supplier === "string" && poFormData.supplier.trim() === "")
    ) {
      setNotif({ type: "error", message: "Supplier harus diisi!" });
      setTimeout(() => setNotif(null), 2500);
      return;
    }
    const namaPembeli = poFormData.namaPembeli;
    if (!namaPembeli || (typeof namaPembeli === 'string' && !namaPembeli.trim())) {
      setNotif({ type: "error", message: "Nama Pembeli wajib diisi!" });
      setTimeout(() => setNotif(null), 2500);
      return;
    }
    if (poItems.length === 0) {
      setNotif({ type: "error", message: "Minimal satu item harus dipilih!" });
      setTimeout(() => setNotif(null), 2500);
      return;
    }

    const calculations = calculateTotal();

    // Ambil data user dari localStorage untuk orderedBy (ID)
    const userDataLocal = JSON.parse(localStorage.getItem("userData") || "{}");
    const orderedById = userDataLocal.id_user || userDataLocal.id || null; // Send ID not Name

    const payloadHeader = {
      noPO: poFormData.noPO,
      tanggalPO: formatDateForBackend(poFormData.tanggalPO),
      id_supplier: poFormData.supplier,
      diskon: calculations.totalDiskon,
      originalDiskon: 0,
      ppn: 0,
      ppnAmount: calculations.totalPPN,
      totalPembayaran: calculations.totalPayment,
      orderedBy: orderedById, // <-- Send ID here
      estimasiTanggalTerima: formatDateForBackend(
        poFormData.estimasiTanggalDiterima
      ),
      id_statusPengiriman: poFormData.statusPengiriman,
      id_statusPermintaan: null,
      status: "Menunggu",
      id_skema: poFormData.skema,
      id_termin: poFormData.termin || null,
    };

    try {
      let poId = editPoId;

      if (isEditing && poId) {
        // --- UPDATE EXISTING PO ---
        const updateRes = await fetch(`${API_BASE_URL}/api/po/${poId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadHeader),
        });

        if (!updateRes.ok) {
          const err = await updateRes.json().catch(() => ({}));
          throw new Error(err.message || "Gagal update PO");
        }

        // Loop items to update directly
        let breakdownIndex = 0;

        for (const pGroup of poItems) {
          for (const item of pGroup.items) {
            const calcValues = calculations.breakdown[breakdownIndex];
            breakdownIndex++;
            if (!calcValues) continue;

            const harga =
              typeof item.hargaSatuan === "string"
                ? parseFloat(item.hargaSatuan.replace(/[^0-9,]/g, "").replace(",", "."))
                : item.hargaSatuan;

            const itemPayload = {
              hargaSatuan: harga,
              jumlahPO: Number(item.jumlahPO), // Ensure Number to prevent backend regex issues
              jumlahAsli: Number(item.jumlahPO), // Use input Qty (not max limit)
              diskonPersen: item.diskonPersen || "0",
              diskonRupiah: calcValues.diskonAmount || 0,
              ppnPersen: item.ppnItem || 0,
              ppnRupiah: calcValues.ppnAmount || 0,
              totalPerItem: calcValues.total || 0,
              namaPembeli: poFormData.namaPembeli,
              barang: item.namaBarang || "", // Send as 'barang' or 'namaBarang' - backend po_item might expect one, typically namaBarang
              namaBarang: item.namaBarang || "", // Explicitly send namaBarang
              keterangan: item.keterangan || "",
              id_satuan: item.id_satuan,
            };

            if (item.id_POItem) {
              // UPDATE PO ITEM
              await fetch(`${API_BASE_URL}/api/po-item/${item.id_POItem}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(itemPayload),
              });
            } else {
              // Ignore new items for now in this flow
            }
          }
        }

        setNotif({ type: "success", message: "PO berhasil diperbarui!" });
        setTimeout(() => {
          window.location.href = "/po/status";
        }, 1500);

      } else {
        // --- CREATE NEW PO ---
        const res = await fetch(API_BASE_URL + "/api/po", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadHeader),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Gagal membuat PO");
        }
        const newPoId = data.id_PO || data.insertId;

        // Create PO Items
        let breakdownIndex = 0;
        for (const pGroup of poItems) {
          for (const item of pGroup.items) {
            const calcValues = calculations.breakdown[breakdownIndex];
            breakdownIndex++;
            if (!calcValues) continue;

            const harga =
              typeof item.hargaSatuan === "string"
                ? parseFloat(item.hargaSatuan.replace(/[^0-9,]/g, "").replace(",", "."))
                : item.hargaSatuan;

            const itemPayload = {
              id_PO: newPoId,
              id_PRItem: item.id,
              hargaSatuan: harga,
              jumlahPO: Number(item.jumlahPO), // Ensure Number
              jumlahAsli: Number(item.jumlahPO), // Use input Qty
              diskonPersen: item.diskonPersen || "0",
              diskonRupiah: calcValues.diskonAmount || 0,
              ppnPersen: item.ppnItem || 0,
              ppnRupiah: calcValues.ppnAmount || 0,
              totalPerItem: calcValues.total || 0,
              namaPembeli: poFormData.namaPembeli,
              keterangan: item.keterangan || "",
              id_satuan: item.id_satuan,
            };

            await fetch(API_BASE_URL + "/api/po-item", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(itemPayload),
            });

            // UPDATE PR ITEM REMAINING
            const prevQty = item.quantityAwalPR ?? item.jumlahAsli;
            const newRem = Math.max(0, prevQty - item.jumlahPO);

            await fetch(`${API_BASE_URL}/api/pr-item/${item.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jumlah: newRem })
            });
          }
        }

        localStorage.removeItem("selectedPRsForPO");
        setNotif({ type: "success", message: "PO berhasil dibuat!" });
        setTimeout(() => {
          window.location.href = "/po/status";
        }, 1500);
      }
    } catch (err: any) {
      if (err.message?.includes("digunakan")) {
        console.warn("Validation error:", err.message);
      } else {
        console.error("Error creating PO:", err);
      }
      setNotif({ type: "error", message: err.message || "Gagal menyimpan PO" });
    }
  };

  useEffect(() => {
    // Ganti loadData dengan fetch dari backend
    const fetchPRData = async () => {
      // Fetch referensi satuan/divisi/urgensi jika perlu (optional)
      // Fetch PR utama
      const prRes = await fetch(API_BASE_URL + "/api/pr");
      const prList = await prRes.json();
      // Fetch PR item
      const prItemRes = await fetch(API_BASE_URL + "/api/pr-item");
      const prItemList = await prItemRes.json();

      // --- FIX: jangan pakai satuanMap di sini, hanya gunakan label/id langsung ---
      const prDataMapped = prList.map((pr: any) => {
        const items = prItemList
          .filter((item: any) => String(item.id_PR) === String(pr.id_PR))
          .map((item: any) => ({
            namaBarang: item.namaBarang,
            jumlah: item.jumlah,
            quantityAwalPR:
              item.quantityAwalPR ?? item.originalJumlah ?? item.jumlah,
            satuan: item.satuanLabel || item.id_satuan, // <-- only use label/id
            satuanLabel: item.satuanLabel || "", // <-- only use label
            id_satuan: item.id_satuan, // <-- keep id_satuan from backend
            keterangan: item.keterangan,
            id: item.id_PRItem,
            status: item.status || "",
          }));

        return {
          id: pr.id_PR,
          noPR: pr.noPR,
          tanggalPR: pr.tanggalPR,
          items,
          urgensi: pr.urgensiLabel || pr.id_urgensi,
          divisi: pr.divisiLabel || pr.id_divisi,
          status: pr.status,
          dibuatOleh: pr.dibuatOleh,
          skema: pr.id_skema,
          skemaLabel: pr.skemaLabel ?? "",
        };
      });

      // Selalu gunakan data dari backend, jangan dari localStorage
      setPrData(prDataMapped);
    };

    fetchPRData();

    // Ambil skema dari userData
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const userSkemaVal = userData.skema || "";
    setUserSkema(userSkemaVal);
    setPoFormData((prev) => ({
      ...prev,
      skema: userSkemaVal,

      // Set namaPembeli default to logged-in user ONLY if creating new PO
      // Set namaPembeli default to empty string if creating new PO (User Request)
      namaPembeli: !isEditing ? "" : prev.namaPembeli,
    }));
  }, []);

  const savePOData = (data: POData[]) => {
    localStorage.setItem("poData", JSON.stringify(data));
    setPoData(data);
  };

  // Update discount breakdown when discount changes
  useEffect(() => {
    const calculations = calculateTotal();
    // setDiscountBreakdown(calculations.breakdown);
  }, [poFormData.diskon, poItems]);

  // Dummy state for selectedPRsForPO to satisfy TypeScript
  // const [selectedPRsForPO, setSelectedPRsForPO] = useState<any[]>([]); // HAPUS BARIS INI

  // Tambahkan state untuk referensi urgensi/divisi/satuan
  const [divisiOptions, setDivisiOptions] = useState<any[]>([]);
  const [urgensiOptions, setUrgensiOptions] = useState<any[]>([]);
  const [satuanOptions, setSatuanOptions] = useState<any[]>([]);

  useEffect(() => {
    // Fetch referensi dari backend
    fetch(API_BASE_URL + "/api/divisi")
      .then((res) => res.json())
      .then((data) => setDivisiOptions(data));
    fetch(API_BASE_URL + "/api/urgensi")
      .then((res) => res.json())
      .then((data) => setUrgensiOptions(data));
    fetch(API_BASE_URL + "/api/satuan")
      .then((res) => res.json())
      .then((data) => setSatuanOptions(data));
  }, []);

  useEffect(() => {
    const fetchPRData = async () => {
      // Tunggu referensi sudah didapat
      if (
        divisiOptions.length === 0 ||
        urgensiOptions.length === 0 ||
        satuanOptions.length === 0
      )
        return;

      // Fetch PR utama
      const prRes = await fetch(API_BASE_URL + "/api/pr");
      const prList = await prRes.json();
      // Fetch PR item
      const prItemRes = await fetch(API_BASE_URL + "/api/pr-item");
      const prItemList = await prItemRes.json();

      // Helper mapping dari id ke label
      const satuanMap = Object.fromEntries(
        satuanOptions.map((s: any) => [String(s.id_satuan), s.satuan])
      );
      const divisiMap = Object.fromEntries(
        divisiOptions.map((d: any) => [String(d.id_divisi), d.divisi])
      );
      const urgensiMap = Object.fromEntries(
        urgensiOptions.map((u: any) => [String(u.id_urgensi), u.urgensi])
      );

      // Mapping PR dan item (sama seperti monitoring PR)
      const prDataMapped = prList.map((pr: any) => {
        const items = prItemList
          .filter((item: any) => String(item.id_PR) === String(pr.id_PR))
          .map((item: any) => ({
            namaBarang: item.namaBarang,
            jumlah: item.jumlah,
            quantityAwalPR:
              item.quantityAwalPR ?? item.originalJumlah ?? item.jumlah,
            satuan:
              satuanMap[String(item.id_satuan)] ||
              item.satuanLabel ||
              item.id_satuan,
            satuanLabel:
              item.satuanLabel || satuanMap[String(item.id_satuan)] || "", // <-- keep label
            id_satuan: item.id_satuan, // <-- keep id_satuan from backend
            keterangan: item.keterangan,
            id: item.id_PRItem,
            status: item.status || "",
          }));

        return {
          id: pr.id_PR,
          noPR: pr.noPR,
          tanggalPR: pr.tanggalPR,
          items,
          urgensi:
            urgensiMap[String(pr.id_urgensi)] ||
            pr.urgensiLabel ||
            pr.id_urgensi,
          divisi:
            divisiMap[String(pr.id_divisi)] || pr.divisiLabel || pr.id_divisi,
          status: pr.status,
          dibuatOleh: pr.dibuatOleh,
          skema: pr.id_skema,
          skemaLabel: pr.skemaLabel ?? "",
        };
      });
      setPrData(prDataMapped);
    };

    fetchPRData();
  }, [divisiOptions, urgensiOptions, satuanOptions]);

  // Badge untuk urgensi
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

  // Badge untuk status
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

  useEffect(() => {
    // Ambil PR yang dipilih dari localStorage dan mapping ke poItems
    const selectedFromStatus = localStorage.getItem("selectedPRsForPO");
    if (selectedFromStatus && !isEditing) {
      try {
        const selectedPRData = JSON.parse(selectedFromStatus);

        // --- NEW LOGIC: Set skema from first PR ---
        if (selectedPRData.length > 0) {
          const firstSkema = selectedPRData[0].id_skema || selectedPRData[0].skema || "";
          setPoFormData((prev) => ({ ...prev, skema: String(firstSkema) }));
        }

        setPoItems(
          selectedPRData.map((pr: any) => ({
            prId: pr.id_PR ?? pr.id,
            noPR: pr.noPR,
            tanggalPR: pr.tanggalPR,
            skema: pr.id_skema ?? "",
            items: (pr.items || []).map((item: any) => ({
              id: item.id_PRItem ?? item.id,
              namaBarang: item.namaBarang ?? item.namabarang ?? "",
              jumlahPO: item.jumlah,
              jumlahAsli: item.jumlah,
              satuanLabel: item.satuanLabel || item.satuan || "",
              id_satuan: item.id_satuan ?? item.idSatuan ?? null,
              hargaSatuan: "",
              diskonItem: "", // default string
              ppnItem: "", // <-- ubah default dari 11 ke ""
              keterangan: item.keterangan ?? "",
              skema: pr.id_skema ?? "",
              dibuatOleh: pr.dibuatOleh ?? "",
              tanggalPR: pr.tanggalPR,
            })),
          }))
        );
      } catch (err) {
        setPoItems([]);
      }
    } else if (isEditing && editPoId) {
      // FETCH EXISTING PO DATA
      const fetchEditData = async () => {
        try {
          // 1. Fetch Header PO
          const poRes = await fetch(`${API_BASE_URL}/api/po/${editPoId}`);
          const poData = await poRes.json();
          if (poData) {
            setPoFormData({
              noPO: poData.noPO,
              // Convert stored YYYY-MM-DD back to Date object
              tanggalPO: poData.tanggalPO ? new Date(poData.tanggalPO) : null,
              supplier: String(poData.id_supplier), // ensure string for Select
              estimasiTanggalDiterima: poData.estimasiTanggalTerima
                ? new Date(poData.estimasiTanggalTerima)
                : null,
              diskon: poData.diskonPersen || "", // Assuming backend name or logic
              ppn: poData.ppn || "",
              statusPengiriman: String(poData.id_statusPengiriman),
              skema: poData.id_skema,
              namaPembeli: "", // Don't use orderedBy (account name), wait for item data
              termin: poData.id_termin ? String(poData.id_termin) : "", // <-- Set termin for edit
            });
            // Update ppnIncluded? Backend doesn't explicitly store it as boolean commonly, usually inferred.
            // But let's check if we can infer or if we need to assume default.
            // If calculations match, good. For now assume user can set it.
            // Actually, we can check if totalPembayaran == subtotal (ppnIncluded) or > subtotal.
          }

          // 2. Fetch PO Items
          const itemsRes = await fetch(API_BASE_URL + "/api/po-item");
          const allItems = await itemsRes.json();
          const currentPoItems = allItems.filter(
            (item: any) => String(item.id_PO) === String(editPoId)
          );

          // 3. We typically need PR info for these items to group them.
          // Since existing structure expects grouping by PR.
          // We can fetch PR Items to link back `id_PR`.
          const prItemRes = await fetch(API_BASE_URL + "/api/pr-item");
          const allPrItems = await prItemRes.json();

          const prRes = await fetch(API_BASE_URL + "/api/pr");
          const allPrs = await prRes.json();

          // Group by PR
          const grouped: any = {};

          for (const pItem of currentPoItems) {
            // Find PR Item
            const originalPrItem = allPrItems.find(
              (pri: any) => String(pri.id_PRItem) === String(pItem.id_PRItem)
            );
            if (!originalPrItem) continue;

            const prId = originalPrItem.id_PR;
            const originalPr = allPrs.find(
              (pr: any) => String(pr.id_PR) === String(prId)
            );

            if (!grouped[prId]) {
              grouped[prId] = {
                prId: prId,
                noPR: originalPr?.noPR || "Unknown",
                tanggalPR: originalPr?.tanggalPR,
                skema: originalPr?.id_skema,
                items: [],
              };
            }

            // Restore item data
            grouped[prId].items.push({
              id: originalPrItem.id_PRItem, // ID PR Item for updates
              id_POItem: pItem.id_POItem, // KEEP TRACK OF THIS for updates
              namaBarang: originalPrItem.namaBarang,
              // jumlahPO is what we are editing.
              // jumlahAsli is the total original qty.
              // NOTE: When editing, we need to know the OLD `jumlahPO` to calc diff.
              // Ideally we store it.
              jumlahPO: pItem.jumlahPO,
              // Fix: Edit limit should be Current Order Qty (jumlahAsli) + Remaining PR Qty
              jumlahAsli: Number(pItem.jumlahAsli) + Number(originalPrItem.jumlah || 0),
              satuanLabel: pItem.satuanLabel || "Pcs", // Fetch if needed
              id_satuan: pItem.id_satuan,

              hargaSatuan: pItem.hargaSatuan
                ? (() => {
                  // Clean potential dirty data (e.g. "RP 15.001")
                  const raw = String(pItem.hargaSatuan).replace(/[^0-9,.-]/g, "");
                  // Handle if comma is decimal separator in source (rare but possible in string)
                  const normalized = raw.replace(",", ".");
                  const val = parseFloat(normalized);
                  if (isNaN(val)) return "";
                  return "Rp. " + val.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                })()
                : "",
              diskonItem: pItem.diskonPersen
                ? (String(pItem.diskonPersen).includes("+")
                  ? pItem.diskonPersen
                  : `${parseFloat(String(pItem.diskonPersen).replace("%", ""))}%`)
                : pItem.diskonRupiah
                  ? String(pItem.diskonRupiah)
                  : "",
              diskonNominal: pItem.diskonRupiah, // Populate for UI
              diskonPersen: pItem.diskonPersen
                ? (String(pItem.diskonPersen).includes("+")
                  ? pItem.diskonPersen
                  : `${parseFloat(String(pItem.diskonPersen).replace("%", ""))}%`)
                : "", // Populate for UI and normalize
              ppnItem: pItem.ppnPersen
                ? `${parseFloat(String(pItem.ppnPersen))}%`
                : "",
              keterangan: pItem.keterangan || originalPrItem.keterangan,
              skema: originalPrItem.id_skema,
              dibuatOleh: originalPr?.dibuatOleh,
              tanggalPR: originalPr?.tanggalPR,
            });
          }

          setPoItems(Object.values(grouped));

          // Try to set namaPembeli from first item
          if (currentPoItems.length > 0) {
            setPoFormData((prev) => ({
              ...prev,
              namaPembeli: currentPoItems[0].namaPembeli || prev.namaPembeli,
            }));
          }

          // Generate initial lastDiskonChanged state based on values
          const initialDiskonMap: any = {};
          Object.values(grouped).forEach((group: any) => {
            group.items.forEach((item: any) => {
              const ky = group.prId + "-" + item.id;
              // Check derivation
              if (item.diskonPersen && item.diskonPersen !== "0" && item.diskonPersen !== "" && item.diskonPersen !== "0%") {
                initialDiskonMap[ky] = "persen";
              } else if (item.diskonNominal && item.diskonNominal !== 0 && item.diskonNominal !== "0") {
                initialDiskonMap[ky] = "nominal";
              }
            });
          });
          setLastDiskonChanged(initialDiskonMap);

        } catch (err) {
          console.error("Error fetching edit data", err);
        }
      };

      // Delay slightly to ensure metadata (satuanOptions etc) loaded? 
      // Or just run it. Using timeout or dependency on editPoId.
      if (satuanOptions.length > 0) {
        // Actually better to run unconditionally and match IDs, 
        // labels will resolve if options exist.
        // Let's rely on IDs primarily.
        fetchEditData();
      } else {
        // Retry if dependencies not ready roughly?
        // For simplicity, just call it, React updates will handle eventually or we dep on options.
        fetchEditData();
      }
    }
  }, [editPoId, isEditing]); // Removed empty dependency array to run on change

  // Tambahkan handler terpisah agar lebih rapi
  function handleHargaSatuanChange(
    prId: string,
    itemId: string,
    value: string
  ) {
    // Clean input: remove "Rp", ".", spaces. Keep digits and comma.
    let raw = value.replace(/[^0-9,]/g, "");

    // Prevent multiple commas
    const parts = raw.split(",");
    if (parts.length > 2) {
      raw = parts[0] + "," + parts.slice(1).join("");
    }

    // Format Integer part with dots
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    // Reassemble
    let formatted = "";
    if (raw === "") {
      formatted = "";
    } else if (parts.length > 1) {
      // Limit decimals to 2 digits if desired, or allow free typing
      // User asked for "1.000,75" (2 digits)
      const decPart = parts[1].substring(0, 2);
      formatted = `Rp. ${intPart},${decPart}`;
    } else {
      formatted = `Rp. ${intPart}`;
    }

    // If input ends with comma, ensure it's preserved in state (though logic above handles it via split)
    if (raw.endsWith(",")) {
      formatted = `Rp. ${intPart},`;
    }

    setPoItems((prevPoItems) =>
      prevPoItems.map((pItem) =>
        pItem.prId === prId
          ? {
            ...pItem,
            items: pItem.items.map((i) => {
              if (i.id === itemId) {
                // Update dependent fields (Diskon Nominal/Persen)
                // Parse the raw value for calculation
                const cleanForCalc = raw.replace(",", ".");
                const newPrice = parseFloat(cleanForCalc) || 0;

                const qty = Number(i.jumlahPO) || 0;
                const subtotal = newPrice * qty;

                const mode = getDiskonMode(i, prId, lastDiskonChanged);

                let newDiskonNominal = i.diskonNominal;
                let newDiskonPersen = i.diskonPersen;

                if (mode === "persen") {
                  const dAmt = calculateDiskonModelPersen(subtotal, i.diskonPersen);
                  newDiskonNominal = dAmt ? Math.round(dAmt).toString() : "";
                } else if (mode === "nominal") {
                  // Calculate Persen from Nominal
                  const dNom = parseFloat(String(i.diskonNominal).replace(",", ".")) || 0;
                  if (subtotal > 0 && dNom > 0) {
                    const p = (dNom / subtotal) * 100;
                    newDiskonPersen = p % 1 === 0 ? `${p.toFixed(0)}%` : `${p.toFixed(2)}%`;
                  } else {
                    newDiskonPersen = "";
                  }
                }

                return {
                  ...i,
                  hargaSatuan: formatted, // Store formatted string
                  diskonNominal: newDiskonNominal,
                  diskonPersen: newDiskonPersen
                };
              }
              return i;
            }),
          }
          : pItem
      )
    );
  }

  // Handler untuk perubahan Qty
  function handleQtyChange(prId: string, itemId: string, value: string) {
    setPoItems((prevPoItems) =>
      prevPoItems.map((pItem) =>
        pItem.prId === prId
          ? {
            ...pItem,
            items: pItem.items.map((i) => {
              if (i.id === itemId) {
                const maxQty = Number(i.jumlahAsli);
                // Pastikan hanya integer bulat, tidak ribuan/desimal
                let newQty = Math.max(0, Math.floor(Number(value)) || 0);
                if (newQty > maxQty) newQty = maxQty;

                // Update dependent fields
                let harga = 0;
                if (typeof i.hargaSatuan === "string") {
                  const clean = i.hargaSatuan.replace(/[^0-9,]/g, "");
                  const normalized = clean.replace(",", ".");
                  harga = parseFloat(normalized) || 0;
                } else {
                  harga = Number(i.hargaSatuan) || 0;
                }
                const subtotal = harga * newQty;

                const mode = getDiskonMode(i, prId, lastDiskonChanged);
                let newDiskonNominal = i.diskonNominal;
                let newDiskonPersen = i.diskonPersen;

                if (mode === "persen") {
                  const dAmt = calculateDiskonModelPersen(subtotal, i.diskonPersen);
                  newDiskonNominal = dAmt ? Math.round(dAmt).toString() : "";
                } else if (mode === "nominal") {
                  const dNom = parseFloat(String(i.diskonNominal).replace(",", ".")) || 0;
                  if (subtotal > 0 && dNom > 0) {
                    const p = (dNom / subtotal) * 100;
                    newDiskonPersen = p % 1 === 0 ? `${p.toFixed(0)}%` : `${p.toFixed(2)}%`;
                  } else {
                    newDiskonPersen = "";
                  }
                }

                return { ...i, jumlahPO: newQty, diskonNominal: newDiskonNominal, diskonPersen: newDiskonPersen };
              }
              return i;
            }),
          }
          : pItem
      )
    );
  }

  // Handler perubahan diskon persen per item
  function handleDiskonPersenChange(
    prId: string,
    itemId: string,
    value: string
  ) {
    setPoItems((prevPoItems) =>
      prevPoItems.map((pItem) =>
        pItem.prId === prId
          ? {
            ...pItem,
            items: pItem.items.map((i) => {
              if (i.id === itemId) {
                // Hitung total diskon nominal dari persen
                // Support decimal hargaSatuan
                let harga = 0;
                if (typeof i.hargaSatuan === "string") {
                  const clean = i.hargaSatuan.replace(/[^0-9,]/g, "");
                  const normalized = clean.replace(",", ".");
                  harga = parseFloat(normalized) || 0;
                } else {
                  harga = Number(i.hargaSatuan) || 0;
                }
                const qty = Number(i.jumlahPO) || 0;
                const ppn = Number(i.ppnItem) || 0;
                const itemSubtotal = harga * qty;
                // Stack diskon persen
                let currentAmount = itemSubtotal;
                let diskonAmount = 0;
                const diskonPersenArr = value
                  .split("+")
                  .map((d) => d.trim())
                  .filter((d) => d.endsWith("%"))
                  .map((d) => parseFloat(d.replace("%", "").replace(",", ".")))
                  .filter((v) => v !== null && !isNaN(v));
                diskonPersenArr.forEach((persen) => {
                  const amount = currentAmount * (persen / 100);
                  diskonAmount += amount;
                  currentAmount -= amount;
                });
                // Update diskonNominal (Rp) hasil konversi
                return {
                  ...i,
                  diskonPersen: value,
                  diskonNominal: diskonAmount
                    ? Math.round(diskonAmount).toString()
                    : "",
                };
              }
              return i;
            }),
          }
          : pItem
      )
    );
    setLastDiskonChanged((prev) => ({
      ...prev,
      [prId + "-" + itemId]: "persen",
    }));
  }

  // Handler perubahan diskon nominal per item
  function handleDiskonNominalChange(
    prId: string,
    itemId: string,
    value: string
  ) {
    setPoItems((prevPoItems) =>
      prevPoItems.map((pItem) =>
        pItem.prId === prId
          ? {
            ...pItem,
            items: pItem.items.map((i) => {
              if (i.id === itemId) {
                // Hitung diskon persen hasil konversi dari nominal
                let harga = 0;
                if (typeof i.hargaSatuan === "string") {
                  const clean = i.hargaSatuan.replace(/[^0-9,]/g, "");
                  const normalized = clean.replace(",", ".");
                  harga = parseFloat(normalized) || 0;
                } else {
                  harga = Number(i.hargaSatuan) || 0;
                }
                const qty = Number(i.jumlahPO) || 0;
                const itemSubtotal = harga * qty;
                // Support decimal diskonNominal
                const diskonNominal = parseFloat(value.replace(",", ".")) || 0;
                let diskonPersen = "";
                if (itemSubtotal > 0 && diskonNominal > 0) {
                  const persen = (diskonNominal / itemSubtotal) * 100;
                  diskonPersen =
                    persen % 1 === 0 ? `${persen.toFixed(0)}%` : `${persen}%`;
                }
                return {
                  ...i,
                  diskonNominal: value,
                  diskonPersen: diskonPersen,
                };
              }
              return i;
            }),
          }
          : pItem
      )
    );
    setLastDiskonChanged((prev) => ({
      ...prev,
      [prId + "-" + itemId]: "nominal",
    }));
  }

  // Handler untuk perubahan ppn per item
  function handlePPNItemChange(prId: string, itemId: string, value: string) {
    setPoItems((prevPoItems) =>
      prevPoItems.map((pItem) =>
        pItem.prId === prId
          ? {
            ...pItem,
            items: pItem.items.map((i) =>
              i.id === itemId
                ? {
                  ...i,
                  ppnItem: value,
                }
                : i
            ),
          }
          : pItem
      )
    );
  }

  // --- NEW FEATURE: Missing PR Items ---
  function getMissingItems() {
    const missing: Array<{
      prId: string;
      noPR: string;
      items: any[];
    }> = [];

    // Iterate over currently selected/processed PR groups in poItems
    poItems.forEach((poGroup) => {
      // ONLY process groups that actually have items (active in the PO)
      // If a PR has 0 items in the PO, it's considered "removed" from the transaction, so don't show its missing list.
      if (!poGroup.items || poGroup.items.length === 0) return;

      // Find original PR data
      const originalPR = prData.find(
        (p) => String(p.id) === String(poGroup.prId)
      );
      if (!originalPR) return;

      // Find items that are in Original PR but NOT in poGroup.items
      // Robust ID collection: Check both id and id_PRItem
      const existingIds = new Set(
        poGroup.items.map((item) => String(item.id_PRItem || item.id || ""))
      );

      const itemsLeft = originalPR.items.filter((item: any) => {
        // item from prData should have id or id_PRItem
        const itemId = String(item.id || item.id_PRItem || "");
        // Only show if not in existing AND not explicitly "Ditolak" (if status exists)
        // AND remaining quantity > 0 (excludes items already fully PO'd in other POs)
        const isNotRejected = item.status !== "Ditolak" && item.status !== "Cancel";
        const hasRemainingQty = (Number(item.jumlah) || 0) > 0;
        return !existingIds.has(itemId) && isNotRejected && hasRemainingQty;
      });

      if (itemsLeft.length > 0) {
        missing.push({
          prId: poGroup.prId,
          noPR: poGroup.noPR,
          items: itemsLeft,
        });
      }
    });

    return missing;
  }

  const handleAddItemFromPR = (prId: string, itemToAdd: any, noPR: string) => {
    setPoItems((prev) => {
      // Find original PR for metadata (outside map to avoid repetitive find, but inside is fine for now)
      const originalPR = prData.find((p) => String(p.id) === String(prId));

      return prev.map((group) => {
        if (String(group.prId) !== String(prId)) return group;

        // 1. Add item to group
        const newItem = {
          id: itemToAdd.id, // ID PR Item
          namaBarang: itemToAdd.namaBarang,
          jumlahPO: itemToAdd.quantityAwalPR, // Default to remaining/initial qty
          jumlahAsli: itemToAdd.quantityAwalPR,
          satuanLabel: itemToAdd.satuanLabel || itemToAdd.satuan || "",
          id_satuan: itemToAdd.id_satuan,
          hargaSatuan: "", // Reset price
          diskonItem: "",
          ppnItem: "",
          keterangan: itemToAdd.keterangan || "",
          skema: group.skema,
          dibuatOleh: originalPR?.dibuatOleh || "", // Use originalPR
          tanggalPR: originalPR?.tanggalPR, // Use originalPR
        };

        const newItems = [...group.items, newItem];

        // 2. Sort items based on original PR order
        if (originalPR) {
          // Create map of ID -> Index
          const sortMap = new Map();
          originalPR.items.forEach((it: any, idx: number) => {
            sortMap.set(String(it.id), idx);
          });

          newItems.sort((a, b) => {
            const idxA = sortMap.get(String(a.id)) ?? 9999;
            const idxB = sortMap.get(String(b.id)) ?? 9999;
            return idxA - idxB;
          });
        }

        return {
          ...group,
          items: newItems,
        };
      });
    });
  };

  // Helper untuk label satuan dari satuanOptions
  function getSatuanLabel(satuanValue: string) {
    const found = satuanOptions.find(
      (s: any) => String(s.id_satuan) === String(satuanValue)
    );
    return found ? found.satuan : satuanValue;
  }

  // KEYBOARD NAVIGATION HANDLER
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colKey: string
  ) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextInput = document.querySelector(
        `input[data-row-index="${rowIndex + 1}"][data-col-key="${colKey}"]`
      ) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select(); // Auto-select text for quick editing
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevInput = document.querySelector(
        `input[data-row-index="${rowIndex - 1}"][data-col-key="${colKey}"]`
      ) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };
  // Fungsi untuk memberi class pada weekend
  function highlightWeekends(date: Date) {
    const day = date.getDay();
    if (day === 0 || day === 6) return "datepicker-red";
    return undefined;
  }

  // Tambahkan helper normalizeToDateString
  function normalizeToDateString(
    dateOrString: Date | string | null | undefined
  ) {
    if (!dateOrString) return "";
    if (typeof dateOrString === "string") {
      if (dateOrString.includes("T")) {
        // 🚀 PAKAI dayjs(dateOrString).local() agar sesuai waktu Indonesia (WIB)
        return dayjs(dateOrString).local().format("YYYY-MM-DD");
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateOrString)) return dateOrString;
      return dayjs(dateOrString).local().format("YYYY-MM-DD");
    }
    return dayjs(dateOrString).local().format("YYYY-MM-DD");
  }

  // Tambahkan helper format rupiah untuk input
  function formatRupiahInput(val: number | string) {
    if (val === "" || val === undefined || isNaN(Number(val))) return "";
    return Number(val).toLocaleString("id-ID");
  }

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

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Notifikasi tengah layar */}
        {notif && (
          <div
            className={`fixed left-1/2 top-16 z-50 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-center text-base font-semibold
              ${notif.type === "success"
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
            className="bg-primary hover:bg-primary/90 !text-white"
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
            <div className="space-y-4">
              {/* Baris 1: No PO, Tanggal PO, Estimasi Tanggal Terima */}
              {/* Baris 1: No PO, Tanggal PO, Supplier, Termin */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                {/* No PO */}
                <div className="space-y-2">
                  <Label htmlFor="noPO">NO. PO</Label>
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
                {/* Tanggal PO */}
                <div className="space-y-2">
                  <Label htmlFor="tanggalPO">TANGGAL PO</Label>
                  <DatePicker
                    id="tanggalPO"
                    selected={poFormData.tanggalPO}
                    onChange={(date) =>
                      setPoFormData({ ...poFormData, tanggalPO: date })
                    }
                    dateFormat="dd-MM-yyyy"
                    placeholderText="Pilih tanggal"
                    className="w-full px-3 py-2 border rounded-md bg-white"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    dayClassName={highlightWeekends}
                    popperClassName="z-[9999]"
                    popperPlacement="right"
                    customInput={
                      <Input
                        value={
                          poFormData.tanggalPO
                            ? typeof poFormData.tanggalPO === "string"
                              ? poFormData.tanggalPO
                              : `${String(
                                poFormData.tanggalPO.getDate()
                              ).padStart(2, "0")}-${String(
                                poFormData.tanggalPO.getMonth() + 1
                              ).padStart(
                                2,
                                "0"
                              )}-${poFormData.tanggalPO.getFullYear()}`
                            : ""
                        }
                        readOnly
                        className="w-full px-3 py-2 border rounded-md bg-white"
                      />
                    }
                  />
                </div>
                {/* Supplier */}
                <div className="space-y-2">
                  <Label htmlFor="supplier">SUPPLIER</Label>
                  <Select
                    value={String(poFormData.supplier)}
                    onValueChange={(value) =>
                      setPoFormData({ ...poFormData, supplier: value })
                    }
                  >
                    <SelectTrigger className="border-border focus:border-primary/50 bg-white">
                      <SelectValue placeholder="Pilih supplier" />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-[384px] overflow-y-auto relative">
                      <div className="sticky top-0 z-20 bg-white px-2 py-1 border-b border-gray-100">
                        {showAddSupplier ? (
                          <div className="flex items-center gap-2 mb-2">
                            <Input
                              placeholder="Nama supplier baru"
                              value={newSupplier}
                              onChange={(e) => setNewSupplier(e.target.value)}
                              className="w-[140px]"
                              autoFocus
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddSupplier}
                              className="bg-primary text-white"
                            >
                              Simpan
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowAddSupplier(false);
                                setNewSupplier("");
                              }}
                            >
                              Batal
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Input
                              placeholder="Cari supplier..."
                              value={supplierSearch}
                              onChange={(e) => setSupplierSearch(e.target.value)}
                              className="mb-2"
                              disabled={showAddSupplier}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mb-2 w-full"
                              onClick={() => setShowAddSupplier(true)}
                              disabled={showAddSupplier}
                            >
                              + Tambahkan Supplier
                            </Button>
                          </>
                        )}
                      </div>
                      {showAddSupplier ? null : (
                        <>
                          {supplierOptions.length === 0 ? (
                            <SelectItem value="__loading" disabled>
                              Memuat...
                            </SelectItem>
                          ) : (
                            supplierOptions
                              .filter((sup: any) =>
                                sup.namaSupplier
                                  .toLowerCase()
                                  .includes(supplierSearch.toLowerCase())
                              )
                              .map((sup: any) => (
                                <div
                                  key={sup.id_supplier}
                                  className="flex items-center gap-2 px-2 py-1 group hover:bg-gray-50"
                                >
                                  {editSupplierId === String(sup.id_supplier) ? (
                                    <>
                                      <Input
                                        value={editSupplierValue}
                                        onChange={(e) =>
                                          setEditSupplierValue(e.target.value)
                                        }
                                        className="w-[90px] h-7 text-xs"
                                        disabled={showAddSupplier}
                                      />
                                      <Button
                                        type="button"
                                        size="sm"
                                        className="px-2 py-1 text-xs bg-primary text-white"
                                        onClick={() =>
                                          handleEditSupplier(
                                            String(sup.id_supplier)
                                          )
                                        }
                                        disabled={showAddSupplier}
                                      >
                                        Simpan
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="px-2 py-1 text-xs"
                                        onClick={() => {
                                          setEditSupplierId(null);
                                          setEditSupplierValue("");
                                        }}
                                        disabled={showAddSupplier}
                                      >
                                        Batal
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <SelectItem
                                        key={sup.id_supplier}
                                        value={String(sup.id_supplier)}
                                        className="flex-1"
                                        disabled={showAddSupplier}
                                      >
                                        {sup.namaSupplier}
                                      </SelectItem>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs text-blue-600 px-1 py-0.5"
                                        onClick={() => {
                                          setEditSupplierId(
                                            String(sup.id_supplier)
                                          );
                                          setEditSupplierValue(sup.namaSupplier);
                                        }}
                                        disabled={showAddSupplier}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs text-red-600 px-1 py-0.5"
                                        onClick={() =>
                                          handleDeleteSupplier(
                                            String(sup.id_supplier)
                                          )
                                        }
                                        disabled={showAddSupplier}
                                      >
                                        Hapus
                                      </Button>
                                    </>
                                  )}
                                </div>
                              ))
                          )}
                          {supplierOptions.length > 0 &&
                            supplierOptions.filter((sup: any) =>
                              sup.namaSupplier
                                .toLowerCase()
                                .includes(supplierSearch.toLowerCase())
                            ).length === 0 && (
                              <SelectItem value="__notfound" disabled>
                                Data tidak ditemukan
                              </SelectItem>
                            )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {/* Termin Pembayaran */}
                <div className="space-y-2">
                  <Label htmlFor="termin">TERMIN PEMBAYARAN</Label>
                  <Select
                    value={String(poFormData.termin)}
                    onValueChange={(value) =>
                      setPoFormData({
                        ...poFormData,
                        termin: value,
                      })
                    }
                  >
                    <SelectTrigger className="border-border focus:border-primary/50 bg-white">
                      <SelectValue placeholder="Pilih termin" />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-[384px] overflow-y-auto relative">
                      <div className="sticky top-0 z-20 bg-white px-2 py-1 border-b border-gray-100">
                        {showAddTermin ? (
                          <div className="flex items-center gap-2 mb-2">
                            <Input
                              placeholder="Termin baru"
                              value={newTermin}
                              onChange={(e) => setNewTermin(e.target.value)}
                              className="w-[140px]"
                              autoFocus
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddTermin}
                              className="bg-primary text-white"
                            >
                              Simpan
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowAddTermin(false);
                                setNewTermin("");
                              }}
                            >
                              Batal
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Input
                              placeholder="Cari termin..."
                              value={terminSearch}
                              onChange={(e) => setTerminSearch(e.target.value)}
                              className="mb-2"
                              disabled={showAddTermin}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mb-2 w-full"
                              onClick={() => setShowAddTermin(true)}
                              disabled={showAddTermin}
                            >
                              + Tambahkan Termin
                            </Button>
                          </>
                        )}
                      </div>
                      {showAddTermin ? null : (
                        <>
                          {terminOptions.length === 0 ? (
                            <SelectItem value="__loading" disabled>
                              Memuat...
                            </SelectItem>
                          ) : (
                            terminOptions
                              .filter((opt: any) =>
                                (opt.termin || "")
                                  .toLowerCase()
                                  .includes(terminSearch.toLowerCase())
                              )
                              .map((opt: any) => (
                                <div
                                  key={opt.id_termin}
                                  className="flex justify-between items-center group w-full"
                                >
                                  {editTerminId === String(opt.id_termin) ? (
                                    <>
                                      <Input
                                        value={editTerminValue}
                                        onChange={(e) =>
                                          setEditTerminValue(e.target.value)
                                        }
                                        className="h-8 text-xs w-[140px]"
                                        autoFocus
                                      />
                                      <Button
                                        type="button"
                                        size="sm"
                                        className="px-2 py-1 text-xs"
                                        onClick={() =>
                                          handleEditTermin(String(opt.id_termin))
                                        }
                                        disabled={showAddTermin}
                                      >
                                        Simpan
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="px-2 py-1 text-xs"
                                        onClick={() => {
                                          setEditTerminId(null);
                                          setEditTerminValue("");
                                        }}
                                        disabled={showAddTermin}
                                      >
                                        Batal
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <SelectItem
                                        key={opt.id_termin}
                                        value={String(opt.id_termin)}
                                        className="flex-1"
                                        disabled={showAddTermin}
                                      >
                                        {opt.termin}
                                      </SelectItem>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs text-blue-600 px-1 py-0.5"
                                        onClick={() => {
                                          setEditTerminId(String(opt.id_termin));
                                          setEditTerminValue(opt.termin);
                                        }}
                                        disabled={showAddTermin}
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs text-red-600 px-1 py-0.5"
                                        onClick={() =>
                                          handleDeleteTermin(
                                            String(opt.id_termin)
                                          )
                                        }
                                        disabled={showAddTermin}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              ))
                          )}
                          {terminOptions.length > 0 &&
                            terminOptions.filter((opt: any) =>
                              (opt.termin || "")
                                .toLowerCase()
                                .includes(terminSearch.toLowerCase())
                            ).length === 0 && (
                              <SelectItem value="__notfound" disabled>
                                Data tidak ditemukan
                              </SelectItem>
                            )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Baris 2: Estimasi Tanggal Terima, Status Pengiriman, Nama Pembeli */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                {/* Estimasi Tanggal Terima */}
                <div className="space-y-2">
                  <Label htmlFor="estimasiTanggalDiterima">
                    ESTIMASI TANGGAL DITERIMA
                  </Label>
                  <DatePicker
                    id="estimasiTanggalDiterima"
                    selected={poFormData.estimasiTanggalDiterima}
                    onChange={(date) =>
                      setPoFormData({
                        ...poFormData,
                        estimasiTanggalDiterima: date,
                      })
                    }
                    dateFormat="dd-MM-yyyy"
                    placeholderText="Pilih tanggal"
                    className="w-full px-3 py-2 border rounded-md bg-white"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    dayClassName={highlightWeekends}
                    popperClassName="z-[9999]"
                    popperPlacement="right"
                    customInput={
                      <Input
                        value={
                          poFormData.estimasiTanggalDiterima
                            ? `${String(
                              poFormData.estimasiTanggalDiterima.getDate()
                            ).padStart(2, "0")}-${String(
                              poFormData.estimasiTanggalDiterima.getMonth() +
                              1
                            ).padStart(
                              2,
                              "0"
                            )}-${poFormData.estimasiTanggalDiterima.getFullYear()}`
                            : ""
                        }
                        readOnly
                        className="w-full px-3 py-2 border rounded-md bg-white"
                      />
                    }
                  />
                </div>
                {/* Status Pengiriman */}
                <div className="space-y-2">
                  <Label htmlFor="statusPengiriman">STATUS PENGIRIMAN</Label>
                  <Select
                    value={String(poFormData.statusPengiriman)}
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
                    <SelectContent className="bg-white max-h-[384px] overflow-y-auto relative">
                      <div className="sticky top-0 z-20 bg-white px-2 py-1 border-b border-gray-100">
                        {showAddStatusPengiriman ? (
                          <div className="flex items-center gap-2 mb-2">
                            <Input
                              placeholder="Status pengiriman baru"
                              value={newStatusPengiriman}
                              onChange={(e) =>
                                setNewStatusPengiriman(e.target.value)
                              }
                              className="w-[140px]"
                              autoFocus
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddStatusPengiriman}
                              className="bg-primary text-white"
                            >
                              Simpan
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowAddStatusPengiriman(false);
                                setNewStatusPengiriman("");
                              }}
                            >
                              Batal
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Input
                              placeholder="Cari status pengiriman..."
                              value={statusPengirimanSearch}
                              onChange={(e) =>
                                setStatusPengirimanSearch(e.target.value)
                              }
                              className="mb-2"
                              disabled={showAddStatusPengiriman}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mb-2 w-full"
                              onClick={() => setShowAddStatusPengiriman(true)}
                              disabled={showAddStatusPengiriman}
                            >
                              + Tambahkan Status Pengiriman
                            </Button>
                          </>
                        )}
                      </div>
                      {showAddStatusPengiriman ? null : (
                        <>
                          {statusPengirimanOptions.length === 0 ? (
                            <SelectItem value="__loading" disabled>
                              Memuat...
                            </SelectItem>
                          ) : (
                            statusPengirimanOptions
                              .filter((opt: any) =>
                                opt.status_pengiriman
                                  .toLowerCase()
                                  .includes(statusPengirimanSearch.toLowerCase())
                              )
                              .map((opt: any) => (
                                <div
                                  key={opt.id_statusPengiriman}
                                  className="flex items-center gap-2 px-2 py-1 group hover:bg-gray-50"
                                >
                                  {editStatusPengirimanId ===
                                    String(opt.id_statusPengiriman) ? (
                                    <>
                                      <Input
                                        value={editStatusPengirimanValue}
                                        onChange={(e) =>
                                          setEditStatusPengirimanValue(
                                            e.target.value
                                          )
                                        }
                                        className="w-[90px] h-7 text-xs"
                                        disabled={showAddStatusPengiriman}
                                      />
                                      <Button
                                        type="button"
                                        size="sm"
                                        className="px-2 py-1 text-xs bg-primary text-white"
                                        onClick={() =>
                                          handleEditStatusPengiriman(
                                            String(opt.id_statusPengiriman)
                                          )
                                        }
                                        disabled={showAddStatusPengiriman}
                                      >
                                        Simpan
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="px-2 py-1 text-xs"
                                        onClick={() => {
                                          setEditStatusPengirimanId(null);
                                          setEditStatusPengirimanValue("");
                                        }}
                                        disabled={showAddStatusPengiriman}
                                      >
                                        Batal
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <SelectItem
                                        key={opt.id_statusPengiriman}
                                        value={String(opt.id_statusPengiriman)}
                                        className="flex-1"
                                        disabled={showAddStatusPengiriman}
                                      >
                                        {opt.status_pengiriman}
                                      </SelectItem>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs text-blue-600 px-1 py-0.5"
                                        onClick={() => {
                                          setEditStatusPengirimanId(
                                            String(opt.id_statusPengiriman)
                                          );
                                          setEditStatusPengirimanValue(
                                            opt.status_pengiriman
                                          );
                                        }}
                                        disabled={showAddStatusPengiriman}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs text-red-600 px-1 py-0.5"
                                        onClick={() =>
                                          handleDeleteStatusPengiriman(
                                            String(opt.id_statusPengiriman)
                                          )
                                        }
                                        disabled={showAddStatusPengiriman}
                                      >
                                        Hapus
                                      </Button>
                                    </>
                                  )}
                                </div>
                              ))
                          )}
                          {statusPengirimanOptions.length > 0 &&
                            statusPengirimanOptions.filter((opt: any) =>
                              opt.status_pengiriman
                                .toLowerCase()
                                .includes(statusPengirimanSearch.toLowerCase())
                            ).length === 0 && (
                              <SelectItem value="__notfound" disabled>
                                Data tidak ditemukan
                              </SelectItem>
                            )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {/* Nama Pembeli (ganti Skema) */}
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="namaPembeli">NAMA PEMBELI</Label>
                  <Input
                    id="namaPembeli"
                    value={poFormData.namaPembeli}
                    onChange={(e) =>
                      setPoFormData({
                        ...poFormData,
                        namaPembeli: e.target.value,
                      })
                    }
                    placeholder="Masukkan nama pembeli"
                    required
                    className="border-border focus:border-primary/50 bg-white w-full md:w-[280px]"
                  />
                  {/* Sembunyikan skema, tetap dikirim */}
                  <input
                    type="hidden"
                    name="skema"
                    value={poFormData.skema}
                  />
                </div>
                {/* Item dari PR (New Column) */}
                <div className="space-y-2 md:col-span-1">
                  <Label>ITEM DARI PR</Label>
                  <div className="border rounded-md h-[132px] overflow-y-auto bg-gray-50 text-xs shadow-inner">
                    {getMissingItems().length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground italic text-[10px]">
                          Semua item sudah masuk
                        </p>
                      </div>
                    ) : (
                      getMissingItems().map((group) => (
                        <div key={group.prId} className="border-b last:border-0">
                          <div className="bg-gray-100 px-2 py-1 sticky top-0 z-10 border-b border-gray-200">
                            <p className="font-bold text-[10px] text-primary">
                              {group.noPR}
                            </p>
                          </div>
                          <div className="p-1 space-y-1">
                            {group.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex justify-between items-center bg-white border border-gray-200 px-2 py-1.5 rounded hover:bg-blue-50 transition-colors group"
                              >
                                <span className="line-clamp-2 text-[10px] font-medium text-gray-700 flex-1 mr-2 leading-tight" title={item.namaBarang}>
                                  {item.namaBarang}
                                </span>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-blue-600 bg-blue-50 group-hover:bg-blue-100 group-hover:text-blue-700 rounded-full shrink-0"
                                  onClick={() => handleAddItemFromPR(group.prId, item, group.noPR)}
                                  title="Tambahkan ke tabel"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Baris 3: Detail Barang dari PR */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  DETAIL BARANG DARI PR
                </h3>
                <div className="border rounded-lg overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-2 h-8">NO. PR</TableHead>
                        <TableHead className="py-2 h-8">NAMA BARANG</TableHead>
                        <TableHead className="py-2 h-8">KUANTITAS</TableHead>
                        <TableHead className="py-2 h-8">SATUAN</TableHead>
                        <TableHead className="py-2 h-8">HARGA SATUAN</TableHead>
                        <TableHead className="py-2 h-8">DISKON (%)</TableHead>
                        <TableHead className="py-2 h-8">DISKON (RP)</TableHead>
                        <TableHead className="py-2 h-8">SUB (SETELAH DISKON)</TableHead>
                        <TableHead className="py-2 h-8">PPN (%)</TableHead>
                        <TableHead className="py-2 h-8">PPN (RP)</TableHead>
                        <TableHead className="py-2 h-8">TOTAL PER ITEM</TableHead>
                        <TableHead className="py-2 h-8">KETERANGAN</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPOItems
                        .flatMap((poItem) =>
                          poItem.items.map((item) => ({
                            ...item,
                            noPR: poItem.noPR,
                            prId: poItem.prId,
                          }))
                        )
                        .map((item, idx) => {
                          // Perhitungan diskon dan PPN per item
                          // Perhitungan diskon dan PPN per item
                          const harga = typeof item.hargaSatuan === "string"
                            ? parseFloat(item.hargaSatuan.replace(/[^0-9,]/g, "").replace(",", "."))
                            : Number(item.hargaSatuan) || 0;
                          const qty = Number(item.jumlahPO) || 0;
                          const ppn = parseFloat(String(item.ppnItem).replace("%", "")) || 0;
                          const itemSubtotal = harga * qty;

                          // Gunakan hanya salah satu diskon (yang terakhir diubah user)
                          // Determine mode
                          const mode = getDiskonMode(item, item.prId, lastDiskonChanged);
                          let diskonAmount = 0;

                          if (mode === "persen") {
                            diskonAmount = calculateDiskonModelPersen(itemSubtotal, item.diskonPersen);
                          } else if (mode === "nominal") {
                            diskonAmount = parseFloat(String(item.diskonNominal).replace(",", ".")) || 0;
                          } else {
                            diskonAmount = 0;
                          }
                          // Hanya deklarasi afterDiskon SEKALI di sini
                          const afterDiskon = Math.max(
                            0,
                            itemSubtotal - diskonAmount
                          );

                          let ppnAmount = afterDiskon * (ppn / 100);
                          let subtotalItem = afterDiskon;
                          let total = 0;

                          if (ppnIncluded) {
                            subtotalItem = afterDiskon;
                            total = afterDiskon;
                          } else {
                            subtotalItem = afterDiskon;
                            total = afterDiskon + ppnAmount;
                          }

                          // Tambahkan totalPerItem (setelah diskon + ppn)
                          const totalPerItem = subtotalItem + ppnAmount;

                          return (
                            <TableRow key={item.id}>
                              <TableCell className="uppercase p-1 text-xs">{item.noPR}</TableCell>
                              <TableCell className="uppercase p-1 text-xs">{item.namaBarang}</TableCell>
                              <TableCell className="p-1">
                                <Input
                                  type="number"
                                  value={
                                    Number(item.jumlahPO) % 1 === 0
                                      ? parseInt(item.jumlahPO)
                                      : item.jumlahPO
                                  }
                                  min={0}
                                  max={item.jumlahAsli}
                                  onChange={(e) =>
                                    handleQtyChange(
                                      item.prId,
                                      item.id,
                                      e.target.value
                                    )
                                  }
                                  className="w-16 h-7 text-xs px-2"
                                  data-row-index={idx}
                                  data-col-key="qty"
                                  onKeyDown={(e) => handleKeyDown(e, idx, "qty")}
                                />
                                <span className="text-xs text-muted-foreground ml-2">
                                  /{" "}
                                  {Number(item.jumlahAsli) % 1 === 0
                                    ? parseInt(item.jumlahAsli)
                                    : item.jumlahAsli}
                                </span>
                              </TableCell>
                              <TableCell className="uppercase p-1 text-xs">
                                {getSatuanLabel(item.id_satuan) ||
                                  item.satuanLabel ||
                                  item.satuan}
                              </TableCell>
                              <TableCell className="p-1">
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  value={item.hargaSatuan}
                                  onWheel={(e) => e.currentTarget.blur()}
                                  onChange={(e) => {
                                    handleHargaSatuanChange(
                                      item.prId,
                                      item.id,
                                      e.target.value
                                    );
                                  }}
                                  className="w-32 h-7 text-xs px-2 text-right"
                                  placeholder="Rp. 0"
                                  autoComplete="off"
                                  data-row-index={idx}
                                  data-col-key="harga"
                                  onKeyDown={(e) => handleKeyDown(e, idx, "harga")}
                                />
                              </TableCell>
                              <TableCell className="p-1">
                                <Input
                                  type="text"
                                  value={item.diskonPersen ?? ""}
                                  onChange={(e) =>
                                    handleDiskonPersenChange(
                                      item.prId,
                                      item.id,
                                      e.target.value
                                    )
                                  }
                                  onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    // If it's a number and doesn't end with %, append %
                                    if (val && /^\d+(\.\d+)?$/.test(val)) {
                                      handleDiskonPersenChange(
                                        item.prId,
                                        item.id,
                                        `${val}%`
                                      );
                                    }
                                  }}
                                  className="w-16 h-7 text-xs text-right px-2"
                                  placeholder="10%"
                                  data-row-index={idx}
                                  data-col-key="diskonPersen"
                                  onKeyDown={(e) =>
                                    handleKeyDown(e, idx, "diskonPersen")
                                  }
                                />
                              </TableCell>
                              <TableCell className="p-1">
                                <Input
                                  type="text"
                                  value={
                                    mode === "persen"
                                      ? diskonAmount
                                        ? `Rp. ${diskonAmount.toLocaleString("id-ID")}`
                                        : ""
                                      : item.diskonNominal
                                        ? `Rp. ${Number(
                                          item.diskonNominal
                                        ).toLocaleString("id-ID")}`
                                        : ""
                                  }
                                  onChange={(e) => {
                                    // Only allow numeric input, strip "Rp." and non-digits
                                    const raw = e.target.value.replace(
                                      /[^\d]/g,
                                      ""
                                    );
                                    handleDiskonNominalChange(
                                      item.prId,
                                      item.id,
                                      raw
                                    );
                                  }}
                                  className="w-20 h-7 text-xs text-right px-2"
                                  placeholder="Rp. 0"
                                  data-row-index={idx}
                                  data-col-key="diskonNominal"
                                  onKeyDown={(e) =>
                                    handleKeyDown(e, idx, "diskonNominal")
                                  }
                                />
                              </TableCell>
                              <TableCell className="p-1 text-xs">
                                Rp {afterDiskon.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                              </TableCell>
                              <TableCell className="p-1">
                                <Input
                                  type="text"
                                  value={item.ppnItem ?? ""}
                                  onChange={(e) =>
                                    handlePPNItemChange(
                                      item.prId,
                                      item.id,
                                      e.target.value
                                    )
                                  }
                                  onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    if (val && /^\d+(\.\d+)?$/.test(val)) {
                                      handlePPNItemChange(
                                        item.prId,
                                        item.id,
                                        `${val}%`
                                      );
                                    }
                                  }}
                                  className="w-12 h-7 text-xs text-right px-2"
                                  placeholder="0%"
                                  data-row-index={idx}
                                  data-col-key="ppn"
                                  onKeyDown={(e) => handleKeyDown(e, idx, "ppn")}
                                />
                              </TableCell>
                              <TableCell className="p-1 text-xs">
                                Rp {ppnAmount.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                              </TableCell>
                              <TableCell className="p-1 text-xs">
                                Rp {totalPerItem.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                              </TableCell>
                              <TableCell className="p-1 text-xs">
                                <div
                                  className="text-muted-foreground max-w-xs truncate uppercase"
                                  title={item.keterangan}
                                >
                                  {item.keterangan}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
                {/* Pagination for items table */}
                {/* <Pagination className="mt-2">
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
                </Pagination> */}
              </div>

              {/* Baris 4: PPN Checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ppn-included"
                  checked={ppnIncluded}
                  onCheckedChange={(checked) => setPpnIncluded(!!checked)}
                />
                <Label htmlFor="ppn-included" className="cursor-pointer">
                  Harga sudah termasuk PPN
                </Label>
              </div>

              {/* Baris 5: Ringkasan Perhitungan */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-3">
                  RINGKASAN PERHITUNGAN
                </h3>
                <div className="border rounded-lg p-4 space-y-3">
                  {(() => {
                    const calculations = calculateTotal();
                    return (
                      <>
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>
                            Rp {calculations.subtotal.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span>Total Diskon:</span>
                          <span className="text-destructive">
                            -Rp{" "}
                            {calculations.totalDiskon.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            Total PPN
                            {ppnIncluded ? "" : ""}:
                          </span>
                          <span className="text-success">
                            {ppnIncluded
                              ? "Rp " +
                              calculations.totalPPN.toLocaleString("id-ID", { maximumFractionDigits: 0 })
                              : "+Rp " +
                              calculations.totalPPN.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Pembayaran:</span>
                          <span className="text-primary">
                            Rp{" "}
                            {calculations.totalPayment.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        {ppnIncluded && (
                          <div className="text-xs text-muted-foreground mt-2">
                            <b>Catatan:</b> Total pembayaran sudah termasuk PPN.
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Baris 6: Tombol Buat PO */}
              <Button
                onClick={handleCreatePO}
                className="w-full bg-primary text-white hover:bg-primary/90 mt-4"
              >
                Buat PO
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout >
  );
}

export default function InputPOPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InputPOContent />
    </Suspense>
  );
}
