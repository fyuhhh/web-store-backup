"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/app/pr/input-baru/datepicker-red-weekend.css";

import type React from "react";

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

export default function InputPOPage() {
  const [prData, setPrData] = useState<PRData[]>([]);
  const [poData, setPoData] = useState<POData[]>([]);

  // PO Form state
  const [poFormData, setPoFormData] = useState({
    noPO: "",
    tanggalPO: null as Date | null,
    supplier: "",
    estimasiTanggalDiterima: null as Date | null,
    diskon: "",
    ppn: "11",
    statusPengiriman: "",
    skema: "", // <-- add skema field
  });

  const [userSkema, setUserSkema] = useState("");

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
  // const allFilteredItems = filteredPOItems.flatMap((poItem) =>
  //   poItem.items.map((item) => ({
  //     ...item,
  //     noPR: poItem.noPR,
  //     prId: poItem.prId,
  //   }))
  // );

  // const totalPages = Math.ceil(allFilteredItems.length / itemsPerPage);
  // const pagedItems = allFilteredItems.slice(
  //   (currentPage - 1) * itemsPerPage,
  //   currentPage * itemsPerPage
  // );

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
      poItem.items.forEach((item) => {
        const harga = Number(item.hargaSatuan) || 0;
        const qty = Number(item.jumlahPO) || 0;
        const ppn = Number(item.ppnItem) || 0;
        const itemSubtotal = harga * qty;

        // Gunakan hanya salah satu diskon (yang terakhir diubah user)
        const diskonKey = poItem.prId + "-" + item.id;
        let diskonAmount = 0;
        let diskonBreakdown: Array<{
          label: string;
          value: string;
          amount: number;
        }> = [];

        if (lastDiskonChanged[diskonKey] === "persen") {
          // Hitung dari persen (stacked)
          let currentAmount = itemSubtotal;
          const diskonPersenArr = (item.diskonPersen || "")
            .split("+")
            .map((d) => d.trim())
            .filter((d) => d.endsWith("%"))
            .map((d) => parseFloat(d.replace("%", "")))
            .filter((v) => !isNaN(v));
          diskonPersenArr.forEach((persen, idx) => {
            const amount = currentAmount * (persen / 100);
            diskonAmount += amount;
            currentAmount -= amount;
            diskonBreakdown.push({
              label: `Diskon % ke-${idx + 1}`,
              value: persen + "%",
              amount,
            });
          });
        } else if (lastDiskonChanged[diskonKey] === "nominal") {
          diskonAmount = parseFloat(item.diskonNominal) || 0;
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
        const ppnAmount = afterDiskon * (ppn / 100);
        let subtotalItem = afterDiskon;
        let total = 0;

        if (ppnIncluded) {
          subtotalItem = afterDiskon + ppnAmount;
          total = afterDiskon + ppnAmount;
        } else {
          subtotalItem = afterDiskon;
          total = afterDiskon + ppnAmount;
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

  // Fetch supplier, status_pengiriman, status_permintaan dari backend
  useEffect(() => {
    fetch("http://192.168.10.10:5000/api/supplier")
      .then((res) => res.json())
      .then((data) => setSupplierOptions(data));
    fetch("http://192.168.10.10:5000/api/status-pengiriman")
      .then((res) => res.json())
      .then((data) => setStatusPengirimanOptions(data));
  }, []);

  // Handler tambah supplier
  const handleAddSupplier = async () => {
    if (!newSupplier.trim()) return;
    const res = await fetch("http://192.168.10.10:5000/api/supplier", {
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
    const res = await fetch("http://192.168.10.10:5000/api/status-pengiriman", {
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
      const res = await fetch(`http://192.168.10.10:5000/api/supplier/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namaSupplier: editSupplierValue }),
      });
      if (res.ok) {
        fetch("http://192.168.10.10:5000/api/supplier")
          .then((res) => res.json())
          .then((data) => setSupplierOptions(data));
        setEditSupplierId(null);
        setEditSupplierValue("");
      }
    } catch {}
  };

  // Handler hapus supplier
  const handleDeleteSupplier = async (id: string) => {
    if (!id) return;
    if (!window.confirm("Yakin ingin menghapus supplier ini?")) return;
    try {
      const res = await fetch(`http://192.168.10.10:5000/api/supplier/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetch("http://192.168.10.10:5000/api/supplier")
          .then((res) => res.json())
          .then((data) => setSupplierOptions(data));
      }
    } catch {}
  };

  // Handler edit status pengiriman
  const handleEditStatusPengiriman = async (id: string) => {
    if (!editStatusPengirimanValue.trim()) return;
    try {
      const res = await fetch(
        `http://192.168.10.10:5000/api/status-pengiriman/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status_pengiriman: editStatusPengirimanValue,
          }),
        }
      );
      if (res.ok) {
        fetch("http://192.168.10.10:5000/api/status-pengiriman")
          .then((res) => res.json())
          .then((data) => setStatusPengirimanOptions(data));
        setEditStatusPengirimanId(null);
        setEditStatusPengirimanValue("");
      }
    } catch {}
  };

  // Handler hapus status pengiriman
  const handleDeleteStatusPengiriman = async (id: string) => {
    if (!id) return;
    if (!window.confirm("Yakin ingin menghapus status pengiriman ini?")) return;
    try {
      const res = await fetch(
        `http://192.168.10.10:5000/api/status-pengiriman/${id}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        fetch("http://192.168.10.10:5000/api/status-pengiriman")
          .then((res) => res.json())
          .then((data) => setStatusPengirimanOptions(data));
      }
    } catch {}
  };

  // Handler submit PO
  const handleCreatePO = async () => {
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

    // Get logged in user data
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const orderedByUserId = userData.id_user || userData.id || null; // <-- ambil id_user
    const userSkema = userData.id_skema || null;

    try {
      // 1. POST PO ke backend with correct field references
      const poRes = await fetch("http://192.168.10.10:5000/api/po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noPO: poFormData.noPO,
          tanggalPO:
            typeof poFormData.tanggalPO === "string"
              ? poFormData.tanggalPO
              : formatDateForBackend(poFormData.tanggalPO),
          // gunakan format string YYYY-MM-DD
          id_supplier: poFormData.supplier, // Use supplier ID from form data
          diskon: poFormData.diskon,
          originalDiskon: calculations.totalDiscount,
          ppn: parseFloat(poFormData.ppn),
          ppnAmount: calculations.ppnAmount,
          totalPembayaran: calculations.totalPayment,
          orderedBy: orderedByUserId, // <-- kirim id_user, bukan nama
          estimasiTanggalTerima: formatDateForBackend(
            poFormData.estimasiTanggalDiterima
          ), // gunakan value dari input user, format YYYY-MM-DD
          id_statusPengiriman: poFormData.statusPengiriman, // Use status IDs from form
          status: "Menunggu",
          createdAt: new Date().toISOString(),
          id_skema: userSkema,
        }),
      });
      const poDataRes = await poRes.json();
      const id_PO = poDataRes.id_PO || poDataRes.id || null;

      // 2. POST setiap PO Item ke backend dan PUT PR Item untuk update jumlah
      for (const poItem of poItems) {
        for (const item of poItem.items) {
          // A. Create PO Item
          await fetch("http://192.168.10.10:5000/api/po-item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_PO,
              id_PRItem: item.id_PRItem ?? item.id,
              hargaSatuan: item.hargaSatuan,
              jumlahPO: item.jumlahPO,
              jumlahAsli: item.jumlahAsli,
              diskonItem: item.diskonItem || 0, // per item
              ppnItem: item.ppnItem || 0, // per item
              keterangan: item.keterangan,
              id_satuan: item.id_satuan,
            }),
          });

          // B. Get current PR Item data
          const prItemRes = await fetch(
            `http://192.168.10.10:5000/api/pr-item/${item.id}`
          );
          const prItemData = await prItemRes.json();

          // Calculate new quantity
          const newJumlah = Math.max(0, item.jumlahAsli - item.jumlahPO);

          // C. Update PR Item with complete payload
          await fetch(`http://192.168.10.10:5000/api/pr-item/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_PR: poItem.prId,
              namaBarang: item.namaBarang,
              jumlah: newJumlah,
              originalJumlah: prItemData.originalJumlah || item.jumlahAsli,
              quantityAwalPR: prItemData.quantityAwalPR || item.jumlahAsli,
              id_satuan: prItemData.id_satuan || item.id_satuan, // <-- always send id_satuan from PR item, fallback to PO item mapping
              keterangan: item.keterangan || "",
            }),
          });
        }
      }

      // === Tambahan: Update status PR (Gantung/Telah Selesai) ===
      // Ambil semua prId unik dari poItems
      const prIds = Array.from(new Set(poItems.map((poItem) => poItem.prId)));
      for (const prId of prIds) {
        // Ambil semua item PR dari backend
        const prItemRes = await fetch(
          `http://192.168.10.10:5000/api/pr-item/pr/${prId}`
        );
        const prItems = await prItemRes.json();
        // Jika semua jumlah === 0 -> Telah Selesai, jika ada yang > 0 -> Gantung
        const allZero = prItems.every((item: any) => Number(item.jumlah) === 0);
        const newStatus = allZero ? "Telah Selesai" : "Gantung";
        // Ambil data PR lama
        const prRes = await fetch(`http://192.168.10.10:5000/api/pr/${prId}`);
        const prData = await prRes.json();
        // Kirim semua field PR lama + status baru
        // --- Tambahkan log payload sebelum PUT ---
        const payload = {
          noPR: prData.noPR,
          tanggalPR: normalizeToDateString(prData.tanggalPR),
          id_divisi: prData.id_divisi,
          id_urgensi: prData.id_urgensi,
          status: newStatus,
          dibuatOleh: prData.dibuatOleh,
          id_skema: prData.id_skema,
          createdAt: prData.createdAt,
        };
        console.log("PUT /api/pr payload:", payload);
        await fetch(`http://192.168.10.10:5000/api/pr/${prId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      // Reset form
      setPoFormData({
        noPO: `PO/2024/${String(poData.length + 1).padStart(3, "0")}`,
        tanggalPO: new Date().toISOString().split("T")[0],
        supplier: "",
        estimasiTanggalDiterima: "",
        diskon: "",
        ppn: "11",
        statusPengiriman: "",
        skema: userSkema, // reset skema dari user login
      });

      setPoItems([]);
      setDiscountBreakdown([]);

      setNotif({
        type: "success",
        message: `PO ${poFormData.noPO} berhasil dibuat!`,
      });
      setTimeout(() => {
        setNotif(null);
        window.location.href = "/po/status";
      }, 1800);
    } catch (err) {
      console.error("Error creating PO:", err);
      setNotif({
        type: "error",
        message: "Gagal membuat PO. Silakan coba lagi.",
      });
      setTimeout(() => setNotif(null), 2500);
    }
  };

  useEffect(() => {
    // Ganti loadData dengan fetch dari backend
    const fetchPRData = async () => {
      // Fetch referensi satuan/divisi/urgensi jika perlu (optional)
      // Fetch PR utama
      const prRes = await fetch("http://192.168.10.10:5000/api/pr");
      const prList = await prRes.json();
      // Fetch PR item
      const prItemRes = await fetch("http://192.168.10.10:5000/api/pr-item");
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
    }));
  }, []);

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
  // const [selectedPRsForPO, setSelectedPRsForPO] = useState<any[]>([]); // HAPUS BARIS INI

  // Tambahkan state untuk referensi urgensi/divisi/satuan
  const [divisiOptions, setDivisiOptions] = useState<any[]>([]);
  const [urgensiOptions, setUrgensiOptions] = useState<any[]>([]);
  const [satuanOptions, setSatuanOptions] = useState<any[]>([]);

  useEffect(() => {
    // Fetch referensi dari backend
    fetch("http://192.168.10.10:5000/api/divisi")
      .then((res) => res.json())
      .then((data) => setDivisiOptions(data));
    fetch("http://192.168.10.10:5000/api/urgensi")
      .then((res) => res.json())
      .then((data) => setUrgensiOptions(data));
    fetch("http://192.168.10.10:5000/api/satuan")
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
      const prRes = await fetch("http://192.168.10.10:5000/api/pr");
      const prList = await prRes.json();
      // Fetch PR item
      const prItemRes = await fetch("http://192.168.10.10:5000/api/pr-item");
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
    if (selectedFromStatus) {
      try {
        const selectedPRData = JSON.parse(selectedFromStatus);
        setPoItems(
          selectedPRData.map((pr: any) => ({
            prId: pr.id_PR ?? pr.id,
            noPR: pr.noPR,
            tanggalPR: pr.tanggalPR,
            skema: pr.id_skema ?? "",
            items: (pr.items || []).map((item: any) => ({
              id: item.id_PRItem ?? item.id,
              namaBarang: item.namaBarang ?? item.namabarang,
              jumlahPO: item.jumlah,
              jumlahAsli: item.jumlah,
              satuanLabel: item.satuanLabel || item.satuan || "",
              id_satuan: item.id_satuan ?? item.idSatuan ?? null, // <-- always keep id_satuan
              hargaSatuan: 0,
              diskonItem: "", // default string
              ppnItem: 11, // default (atau 0)
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
    }
  }, []);

  // Tambahkan handler terpisah agar lebih rapi
  function handleHargaSatuanChange(
    prId: string,
    itemId: string,
    value: string
  ) {
    const cleanValue = value.replace(/[.,]/g, "");
    const newPrice = Math.max(0, parseInt(cleanValue) || 0);
    setPoItems((prevPoItems) =>
      prevPoItems.map((pItem) =>
        pItem.prId === prId
          ? {
              ...pItem,
              items: pItem.items.map((i) =>
                i.id === itemId
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
                  let newQty = Math.max(0, parseInt(value) || 0);
                  if (newQty > maxQty) newQty = maxQty;
                  return { ...i, jumlahPO: newQty };
                }
                return i;
              }),
            }
          : pItem
      )
    );
  }

  // Tambahkan state untuk tracking field diskon mana yang terakhir diubah
  const [lastDiskonChanged, setLastDiskonChanged] = useState<{
    [key: string]: "persen" | "nominal";
  }>({
    // Contoh inisialisasi, jika perlu
    // "prId-itemId": "persen",
  });

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
                  const harga = Number(i.hargaSatuan) || 0;
                  const qty = Number(i.jumlahPO) || 0;
                  const itemSubtotal = harga * qty;
                  // Stack diskon persen
                  let currentAmount = itemSubtotal;
                  let diskonAmount = 0;
                  const diskonPersenArr = value
                    .split("+")
                    .map((d) => d.trim())
                    .filter((d) => d.endsWith("%"))
                    .map((d) => parseFloat(d.replace("%", "")))
                    .filter((v) => !isNaN(v));
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
                  const harga = Number(i.hargaSatuan) || 0;
                  const qty = Number(i.jumlahPO) || 0;
                  const itemSubtotal = harga * qty;
                  const diskonNominal = parseFloat(value) || 0;
                  let diskonPersen = "";
                  if (itemSubtotal > 0 && diskonNominal > 0) {
                    const persen = (diskonNominal / itemSubtotal) * 100;
                    // Jika persen bulat, tampilkan tanpa koma. Jika ada koma, tampilkan aslinya (misal 17.5%)
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
                      ppnItem: value === "" ? "" : Number(value),
                    }
                  : i
              ),
            }
          : pItem
      )
    );
  }

  // Helper untuk label satuan dari satuanOptions
  function getSatuanLabel(satuanValue: string) {
    const found = satuanOptions.find(
      (s: any) => String(s.id_satuan) === String(satuanValue)
    );
    return found ? found.satuan : satuanValue;
  }

  // Helper format tanggal ke yyyy-mm-dd untuk backend
  function formatDateForBackend(date: Date | string | null) {
    if (!date) return "";
    return dayjs(date).utc().format("YYYY-MM-DD");
  }
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                {/* No PO */}
                <div className="space-y-2">
                  <Label htmlFor="noPO">No. PO</Label>
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
                  <Label htmlFor="tanggalPO">Tanggal PO</Label>
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
                    popperPlacement="right" // <-- Tambahkan ini agar popper muncul di kanan
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
                {/* Estimasi Tanggal Terima */}
                <div className="space-y-2">
                  <Label htmlFor="estimasiTanggalDiterima">
                    Estimasi Tanggal Diterima
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
                    popperPlacement="right" // <-- Tambahkan ini agar popper muncul di kanan
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
              </div>

              {/* Baris 2: Supplier, Status Pengiriman, Skema */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                {/* Supplier */}
                <div className="space-y-2">
                  <Label
                    htmlFor="supplier"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Supplier
                  </Label>
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
                        <Input
                          placeholder="Cari supplier..."
                          value={supplierSearch}
                          onChange={(e) => setSupplierSearch(e.target.value)}
                          className="mb-2"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mb-2 w-full"
                          onClick={() => setShowAddSupplier((v) => !v)}
                        >
                          + Tambahkan Supplier
                        </Button>
                        {showAddSupplier && (
                          <div className="flex items-center gap-2 mb-2">
                            <Input
                              placeholder="Nama supplier baru"
                              value={newSupplier}
                              onChange={(e) => setNewSupplier(e.target.value)}
                              className="w-[140px]"
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
                        )}
                      </div>
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
                                  />
                                  <Button
                                    type="button"
                                    size="xs"
                                    className="px-2 py-1 text-xs bg-primary text-white"
                                    onClick={() =>
                                      handleEditSupplier(
                                        String(sup.id_supplier)
                                      )
                                    }
                                  >
                                    Simpan
                                  </Button>
                                  <Button
                                    type="button"
                                    size="xs"
                                    variant="outline"
                                    className="px-2 py-1 text-xs"
                                    onClick={() => {
                                      setEditSupplierId(null);
                                      setEditSupplierValue("");
                                    }}
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
                                  >
                                    {sup.namaSupplier}
                                  </SelectItem>
                                  <Button
                                    type="button"
                                    size="xs"
                                    variant="ghost"
                                    className="text-xs text-blue-600 px-1 py-0.5"
                                    onClick={() => {
                                      setEditSupplierId(
                                        String(sup.id_supplier)
                                      );
                                      setEditSupplierValue(sup.namaSupplier);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    size="xs"
                                    variant="ghost"
                                    className="text-xs text-red-600 px-1 py-0.5"
                                    onClick={() =>
                                      handleDeleteSupplier(
                                        String(sup.id_supplier)
                                      )
                                    }
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
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Pengiriman */}
                <div className="space-y-2">
                  <Label
                    htmlFor="statusPengiriman"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Status Pengiriman
                  </Label>
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
                        <Input
                          placeholder="Cari status pengiriman..."
                          value={statusPengirimanSearch}
                          onChange={(e) =>
                            setStatusPengirimanSearch(e.target.value)
                          }
                          className="mb-2"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mb-2 w-full"
                          onClick={() => setShowAddStatusPengiriman((v) => !v)}
                        >
                          + Tambahkan Status Pengiriman
                        </Button>
                        {showAddStatusPengiriman && (
                          <div className="flex items-center gap-2 mb-2">
                            <Input
                              placeholder="Status pengiriman baru"
                              value={newStatusPengiriman}
                              onChange={(e) =>
                                setNewStatusPengiriman(e.target.value)
                              }
                              className="w-[140px]"
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
                        )}
                      </div>
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
                                  />
                                  <Button
                                    type="button"
                                    size="xs"
                                    className="px-2 py-1 text-xs bg-primary text-white"
                                    onClick={() =>
                                      handleEditStatusPengiriman(
                                        String(opt.id_statusPengiriman)
                                      )
                                    }
                                  >
                                    Simpan
                                  </Button>
                                  <Button
                                    type="button"
                                    size="xs"
                                    variant="outline"
                                    className="px-2 py-1 text-xs"
                                    onClick={() => {
                                      setEditStatusPengirimanId(null);
                                      setEditStatusPengirimanValue("");
                                    }}
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
                                  >
                                    {opt.status_pengiriman}
                                  </SelectItem>
                                  <Button
                                    type="button"
                                    size="xs"
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
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    type="button"
                                    size="xs"
                                    variant="ghost"
                                    className="text-xs text-red-600 px-1 py-0.5"
                                    onClick={() =>
                                      handleDeleteStatusPengiriman(
                                        String(opt.id_statusPengiriman)
                                      )
                                    }
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
                    </SelectContent>
                  </Select>
                </div>

                {/* Skema */}
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
                    className="border-border focus:border-primary/50 bg-gray-100"
                  />
                </div>
              </div>

              {/* Baris 3: Detail Barang dari PR */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Detail Barang dari PR
                </h3>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. PR</TableHead>
                        <TableHead>Nama Barang</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Satuan</TableHead>
                        <TableHead>Harga Satuan</TableHead>
                        <TableHead>Diskon (%)</TableHead>
                        <TableHead>Diskon (Rp)</TableHead>
                        <TableHead>SUB (Setelah Diskon)</TableHead>
                        <TableHead>PPN (%)</TableHead>
                        <TableHead>PPN (Rp)</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Keterangan</TableHead>
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
                          const harga = Number(item.hargaSatuan) || 0;
                          const qty = Number(item.jumlahPO) || 0;
                          const ppn = Number(item.ppnItem) || 0;
                          const itemSubtotal = harga * qty;

                          // Gunakan hanya salah satu diskon (yang terakhir diubah user)
                          const diskonKey = item.prId + "-" + item.id;
                          let diskonAmount = 0;
                          if (lastDiskonChanged[diskonKey] === "persen") {
                            // Hitung dari persen (stacked)
                            let currentAmount = itemSubtotal;
                            const diskonPersenArr = (item.diskonPersen || "")
                              .split("+")
                              .map((d) => d.trim())
                              .filter((d) => d.endsWith("%"))
                              .map((d) => parseFloat(d.replace("%", "")))
                              .filter((v) => !isNaN(v));
                            diskonPersenArr.forEach((persen) => {
                              const amount = currentAmount * (persen / 100);
                              diskonAmount += amount;
                              currentAmount -= amount;
                            });
                          } else if (
                            lastDiskonChanged[diskonKey] === "nominal"
                          ) {
                            diskonAmount = parseFloat(item.diskonNominal) || 0;
                          } else {
                            // Default: tidak ada diskon
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
                            subtotalItem = afterDiskon + ppnAmount;
                            total = afterDiskon + ppnAmount;
                          } else {
                            subtotalItem = afterDiskon;
                            total = afterDiskon + ppnAmount;
                          }

                          return (
                            <TableRow key={item.id}>
                              <TableCell>{item.noPR}</TableCell>
                              <TableCell>{item.namaBarang}</TableCell>
                              <TableCell>
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
                                  className="w-20"
                                />
                                <span className="text-xs text-muted-foreground ml-2">
                                  /{" "}
                                  {Number(item.jumlahAsli) % 1 === 0
                                    ? parseInt(item.jumlahAsli)
                                    : item.jumlahAsli}
                                </span>
                              </TableCell>
                              <TableCell>
                                {getSatuanLabel(item.id_satuan) ||
                                  item.satuanLabel ||
                                  item.satuan}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  value={
                                    item.hargaSatuan
                                      ? `Rp. ${Number(
                                          item.hargaSatuan
                                        ).toLocaleString("id-ID")}`
                                      : ""
                                  }
                                  onWheel={(e) => e.currentTarget.blur()}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(
                                      /[^\d]/g,
                                      ""
                                    );
                                    handleHargaSatuanChange(
                                      item.prId,
                                      item.id,
                                      raw
                                    );
                                  }}
                                  className="w-24 text-right"
                                  placeholder="Rp. 0"
                                  autoComplete="off"
                                />
                              </TableCell>
                              <TableCell>
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
                                  className="w-20 text-right"
                                  placeholder="10%+5%"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="text"
                                  value={
                                    item.diskonNominal
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
                                  className="w-24 text-right"
                                  placeholder="Rp. 0"
                                />
                              </TableCell>
                              <TableCell>
                                Rp {afterDiskon.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.ppnItem ?? ""}
                                  min={0}
                                  max={100}
                                  onChange={(e) =>
                                    handlePPNItemChange(
                                      item.prId,
                                      item.id,
                                      e.target.value
                                    )
                                  }
                                  className="w-16 text-right"
                                  placeholder="11"
                                />
                              </TableCell>
                              <TableCell>
                                Rp {ppnAmount.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell>
                                Rp {total.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell>
                                <div
                                  className="text-sm text-muted-foreground max-w-xs truncate"
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
                        <div className="flex justify-between font-medium">
                          <span>Total Diskon:</span>
                          <span className="text-destructive">
                            -Rp{" "}
                            {calculations.totalDiskon.toLocaleString("id-ID")}
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
                                calculations.totalPPN.toLocaleString("id-ID")
                              : "+Rp " +
                                calculations.totalPPN.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <hr className="my-2" />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Pembayaran:</span>
                          <span className="text-primary">
                            Rp{" "}
                            {calculations.totalPayment.toLocaleString("id-ID")}
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
    </MainLayout>
  );
}
