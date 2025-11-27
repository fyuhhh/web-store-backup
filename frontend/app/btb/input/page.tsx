"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/app/pr/input-baru/datepicker-red-weekend.css";

// Import exceljs for Excel export with style support
import * as ExcelJS from "exceljs";
import dayjs from "dayjs";

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

// Tambahkan helper formatRupiahInput agar input biaya selalu tampil Rp
function formatRupiahInput(val: any) {
  if (val === undefined || val === "" || isNaN(val)) return "";
  return "Rp " + Number(val).toLocaleString("id-ID");
}

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
  const [formData, setFormData] = useState<any>({
    noBTB: "",
    tanggal: null, // <-- pastikan default null, tidak auto terisi
    periode: "",
    supplier: "",
    kodeSupplier: "",
    barang: "",
    jumlah: "",
    satuan: "",
    biaya: 0,
    diterimaOleh: "",
    poId: "",
    tanggalDiterima: null,
    skema: "",
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
          qtySisa: item.qtySisa ?? item.jumlahPO,
          poItemId: poItem.noPR + "-" + item.id,
          satuan: item.satuan,
          id_satuan: item.id_satuan ?? null, // <-- pastikan id_satuan ikut
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
  const [userSkemaId, setUserSkemaId] = useState<string>(""); // Tambah state id_skema user
  const [supplierList, setSupplierList] = useState<any[]>([]);
  const [skemaList, setSkemaList] = useState<any[]>([]);
  const [skemaMap, setSkemaMap] = useState<Record<string, string>>({});

  useEffect(() => {
<<<<<<< HEAD
    // Pastikan tidak ada merge conflict marker dan gunakan hanya satu versi
    // Jika loadData/setSelectedPOsForBTB/setUserSchema/setUserSkemaId/setSupplierList/setSkemaList/setSkemaMap tidak ada, hapus pemanggilannya
    // ...panggil API yang diperlukan saja...
    // Ambil skema user dari localStorage
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    setUserSkema(userData.skema || "");
    // Ambil supplier dan status pengiriman dari backend
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


=======
    loadData();
    setSelectedPOsForBTB([]);
    // Ambil skema user dari localStorage
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    setUserSchema(userData.skema || "");
    setUserSkemaId(String(userData.id_skema ?? userData.skema ?? "")); // Set id_skema user
    // Ambil supplier dan skema dari backend
    fetch("http://localhost:5000/api/supplier")
      .then((r) => r.json())
      .then((data) => setSupplierList(data));
    fetch("http://localhost:5000/api/skema")
      .then((r) => r.json())
      .then((data) => {
        setSkemaList(data);
        setSkemaMap(
          Object.fromEntries(
            data.map((s: any) => [String(s.id_skema), s.skema])
          )
        );
      });
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

  // Tambahkan state untuk data PO dari backend
  const [backendPOData, setBackendPOData] = useState<any[]>([]);

>>>>>>> 3e1e178dc16ce262ae83d76241f3500a56e79817
  // Ambil data PO dari backend dan mapping seperti monitoring PO
  useEffect(() => {
    async function fetchPOBackend() {
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
          userRes,
        ] = await Promise.all([
<<<<<<< HEAD
          fetch("http://192.168.10.10:5000/api/po"),
          fetch("http://192.168.10.10:5000/api/po-item"),
          fetch("http://192.168.10.10:5000/api/pr-item"),
          fetch("http://192.168.10.10:5000/api/pr"),
          fetch("http://192.168.10.10:5000/api/supplier"),
          fetch("http://192.168.10.10:5000/api/status-permintaan"),
          fetch("http://192.168.10.10:5000/api/status-pengiriman"),
          fetch("http://192.168.10.10:5000/api/skema"),
          fetch("http://192.168.10.10:5000/api/user"),
=======
          fetch("http://localhost:5000/api/po"),
          fetch("http://localhost:5000/api/po-item"),
          fetch("http://localhost:5000/api/pr-item"),
          fetch("http://localhost:5000/api/pr"),
          fetch("http://localhost:5000/api/supplier"),
          fetch("http://localhost:5000/api/status-permintaan"),
          fetch("http://localhost:5000/api/status-pengiriman"),
          fetch("http://localhost:5000/api/skema"),
          fetch("http://localhost:5000/api/user"),
>>>>>>> 3e1e178dc16ce262ae83d76241f3500a56e79817
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
          userList,
        ] = await Promise.all([
          poRes.json(),
          poItemRes.json(),
          prItemRes.json(),
          prRes.json(),
          supRes.json(),
          statusPermintaanRes.json(),
          statusPengirimanRes.json(),
          skemaRes.json(),
          userRes.json(),
        ]);

        // Helper maps
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
        const userMap = Object.fromEntries(
          userList.map((u: any) => [String(u.id_user), u.nama_pengguna])
        );

        // Mapping PO persis seperti monitoring PO
        const mappedPOs = (poList || []).map((po: any) => {
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
            // --- Perubahan: urutkan item berdasarkan id_PRItem ASC ---
            const item = {
              id: prItem.id_PRItem ?? prItem.id ?? pi.id_PRItem ?? null,
              namaBarang: prItem.namaBarang ?? prItem.namabarang ?? "",
              jumlahPO: Number(pi.jumlahPO) || Number(pi.jumlah) || 0,
              jumlahAsli: Number(pi.jumlahAsli) || Number(pi.jumlah) || 0,
              satuan:
                prItem.satuanLabel || prItem.satuan || prItem.id_satuan || "",
              id_satuan: prItem.id_satuan ?? pi.id_satuan ?? null,
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
          // --- Pastikan urutan item di setiap poItems sesuai id ASC ---
          poItemsGrouped.forEach((group) => {
            group.items.sort(
              (a: any, b: any) => Number(a.id ?? 0) - Number(b.id ?? 0)
            );
          });

          // Build labels using maps
          const statusPermintaanLabel =
            statusPermintaanMap[String(po.id_statusPermintaan)] ||
            po.statusPermintaan ||
            String(po.id_statusPermintaan || "");
          const statusPengirimanLabel =
            statusPengirimanMap[String(po.id_statusPengiriman)] ||
            po.statusPengiriman ||
            String(po.id_statusPengiriman || "");
          const orderedByName =
            userMap[String(po.orderedBy)] ||
            po.orderedBy ||
            po.dipesanOleh ||
            "";

          return {
            id: po.id_PO ?? po.id,
            noPO: po.noPO ?? "",
            tanggalPO: po.tanggalPO,
            estimasiTanggalTerima: po.estimasiTanggalTerima,
            supplier:
              supplierMap[String(po.id_supplier)] ||
              po.supplier ||
              String(po.id_supplier || ""),
            id_supplier: po.id_supplier ?? null, // <-- tambahkan id_supplier di objek PO
            poItems: poItemsGrouped,
            totalPembayaran: Number(po.totalPembayaran) || 0,
            statusPermintaan: statusPermintaanLabel,
            statusPengiriman: statusPengirimanLabel,
            status: po.status ?? "Menunggu",
            orderedBy: orderedByName,
            skema: po.id_skema ?? "",
          };
        });

        setBackendPOData(mappedPOs);
      } catch (err) {
<<<<<<< HEAD
        // Hindari error jika setBackendPOData tidak ada, atau jika tidak digunakan, hapus saja
        // Jika memang tidak ada state/setter bernama setBackendPOData, hapus baris ini:
        // setBackendPOData([]);
        // Jika ada, tetap panggil untuk reset data:
        if (typeof setBackendPOData === "function") {
          setBackendPOData([]);
        }
        // Atau cukup diamkan jika tidak perlu reset state
      }
    }
    fetchPOBackend();
  }, []);

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
=======
        setBackendPOData([]);
      }
>>>>>>> 3e1e178dc16ce262ae83d76241f3500a56e79817
    }
    fetchPOBackend();
    // ...existing code...
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
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
<<<<<<< HEAD
    const orderedByUserId = userData.id_user || userData.id || null;
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
          id_supplier: poFormData.supplier,
          diskon: parseDiskonPersenToNumber(poFormData.diskon),
          originalDiskon: calculations.totalDiskon,
          ppn: parseFloat(poFormData.ppn),
          ppnAmount: calculations.totalPPN,
          totalPembayaran: calculations.totalPayment,
          orderedBy: orderedByUserId,
          estimasiTanggalTerima: formatDateForBackend(
            poFormData.estimasiTanggalDiterima
          ),
          id_statusPengiriman: poFormData.statusPengiriman,
          status: "Menunggu",
          createdAt: new Date().toISOString(),
          id_skema: userSkema,
=======
    const userSkema = userData.skema || "";

    if (storedPO) {
      // Filter PO sesuai skema user
      setPoData(
        JSON.parse(storedPO).filter(
          (po: any) => !userSkema || po.skema === userSkema
        )
      );
    }
    if (storedBTB) {
      // Filter BTB sesuai skema user
      const btbArr = JSON.parse(storedBTB)
        .filter((btb: any) => !userSkema || btb.skema === userSkema)
        .map((btb: any) => ({
          ...btb,
          skema: btb.skema ?? "pentacity",
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

  // Helper format tanggal ke yyyy-mm-dd untuk backend
  function formatDateForBackend(date: Date | null) {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatTanggalLebihSehari(tgl: string) {
    if (!tgl) return "";
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

  function formatTanggalPlus2(tgl: string) {
    if (!tgl) return "";
    let dateObj;
    if (/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
      dateObj = dayjs(tgl).add(2, "day");
    } else if (tgl.includes("T")) {
      dateObj = dayjs.utc(tgl).add(2, "day");
    } else {
      dateObj = dayjs(tgl).add(2, "day");
    }
    return dateObj.format("DD-MM-YYYY");
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
    if (!formData.tanggal) {
      setNotif({ type: "error", message: "Tanggal BTB wajib diisi." });
      setTimeout(() => setNotif(null), 3000);
      return;
    }
    if (!formData.noBTB || !formData.tanggal) {
      setNotif({ type: "error", message: "No BTB dan Tanggal wajib diisi." });
      setTimeout(() => setNotif(null), 2500);
      return;
    }

    try {
      // 1. POST header BTB
      // Ambil id_po, id_supplier, id_skema dari PO pertama
      const id_po = selectedPOsForBTB[0]?.id ?? null;
      const id_supplier = formData.supplier; // <-- ini id_supplier (number/integer)
      const id_skema = selectedPOsForBTB[0]?.skema ?? null;

      // Pastikan yang dikirim ke backend adalah nama_supplier: formData.supplier
      const btbHeaderRes = await fetch("http://localhost:5000/api/btb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          no_btb: formData.noBTB,
          tanggal_btb: formatDateForBackend(formData.tanggal),
          periode: formData.periode,
          id_po,
          id_supplier, // <-- kirim id_supplier (number/integer)
          nama_supplier: getSupplierLabel(id_supplier), // label supplier (opsional)
          id_user: userData.id_user || userData.id,
          id_skema,
          biaya: Math.round(formData.biaya), // <-- pastikan integer
          diterima_oleh: userData.id_user || userData.id,
          tanggal_diterima: formatDateForBackend(formData.tanggalDiterima),
          // status dan created_at otomatis di backend
>>>>>>> 3e1e178dc16ce262ae83d76241f3500a56e79817
        }),
      });
      if (!btbHeaderRes.ok) throw new Error("Gagal menyimpan header BTB");
      const btbHeaderData = await btbHeaderRes.json();
      const id_btb = btbHeaderData.id;

<<<<<<< HEAD
      // 2. POST setiap PO Item ke backend dan PUT PR Item untuk update jumlah
      for (const poItem of poItems) {
        for (const item of poItem.items) {
          const jumlahPOInt = Math.floor(Number(item.jumlahPO)) || 0;
          const jumlahAsliInt = Math.floor(Number(item.jumlahAsli)) || 0;

          let diskonPersenValue = 0;
          if (item.diskonPersen && typeof item.diskonPersen === "string") {
            const match = item.diskonPersen.match(/(\d+(\.\d+)?)/);
            diskonPersenValue = match ? parseFloat(match[1]) : 0;
          }
          const diskonRupiahValue = Number(item.diskonNominal) || 0;
          const ppnPersenValue = Number(item.ppnItem) || 0;
          const harga = Number(item.hargaSatuan) || 0;
          const qty = Number(item.jumlahPO) || 0;
          const itemSubtotal = harga * qty;
          let diskonAmount = 0;
          if (item.diskonPersen && typeof item.diskonPersen === "string") {
            let currentAmount = itemSubtotal;
            const diskonPersenArr = item.diskonPersen
              .split("+")
              .map((d) => d.trim())
              .filter((d) => d.endsWith("%"))
              .map((d) => parseFloat(d.replace("%", "").replace(",", ".")))
              .filter((v) => !isNaN(v));
            diskonPersenArr.forEach((persen) => {
              const amount = currentAmount * (persen / 100);
              diskonAmount += amount;
              currentAmount -= amount;
            });
          } else if (item.diskonNominal) {
            diskonAmount = Number(item.diskonNominal) || 0;
          }
          const afterDiskon = Math.max(0, itemSubtotal - diskonAmount);
          const ppnRupiahValue = afterDiskon * (ppnPersenValue / 100);
          const totalPerItem = afterDiskon + ppnRupiahValue;

          await fetch("http://192.168.10.10:5000/api/po-item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_PO,
              id_PRItem: item.id_PRItem ?? item.id,
              hargaSatuan: item.hargaSatuan,
              jumlahPO: jumlahPOInt,
              jumlahAsli: jumlahAsliInt,
              diskonPersen: diskonPersenValue,
              diskonRupiah: diskonRupiahValue,
              ppnPersen: ppnPersenValue,
              ppnRupiah: ppnRupiahValue,
              totalPerItem,
              keterangan: item.keterangan,
              id_satuan: item.id_satuan,
            }),
          });

          // Update PR Item
          const prItemRes = await fetch(
            `http://192.168.10.10:5000/api/pr-item/${item.id}`
          );
          const prItemData = await prItemRes.json();
          const newJumlah = Math.max(0, jumlahAsliInt - jumlahPOInt);

          await fetch(`http://192.168.10.10:5000/api/pr-item/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_PR: poItem.prId,
              namaBarang: item.namaBarang,
              jumlah: newJumlah,
              originalJumlah: prItemData.originalJumlah || jumlahAsliInt,
              quantityAwalPR: prItemData.quantityAwalPR || jumlahAsliInt,
              id_satuan: prItemData.id_satuan || item.id_satuan,
              keterangan: item.keterangan || "",
            }),
=======
      // 2. POST setiap item ke /api/btb-item
      // Setelah insert header BTB dan dapat id_btb
      // Ambil data PO Item dari backend (pastikan sudah ada di database)
      const poItemsRes = await fetch(
        "http://localhost:5000/api/po-item?po=" + id_po
      );
      const poItems = await poItemsRes.json();

      // Mapping item BTB dengan id_POItem dan id_satuan yang benar
      const items = selectedPOItems.flatMap((po) =>
        po.items
          .filter((item) => (btbInputQty[item.poItemId] ?? 0) > 0)
          .map((item) => {
            // Cari poItem dari poItems (ambil id_POItem dan id_satuan)
            const poItem = poItems.find(
              (p) =>
                String(p.id_PRItem) === String(item.id) ||
                p.namaBarang === item.namaBarang
            );
            // --- FIX: pastikan hargaSatuan integer ---
            const hargaSatuanInt = poItem?.hargaSatuan
              ? Math.round(Number(poItem.hargaSatuan))
              : 0;
            return {
              id_POItem: poItem?.id_POItem,
              nama_barang: item.namaBarang,
              jumlah_diterima: Math.round(btbInputQty[item.poItemId] ?? 0), // integer
              id_satuan: item.id_satuan ?? poItem?.id_satuan ?? null,
              keterangan: item.keterangan ?? "",
              hargaSatuan: hargaSatuanInt, // <-- tambahkan jika ingin kirim ke backend
            };
          })
          .filter((item) => !!item.id_POItem)
      );

      // LOG: dikirim frontend ke btb (header dan items)
      console.log("DIKIRIM FRONTEND KE BTB HEADER:", {
        no_btb: formData.noBTB,
        tanggal_btb: formData.tanggal,
        periode: formData.periode,
        id_po,
        id_supplier: formData.supplier,
        nama_supplier: getSupplierLabel(formData.supplier),
        id_user: userData.id_user || userData.id,
        id_skema,
        biaya: Math.round(formData.biaya),
        diterima_oleh: userData.id_user || userData.id,
        tanggal_diterima: formData.tanggal,
      });
      console.log("DIKIRIM FRONTEND KE BTB ITEMS:", items);

      for (const item of items) {
        // Validasi field
        if (!id_btb || !item.id_POItem || !item.nama_barang) {
          console.error("Field wajib kosong saat POST btb-item:", {
            id_btb,
            item,
>>>>>>> 3e1e178dc16ce262ae83d76241f3500a56e79817
          });
          continue; // skip jika field penting kosong
        }

<<<<<<< HEAD
      // Update status PR (Gantung/Telah Selesai)
      const prIds = Array.from(new Set(poItems.map((poItem) => poItem.prId)));
      for (const prId of prIds) {
        const prItemRes = await fetch(
          `http://192.168.10.10:5000/api/pr-item/pr/${prId}`
        );
        const prItems = await prItemRes.json();
        const allZero = prItems.every((item: any) => Number(item.jumlah) === 0);
        const newStatus = allZero ? "Telah Selesai" : "Gantung";
        const prRes = await fetch(`http://192.168.10.10:5000/api/pr/${prId}`);
        const prData = await prRes.json();
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
        await fetch(`http://192.168.10.10:5000/api/pr/${prId}`, {
=======
        // POST ke btb_item (ubah endpoint)
        const res = await fetch("http://localhost:5000/api/btb-item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_btb,
            id_POItem: item.id_POItem,
            nama_barang: item.nama_barang,
            jumlah_diterima: Math.round(item.jumlah_diterima), // integer
            id_satuan: item.id_satuan,
            keterangan: item.keterangan,
            qty_sisa: Math.round(item.jumlah_diterima), // integer
            // hargaSatuan: item.hargaSatuan, // opsional, jika backend ingin simpan
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error("Gagal insert btb_item:", errText);
        }
        // 3. Update jumlahPO di po_item (PUT)
        // Ambil data po_item lama
        const poItemRes = await fetch(
          `http://localhost:5000/api/po-item/${item.id_POItem}`
        );
        const poItemData = await poItemRes.json();
        const sisa =
          Math.max(
            0,
            Number(poItemData.jumlahPO || 0) - Number(item.jumlah_diterima)
          ) || 0;

        // Hanya kirim field yang valid untuk update po_item
        const {
          id_PO,
          id_PRItem,
          hargaSatuan,
          jumlahAsli,
          diskonItem,
          keterangan,
          // jumlahPO: diupdate
        } = poItemData;

        await fetch(`http://localhost:5000/api/po-item/${item.id_POItem}`, {
>>>>>>> 3e1e178dc16ce262ae83d76241f3500a56e79817
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_PO,
            id_PRItem,
            hargaSatuan,
            jumlahPO: sisa,
            jumlahAsli,
            diskonItem,
            keterangan,
          }),
        });
      }

      setNotif({ type: "success", message: "BTB berhasil disimpan!" });
      setTimeout(() => {
        setNotif(null);
        // Redirect jika perlu
      }, 1800);
      resetForm();
    } catch (err) {
      setNotif({ type: "error", message: "Gagal menyimpan BTB ke backend." });
      setTimeout(() => setNotif(null), 3000);
    }
  };

<<<<<<< HEAD
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
=======
  const resetForm = () => {
    setFormData({
      noBTB: "",
      tanggal: null,
      periode: "",
      supplier: "",
      kodeSupplier: "",
      barang: "",
      jumlah: "",
      satuan: "",
      biaya: 0,
      diterimaOleh: "",
      poId: "",
      tanggalDiterima: null,
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
>>>>>>> 3e1e178dc16ce262ae83d76241f3500a56e79817

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
<<<<<<< HEAD
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
=======
    const selectedPOObjects = filteredPOData.filter((po) =>
      selectedPOs.includes(po.id)
>>>>>>> 3e1e178dc16ce262ae83d76241f3500a56e79817
    );
    if (selectedPOObjects.length === 0) {
      alert("Pilih minimal satu PO untuk dibuat BTB.");
      return;
    }
    setSelectedPOsForBTB(selectedPOObjects);
    setShowForm(true);

    setSelectedPOItems(
      selectedPOObjects.map((po) => ({
        poId: po.id,
        noPO: po.noPO,
        supplier: po.supplier,
        items: getPOItemsWithSisa(po),
      }))
    );
    // LOG: diterima frontend dari PO (pastikan id_supplier adalah id PO, bukan label)
    console.log(
      "DITERIMA FRONTEND DARI PO:",
      selectedPOObjects.map((po) => ({
        id_PO: po.id,
        id_supplier: po.id_supplier ?? po.id_supplier, // pastikan ini id_supplier (number/integer)
        supplier: po.supplier,
        noPO: po.noPO,
        items: getPOItemsWithSisa(po).map((item) => ({
          namaBarang: item.namaBarang,
          id_satuan: item.id_satuan,
          satuan: item.satuan,
          qtySisa: item.qtySisa,
          poItemId: item.poItemId,
        })),
      }))
    );
    // Set initial BTB input qty to qtySisa for each item (bisa diubah user)
    const qtyObj: Record<string, number> = {};
    selectedPOObjects.forEach((po) => {
      getPOItemsWithSisa(po).forEach((item) => {
        qtyObj[item.poItemId] = item.qtySisa;
      });
    });
    setBtbInputQty(qtyObj);

    // Perbaiki error split: pastikan id string
    const firstPO = selectedPOObjects[0];
    let kodeSupplier = "";
    if (typeof firstPO.kodeSupplier === "string" && firstPO.kodeSupplier) {
      kodeSupplier = firstPO.kodeSupplier;
    } else if (firstPO.id !== undefined && firstPO.id !== null) {
      const idStr = String(firstPO.id);
      const idParts = idStr.split("-");
      kodeSupplier = idParts.length > 1 ? `SUP-${idParts[1]}` : "";
    }

    setFormData({
      noBTB: "",
      tanggal: null, // <-- pastikan tanggal kosong/null, tidak auto-isi
      periode: "",
      supplier: firstPO.id_supplier ?? "",
      supplierLabel: firstPO.supplier ?? "",
      noPO: firstPO.noPO ?? "", // <-- tambahkan ini
      barang: "",
      jumlah: "",
      satuan: "",
      biaya: firstPO.totalPembayaran?.toString() ?? "",
      diterimaOleh: "",
      poId: firstPO.id, // tetap simpan id untuk backend
      tanggalDiterima: "",
      skema: userData.skema || "pentacity",
    });

    // LOG: Daftar PO yang diterima oleh frontend (beserta id_supplier dan id_satuan tiap item)
    console.log("DAFTAR PO YANG DITERIMA OLEH FRONTEND:");
    selectedPOObjects.forEach((po, idx) => {
      console.log(
        `[${idx}] id_PO: ${po.id}, id_supplier: ${po.id_supplier}, supplier: ${po.supplier}, noPO: ${po.noPO}`
      );
      po.poItems.forEach((poItem, i) => {
        poItem.items.forEach((item, j) => {
          console.log(
            `  [item ${i}-${j}] namaBarang: ${item.namaBarang}, id_satuan: ${item.id_satuan}, satuan: ${item.satuan}, qtySisa: ${item.qtySisa}, poItemId: ${item.poItemId}`
          );
        });
      });
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
        .map((po) => po.estimasiTanggalTerima)
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
  function formatRupiah(val: any) {
    if (val === undefined || val === "" || isNaN(val)) return "";
    return "Rp " + Number(val).toLocaleString("id-ID");
  }

  // Helper: format tanggal ke dd-mm-yyyy
  function formatTanggal(tgl: string | null | undefined) {
    if (!tgl) return "-";
    // Asumsi tgl format "YYYY-MM-DD"
    const [date] = tgl.split("T");
    const [y, m, d] = date.split("-");
    if (!y || !m || !d) return tgl;
    return `${d}-${m}-${y}`;
  }

  // Helper untuk dapatkan label supplier dari id_supplier
  function getSupplierLabel(id: string) {
    const found = supplierList.find(
      (s) => String(s.id_supplier) === String(id)
    );
    return found ? found.namaSupplier : id;
  }

<<<<<<< HEAD
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
                  // Support decimal hargaSatuan
                  let harga = 0;
                  if (typeof i.hargaSatuan === "string") {
                    const normalized = i.hargaSatuan.replace(/\./g, "").replace(",", ".");
                    harga = parseFloat(normalized) || 0;
                  } else {
                    harga = Number(i.hargaSatuan) || 0;
                  }
                  const qty = Number(i.jumlahPO) || 0;
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
                    const normalized = i.hargaSatuan.replace(/\./g, "").replace(",", ".");
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
=======
>>>>>>> 3e1e178dc16ce262ae83d76241f3500a56e79817
  function highlightWeekends(date: Date) {
    const day = date.getDay();
    if (day === 0 || day === 6) return "datepicker-red";
    return undefined;
  }

  // Tambahkan state untuk filter kode dan skema
  const [kodeSearchTerm, setKodeSearchTerm] = useState("");
  const [filterKode, setFilterKode] = useState<string[]>([]);
  const [skemaSearchTerm, setSkemaSearchTerm] = useState("");
  const [filterSkema, setFilterSkema] = useState<string[]>([]);

  const uniqueKode = Array.from(
    new Set(
      poData
        .map((po) => String(po.statusPermintaan ?? ""))
        .filter((k) => k.trim() !== "")
    )
  ).sort();

  // Tambahkan filteredPOData dan paginatedData sebelum return

  // --- Tabel PO: gunakan backendPOData dan filter skema sesuai user login ---
  const filteredPOData = backendPOData
    .filter((po) => !userSkemaId || String(po.skema) === userSkemaId)
    .filter((po) => {
      // Gabungkan searchTerm untuk noPO, supplier, barang
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        po.noPO.toLowerCase().includes(searchLower) ||
        String(po.supplier).toLowerCase().includes(searchLower) ||
        po.poItems.some((poItem) =>
          poItem.items.some((item) =>
            item.namaBarang.toLowerCase().includes(searchLower)
          )
        );
      // Filter supplier
      const matchSupplier =
        filterSupplier.length === 0 || filterSupplier.includes(po.supplier);
      // Filter satuan
      const matchSatuan =
        filterSatuan.length === 0 ||
        po.poItems.some((poItem) =>
          poItem.items.some((item) => filterSatuan.includes(item.satuan))
        );
      // Filter barang
      const matchBarang =
        !filterNamaBarang ||
        po.poItems.some((poItem) =>
          poItem.items.some((item) =>
            item.namaBarang
              .toLowerCase()
              .includes(filterNamaBarang.toLowerCase())
          )
        );
      // Filter status
      const matchStatus =
        filterStatus.length === 0 || filterStatus.includes(po.status);
      // Filter kode
      const matchKode =
        filterKode.length === 0 ||
        filterKode.includes(String(po.statusPermintaan));
      // Filter skema
      const matchSkema =
        filterSkema.length === 0 || filterSkema.includes(String(po.skema));
      // ...tambahkan filter lain sesuai kebutuhan...
      return (
        matchSearch &&
        matchSupplier &&
        matchSatuan &&
        matchBarang &&
        matchStatus &&
        matchKode &&
        matchSkema
      );
    });

  // --- SORTING: PO TERBARU → TERLAMA (PAKAI PARSER) ---
  const sortedPOData = sortPOList(filteredPOData);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedPOData.length / itemsPerPage)
  );
  const paginatedData = sortedPOData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- Checkbox header untuk select all pada halaman (mirip monitoring BTB) ---
  const pagePOIds = paginatedData.map((po) => po.id);
  const allPageSelected =
    pagePOIds.length > 0 && pagePOIds.every((id) => selectedPOs.includes(id));

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

  // ========================================
  // 1. PARSER No. PO (E-WALK + PENTACITY)
  // ========================================
  function parseNoPO(noPO: string | null | undefined) {
    if (!noPO || typeof noPO !== "string") return null;

    const s = noPO.trim().toUpperCase();

    // FORMAT:
    // PO/E-WALK/WBL/25/XI/00001
    // PO/PSV/WBL/25/XI/00001
    //
    // BRAND = E-WALK atau PSV
    // STORE = WBL atau lainnya
    const regex = /^PO\/(E-?WALK|PSV)\/([A-Z0-9]+)\/(\d{2})\/([IVXLCDM]{1,4})\/(\d{1,5})$/;

    const match = s.match(regex);
    if (!match) return null;

    const [, brand, store, tahun2, bulanRomawi, urutStr] = match;

    // Konversi bulan romawi
    const bulanMap: Record<string, number> = {
      I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
      VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12,
    };

    const bulan = bulanMap[bulanRomawi] ?? 0;
    const tahun = 2000 + parseInt(tahun2, 10);
    const urut = parseInt(urutStr, 10);

    return { tahun, bulan, urut, brand, store };
  }

  // ========================================
  // 2. SORTING PO TERBARU → TERLAMA
  // ========================================
  function sortPOList(filteredPOData: any[]) {
    const allValid = filteredPOData.every(
      (po) => typeof po.noPO === "string" && parseNoPO(po.noPO)
    );

    if (allValid) {
      return [...filteredPOData].sort((a, b) => {
        const pa = parseNoPO(a.noPO)!;
        const pb = parseNoPO(b.noPO)!;

        // Tahun DESC
        if (pb.tahun !== pa.tahun) return pb.tahun - pa.tahun;

        // Bulan DESC
        if (pb.bulan !== pa.bulan) return pb.bulan - pa.bulan;

        // Urut DESC
        return pb.urut - pa.urut;
      });
    }

    // fallback jika format tidak valid
    return [...filteredPOData].sort((a, b) => Number(b.id_PO ?? b.id) - Number(a.id_PO ?? a.id));
  }

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

        {/* Search Bar untuk Daftar Purchase Order */}
        {!showForm && (
          <div className="flex items-center gap-2 mb-2">
            <Input
              placeholder="Cari No. PO, Supplier, atau Nama Barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[320px]"
            />
          </div>
        )}

<<<<<<< HEAD
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
                  <Label htmlFor="estimasiTanggalTerima">
                    Estimasi Tanggal Diterima
                  </Label>
                  <DatePicker
                    id="estimasiTanggalTerima"
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
=======
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
                      <TableHead className="w-12 border-r border-gray-300">
                        <Checkbox
                          checked={allPageSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPOs((prev) =>
                                Array.from(new Set([...prev, ...pagePOIds]))
                              );
                            } else {
                              setSelectedPOs((prev) =>
                                prev.filter((id) => !pagePOIds.includes(id))
                              );
                            }
                          }}
                          style={{
                            boxShadow: "0 0 0 2px #bbb, 0 2px 8px #bbb8",
                            border: "1.5px solid #bbb",
                            borderRadius: 4,
                          }}
                          className="focus:ring-2 focus:ring-primary"
>>>>>>> 3e1e178dc16ce262ae83d76241f3500a56e79817
                        />
                      </TableHead>
                      <TableHead className="border-r border-gray-300">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1">
                              No. PO <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari No. PO..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="flex items-center mt-2">
                              <Checkbox
                                checked={
                                  pagePOIds.length > 0 &&
                                  pagePOIds.every((id) =>
                                    selectedPOs.includes(id)
                                  )
                                }
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedPOs((prev) =>
                                      Array.from(
                                        new Set([...prev, ...pagePOIds])
                                      )
                                    );
                                  } else {
                                    setSelectedPOs((prev) =>
                                      prev.filter(
                                        (id) => !pagePOIds.includes(id)
                                      )
                                    );
                                  }
                                }}
                              />
                              <Label className="ml-2 text-xs">
                                Pilih semua halaman ini
                              </Label>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead className="border-r border-gray-300">
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
                      <TableHead className="border-r border-gray-300">
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
                      <TableHead className="border-r border-gray-300">
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
                      <TableHead className="border-r border-gray-300">
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
                      <TableHead className="border-r border-gray-300">
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
                      <TableHead className="border-r border-gray-300">
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
                      <TableHead className="border-r border-gray-300">
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
                      <TableHead className="border-r border-gray-300">
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
                      <TableHead className="border-r border-gray-300">
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
                                            filterSupplier.filter(
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
                      <TableHead className="border-r border-gray-300">
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
                                      checked={filterStatusPengiriman.includes(
                                        s
                                      )}
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
                      <TableHead className="border-r border-gray-300">
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
                      <TableHead className="border-r border-gray-300">
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
                                    .includes(
                                      diorderOlehSearchTerm.toLowerCase()
                                    )
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
                      <TableHead className="border-r border-gray-300">
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
                              onChange={(e) =>
                                setSkemaSearchTerm(e.target.value)
                              }
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((po) => {
                      const allItems = po.poItems.flatMap((poItem: any) =>
                        poItem.items
                          .filter((item: any) => item.jumlahPO > 0)
                          .map((item: any) => ({
                            ...item,
                            noPR: poItem.noPR,
                          }))
                      );
                      return (
                        <React.Fragment key={po.id}>
                          {allItems.map((item: any, itemIndex: number) => (
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
                                    rowSpan={allItems.length}
                                    className="font-medium px-4 py-2 border-r border-gray-300 align-middle"
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
                              {itemIndex === 0 ? (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="px-4 py-2 border-r border-gray-300 align-middle text-left min-w-[120px] font-semibold"
                                >
                                  Rp{" "}
                                  {po.totalPembayaran.toLocaleString("id-ID")}
                                </TableCell>
                              ) : null}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[120px]"
                                >
                                  {formatTanggalPlus2(po.tanggalPO)}
                                </TableCell>
                              )}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[140px]"
                                >
                                  {formatTanggalPlus2(po.estimasiTanggalTerima)}
                                </TableCell>
                              )}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[140px]"
                                >
                                  {po.supplier}
                                </TableCell>
                              )}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[100px]"
                                >
                                  {getStatusBadge(po.status)}
                                </TableCell>
                              )}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[100px]"
                                >
                                  {po.orderedBy ?? ""}
                                </TableCell>
                              )}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-left border-r border-gray-300 align-middle min-w-[100px]"
                                >
                                  {skemaMap[String(po.skema)] ?? po.skema}
                                </TableCell>
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
              {/* Input Nomor BTB dan Tgl BTB sejajar */}
              <div className="mb-4">
                {/* Judul detail PO yang dipilih: warna hitam, besar */}
                <div className="mb-2 text-2xl font-semibold text-black">
                  Detail PO yang Dipilih
                </div>
                {/* Info No. PO dan Supplier, sejajar, tidak terlalu tebal/besar */}
                <div className="mb-3 flex flex-row gap-2 items-center text-base font-normal text-foreground">
                  <span>No. PO: {formData.noPO}</span>
                  <span className="mx-2">|</span>
                  <span>Supplier: {formData.supplierLabel}</span>
                </div>
                {/* Input Nomor BTB dan Tgl BTB sejajar */}
                <div className="flex flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="noBTB">Nomor BTB</Label>
                    <Input
                      id="noBTB"
                      value={formData.noBTB}
                      onChange={(e) =>
                        setFormData({ ...formData, noBTB: e.target.value })
                      }
                      placeholder="Auto-generated"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="tanggal">Tanggal BTB</Label>
                    <DatePicker
                      id="tanggal"
                      selected={formData.tanggal}
                      onChange={(date) =>
                        setFormData({ ...formData, tanggal: date })
                      }
                      dateFormat="dd-MM-yyyy"
                      placeholderText="Pilih tanggal"
                      className="w-full px-3 py-2 border rounded-md bg-white"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                      dayClassName={highlightWeekends}
                      customInput={
                        <Input
                          value={
                            formData.tanggal
                              ? (() => {
                                  const d =
                                    formData.tanggal instanceof Date
                                      ? formData.tanggal
                                      : new Date(formData.tanggal);
                                  return `${String(d.getDate()).padStart(
                                    2,
                                    "0"
                                  )}-${String(d.getMonth() + 1).padStart(
                                    2,
                                    "0"
                                  )}-${d.getFullYear()}`;
                                })()
                              : ""
                          }
                          readOnly
                          className="w-full px-3 py-2 border rounded-md bg-white"
                        />
                      }
                    />
                  </div>
                </div>
              </div>
              {/* Tabel barang: Nama Barang, Quantity PO, Quantity Diterima, Satuan, Keterangan */}
              <div className="border border-[#e5e7eb] rounded-lg overflow-x-auto mb-4">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-white font-semibold text-center h-10 border-b border-[#e5e7eb]">
                      <th className="px-4 py-2 border-r border-[#e5e7eb]">Nama Barang</th>
                      <th className="px-4 py-2 border-r border-[#e5e7eb]">Quantity PO</th>
                      <th className="px-4 py-2 border-r border-[#e5e7eb]">Quantity Diterima</th>
                      <th className="px-4 py-2 border-r border-[#e5e7eb]">Satuan</th>
                      <th className="px-4 py-2">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPOItems.flatMap((po) =>
                      po.items
                        .filter((item) => item.qtySisa > 0)
                        .map((item, idx) => (
                          <tr key={item.poItemId} className="border-b border-[#e5e7eb] text-center align-middle h-10">
                            <td className="px-4 py-2 border-r border-[#e5e7eb]">{item.namaBarang}</td>
                            <td className="px-4 py-2 border-r border-[#e5e7eb]">{item.qtySisa}</td>
                            <td className="px-4 py-2 border-r border-[#e5e7eb] text-center flex justify-center items-center">
                              <Input
                                type="number"
                                min={0}
                                max={item.qtySisa}
                                inputMode="numeric"
                                value={
                                  btbInputQty[item.poItemId] !== undefined
                                    ? btbInputQty[item.poItemId]
                                    : ""
                                }
                                onChange={(e) => {
                                  let val = e.target.value.replace(/^0+(\d)/, "$1");
                                  let parsedVal =
                                    val === ""
                                      ? ""
                                      : Math.max(
                                          0,
                                          Math.min(Number(val), item.qtySisa)
                                        );
                                  setBtbInputQty((prev) => ({
                                    ...prev,
                                    [item.poItemId]: parsedVal,
                                  }));
                                }}
                                className="w-16 h-9 text-center border border-[#e5e7eb] rounded bg-white appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                style={{
                                  MozAppearance: "textfield"
                                }}
                                onWheel={e => {
                                  e.target.blur();
                                  e.preventDefault();
                                }}
                              />
                            </td>
                            <td className="px-4 py-2 border-r border-[#e5e7eb]">{item.satuan}</td>
                            <td className="px-4 py-2 text-left">
                              <div className="text-muted-foreground max-w-xs truncate" title={item.keterangan}>
                                {item.keterangan}
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Form bawah: Skema saja */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Skema di-hide, tetap dikirim */}
                <input type="hidden" name="skema" value={formData.skema} />
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
