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
   const tableWrapperRef = React.useRef<HTMLDivElement>(null);

  // Sinkronkan scroll antara tabel dan scrollbar custom
  React.useEffect(() => {
    const tableDiv = tableWrapperRef.current;
    if (!tableDiv) return;

    const handleTableScroll = () => {
      const stickyScrollbar = document.querySelector('.sticky') as HTMLElement;
      if (stickyScrollbar) {
        stickyScrollbar.scrollLeft = tableDiv.scrollLeft;
      }
    };

    tableDiv.addEventListener('scroll', handleTableScroll);
    return () => {
      tableDiv.removeEventListener('scroll', handleTableScroll);
    };
  }, []);


  // Search filter for PO table
  const [searchTerm, setSearchTerm] = useState("");

  // PO date range filter (start and end)
  const [poStartDate, setPoStartDate] = useState<Date | null>(null);
  const [poEndDate, setPoEndDate] = useState<Date | null>(null);

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
          fetch("http://localhost:5000/api/po"),
          fetch("http://localhost:5000/api/po-item"),
          fetch("http://localhost:5000/api/pr-item"),
          fetch("http://localhost:5000/api/pr"),
          fetch("http://localhost:5000/api/supplier"),
          fetch("http://localhost:5000/api/status-permintaan"),
          fetch("http://localhost:5000/api/status-pengiriman"),
          fetch("http://localhost:5000/api/skema"),
          fetch("http://localhost:5000/api/user"),
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
        setBackendPOData([]);
      }
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


  // Fungsi format tanggal standar (tanpa penambahan hari)
  function formatTanggal(tgl: string) {
    if (!tgl) return "";
    let dateObj = dayjs(tgl);
    if (!dateObj.isValid() && /^\d{2}-\d{2}-\d{4}$/.test(tgl)) {
      const [d, m, y] = tgl.split("-");
      dateObj = dayjs(`${y}-${m}-${d}`);
    }
    if (dateObj.isValid()) {
      return dateObj.format("DD-MM-YYYY");
    }
    return tgl ?? "";
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
            const hargaSatuanInt = poItem?.hargaSatuan
              ? Math.round(Number(poItem.hargaSatuan))
              : 0;
            const totalPerItem = poItem?.totalPerItem
              ? Number(poItem.totalPerItem)
              : 0;
            const jumlahAsli = poItem?.jumlahAsli
              ? Number(poItem.jumlahAsli)
              : 0;
            const qtyDiterima = Math.round(btbInputQty[item.poItemId] ?? 0);
            // --- Hitung biaya per item proporsional ---
            let biaya = 0;
            if (qtyDiterima > 0 && totalPerItem > 0 && jumlahAsli > 0) {
              biaya = Math.round((qtyDiterima / jumlahAsli) * totalPerItem);
            } else if (qtyDiterima > 0 && totalPerItem > 0) {
              biaya = Math.round(totalPerItem / qtyDiterima);
            }
            return {
              id_POItem: poItem?.id_POItem,
              nama_barang: item.namaBarang,
              jumlah_diterima: qtyDiterima,
              id_satuan: item.id_satuan ?? poItem?.id_satuan ?? null,
              keterangan: item.keterangan ?? "",
              hargaSatuan: hargaSatuanInt,
              biaya, // <-- biaya per item BTB, dikirim ke backend
            };
          })
          .filter((item) => !!item.id_POItem)
      );

      // Hitung total biaya BTB dari semua item diterima
      const totalBiayaBTB = items.reduce(
        (sum, item) => sum + (item.biaya ?? 0),
        0
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
        biaya: Math.round(totalBiayaBTB), // <-- gunakan total biaya BTB
        diterima_oleh: userData.id_user || userData.id,
        tanggal_diterima: formData.tanggal,
      });
      console.log("DIKIRIM FRONTEND KE BTB ITEMS:", items);
      console.log(filteredPOData); // Cek data yang difilter


      // POST header BTB dengan biaya sesuai qty diterima
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
          biaya: Math.round(totalBiayaBTB), // <-- gunakan total biaya BTB
          diterima_oleh: userData.id_user || userData.id,
          tanggal_diterima: formatDateForBackend(formData.tanggalDiterima),
          // status dan created_at otomatis di backend
        }),
      });
      if (!btbHeaderRes.ok) throw new Error("Gagal menyimpan header BTB");
      const btbHeaderData = await btbHeaderRes.json();
      const id_btb = btbHeaderData.id;

      for (const item of items) {
        // Validasi field
        if (!id_btb || !item.id_POItem || !item.nama_barang) {
          console.error("Field wajib kosong saat POST btb-item:", {
            id_btb,
            item,
          });
          continue; // skip jika field penting kosong
        }

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
            biaya: Math.round(item.biaya), // <-- kirim biaya per item ke backend
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
        window.location.href = "/btb/input"; // <-- auto refresh ke halaman input BTB
      }, 1800);
      resetForm();
    } catch (err) {
      setNotif({ type: "error", message: "Gagal menyimpan BTB ke backend." });
      setTimeout(() => setNotif(null), 3000);
    }
  };

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

  const handleSelectPO = (poId: string, checked: boolean) => {
    if (checked) {
      setSelectedPOs([...selectedPOs, poId]);
    } else {
      setSelectedPOs(selectedPOs.filter((id) => id !== poId));
    }
  };

  // Tambahkan state untuk selected item per PO
  const [selectedPOItemIds, setSelectedPOItemIds] = useState<string[]>([]);

  // Fungsi untuk handle checkbox item di tabel PO
  const handleSelectPOItem = (poId: string, poItemId: string, checked: boolean) => {
    const key = `${poId}::${poItemId}`;
    if (checked) {
      setSelectedPOItemIds((prev) => [...prev, key]);
    } else {
      setSelectedPOItemIds((prev) => prev.filter((id) => id !== key));
    }
  };

  // Tambahkan: handle checkbox group (per PO)
  const handleSelectPOGroup = (poId: string, checked: boolean, allItemKeys: string[]) => {
    if (checked) {
      setSelectedPOItemIds((prev) => Array.from(new Set([...prev, ...allItemKeys])));
    } else {
      setSelectedPOItemIds((prev) => prev.filter((id) => !allItemKeys.includes(id)));
    }
  };

  // Fungsi untuk select all item di halaman
  const handleSelectAllItemsOnPage = (checked: boolean, paginatedData: any[]) => {
    const allItemKeys = paginatedData.flatMap((po) =>
      po.poItems.flatMap((poItem: any) =>
        poItem.items
          .filter((item: any) => item.jumlahPO > 0)
          .map((item: any) =>
            `${po.id}::${poItem.noPR}-${item.id}`
          )
      )
    );
    if (checked) {
      setSelectedPOItemIds((prev) =>
        Array.from(new Set([...prev, ...allItemKeys]))
      );
    } else {
      setSelectedPOItemIds((prev) =>
        prev.filter((id) => !allItemKeys.includes(id))
      );
    }
  };

  // Tombol Buat BTB muncul jika ada item dipilih
  const anyItemSelected = selectedPOItemIds.length > 0;

  const handleBuatBTB = () => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    // Ambil PO yang mengandung item terpilih
    const selectedPOObjects = filteredPOData.filter((po) =>
      po.poItems.some((poItem: any) =>
        poItem.items.some((item: any) =>
          selectedPOItemIds.includes(`${po.id}::${poItem.noPR}-${item.id}`)
        )
      )
    );
    if (selectedPOObjects.length === 0) {
      alert("Pilih minimal satu item PO untuk dibuat BTB.");
      return;
    }
    setSelectedPOsForBTB(selectedPOObjects);
    setShowForm(true);

    // Ambil hanya item yang dipilih
    setSelectedPOItems(
      selectedPOObjects.map((po) => ({
        poId: po.id,
        noPO: po.noPO,
        supplier: po.supplier,
        items: getPOItemsWithSisa(po).filter((item) =>
          selectedPOItemIds.includes(`${po.id}::${item.poItemId}`)
        ),
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
      getPOItemsWithSisa(po)
        .filter((item) => selectedPOItemIds.includes(`${po.id}::${item.poItemId}`))
        .forEach((item) => {
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

      // --- Filter by PO date range ---
      let matchDateRange = true;
      if (poStartDate && poEndDate) {
        // Assume po.tanggalPO is yyyy-mm-dd or yyyy-mm-ddTHH:mm:ss
        const tgl = (po.tanggalPO || "").split("T")[0];
        if (tgl) {
          const tglDate = new Date(tgl);
          matchDateRange = tglDate >= poStartDate && tglDate <= poEndDate;
        }
      }

      return (
        matchSearch &&
        matchSupplier &&
        matchSatuan &&
        matchBarang &&
        matchStatus &&
        matchKode &&
        matchSkema &&
        matchDateRange
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
        if (pa.tahun !== pb.tahun) return pa.tahun - pb.tahun;

        // Bulan DESC
        if (pa.bulan !== pb.bulan) return pa.bulan - pb.bulan;

        // Urut DESC
        return pa.urut - pb.urut;
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
              Input BTB
            </h1>
            <p className="text-muted-foreground">
              Pilih item PO yang sudah disetujui untuk dibuatkan BTB
            </p>
          </div>
          {/* Buat BTB button top right, only if item(s) selected and not showing form */}
          {anyItemSelected && !showForm && (
            <Button
              type="button"
              className="bg-primary hover:bg-primary/90"
              onClick={handleBuatBTB}
            >
              Buat BTB
            </Button>
          )}
        </div>

        {/* Search Bar dan Filter Rentang Tanggal PO */}
        {!showForm && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Input
              placeholder="Cari No. PO, Supplier, atau Nama Barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[320px]"
            />
            {/* Filter rentang tanggal PO */}
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Tanggal PO:</span>
              <DatePicker
                selected={poStartDate}
                onChange={(date) => setPoStartDate(date)}
                selectsStart
                startDate={poStartDate}
                endDate={poEndDate}
                dateFormat="yyyy-MM-dd"
                placeholderText="Mulai"
                className="w-[110px] px-2 py-1 border rounded-md bg-white text-xs"
                maxDate={poEndDate || undefined}
                isClearable
              />
              <span className="mx-1">-</span>
              <DatePicker
                selected={poEndDate}
                onChange={(date) => setPoEndDate(date)}
                selectsEnd
                startDate={poStartDate}
                endDate={poEndDate}
                dateFormat="yyyy-MM-dd"
                placeholderText="Selesai"
                className="w-[110px] px-2 py-1 border rounded-md bg-white text-xs"
                minDate={poStartDate || undefined}
                isClearable
              />
            </div>
          </div>
        )}

        {/* Tabel PO dari Monitoring PO */}
        {!showForm && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Daftar Purchase Order</CardTitle>
              <CardDescription>
                Total: {filteredPOData.length} PO | Item dipilih: {selectedPOItemIds.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="border border-gray-300">
                  <TableHeader>
                    <TableRow>
                      {/* Tambahkan checkbox header untuk select all */}
                      <TableHead className="w-12 border-r border-gray-300 text-center">
                        <Checkbox
                          checked={
                            paginatedData.length > 0 &&
                            paginatedData.every((po) =>
                              po.poItems.flatMap((poItem: any) =>
                                poItem.items
                                  .filter((item: any) => item.jumlahPO > 0)
                                  .map((item: any) =>
                                    selectedPOItemIds.includes(`${po.id}::${poItem.noPR}-${item.id}`)
                                  )
                              ).every(Boolean)
                            )
                          }
                          indeterminate={
                            paginatedData.some((po) =>
                              po.poItems.flatMap((poItem: any) =>
                                poItem.items
                                  .filter((item: any) => item.jumlahPO > 0)
                                  .map((item: any) =>
                                    selectedPOItemIds.includes(`${po.id}::${poItem.noPR}-${item.id}`)
                                  )
                              ).some(Boolean)
                            ) &&
                            !paginatedData.every((po) =>
                              po.poItems.flatMap((poItem: any) =>
                                poItem.items
                                  .filter((item: any) => item.jumlahPO > 0)
                                  .map((item: any) =>
                                    selectedPOItemIds.includes(`${po.id}::${poItem.noPR}-${item.id}`)
                                  )
                              ).every(Boolean)
                            )
                          }
                          onCheckedChange={(checked) =>
                            handleSelectAllItemsOnPage(checked === true, paginatedData)
                          }
                        />
                      </TableHead>
                      <TableHead className="border-r border-gray-300 text-center">No. PO</TableHead>
                      <TableHead className="border-r border-gray-300 text-center">Daftar Barang</TableHead>
                      <TableHead className="border-r border-gray-300 text-center">
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
                      <TableHead className="border-r border-gray-300 text-center">
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
                      <TableHead className="border-r border-gray-300 text-center">
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
                      <TableHead className="border-r border-gray-300 text-center">
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
                      <TableHead className="border-r border-gray-300 text-center">
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
                      <TableHead className="border-r border-gray-300 text-center">
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
                      <TableHead className="border-r border-gray-300 text-center">
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
                      <TableHead className="border-r border-gray-300 text-center">
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
                      <TableHead className="border-r border-gray-300 text-center">
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
                      <TableHead className="border-r border-gray-300 text-center">
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
                      <TableHead className="border-r border-gray-300 text-center">
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
                      <TableHead className="border-r border-gray-300 text-center">
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
                      // Kumpulkan semua item key untuk group PO ini
                      const groupItemKeys = allItems.map((item: any) => `${po.id}::${item.noPR}-${item.id}`);
                      const allGroupSelected = groupItemKeys.length > 0 && groupItemKeys.every((key) => selectedPOItemIds.includes(key));
                      const someGroupSelected = groupItemKeys.some((key) => selectedPOItemIds.includes(key));
                      return (
                        <React.Fragment key={po.id}>
                          {allItems.map((item: any, itemIndex: number) => (
                            <TableRow
                              key={`${po.id}-item-${itemIndex}`}
                              className="border-b border-gray-300 align-middle"
                            >
                              {/* Checkbox group (per PO), hanya di baris pertama group */}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="px-2 py-2 border-r border-gray-300 align-middle text-center"
                                >
                                  <Checkbox
                                    checked={allGroupSelected}
                                    indeterminate={someGroupSelected && !allGroupSelected}
                                    onCheckedChange={(checked) =>
                                      handleSelectPOGroup(po.id, checked === true, groupItemKeys)
                                    }
                                  />
                                </TableCell>
                              )}
                              {/* Kolom No. PO dan Barang */}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="font-medium px-4 py-2 border-r border-gray-300 align-middle text-left"
                                >
                                  {po.noPO}
                                </TableCell>
                              )}
                              {/* Checkbox + Nama Barang */}
                              <TableCell className="px-4 py-2 border-r border-gray-300 text-left min-w-[200px] flex items-left gap-2 justify-left">
                                <Checkbox
                                  checked={selectedPOItemIds.includes(`${po.id}::${item.noPR}-${item.id}`)}
                                  onCheckedChange={(checked) =>
                                    handleSelectPOItem(po.id, `${item.noPR}-${item.id}`, checked === true)
                                  }
                                />
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
                                </HoverCard>
                              </TableCell>
                              <TableCell className="px-4 py-2 border-r border-gray-300 align-middle text-center min-w-[120px]">
                                Rp {item.hargaSatuan.toLocaleString("id-ID")}
                              </TableCell>
                              {itemIndex === 0 ? (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="px-4 py-2 border-r border-gray-300 align-middle text-center min-w-[120px] font-semibold"
                                >
                                  Rp{" "}
                                  {po.totalPembayaran.toLocaleString("id-ID")}
                                </TableCell>
                              ) : null}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-center border-r border-gray-300 align-middle min-w-[120px]"
                                >
                                  {formatTanggal(po.tanggalPO)}
                                </TableCell>
                              )}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-center border-r border-gray-300 align-middle min-w-[140px]"
                                >
                                  {formatTanggal(po.estimasiTanggalTerima)}
                                </TableCell>
                              )}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-center border-r border-gray-300 align-middle min-w-[140px]"
                                >
                                  {po.supplier}
                                </TableCell>
                              )}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-center border-r border-gray-300 align-middle min-w-[100px]"
                                >
                                  {/* Status Pengiriman dari po.statusPengiriman */}
                                  {po.statusPengiriman}
                                </TableCell>
                              )}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-center border-r border-gray-300 align-middle min-w-[100px]"
                                >
                                  {/* Status dari po.status */}
                                  {po.status}
                                </TableCell>
                              )}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-center border-r border-gray-300 align-middle min-w-[100px]"
                                >
                                  {/* Diorder oleh dari po.orderedBy */}
                                  {po.orderedBy}
                                </TableCell>
                              )}
                              {itemIndex === 0 && (
                                <TableCell
                                  rowSpan={allItems.length}
                                  className="text-center border-r border-gray-300 align-middle min-w-[100px]"
                                >
                                  {/* Skema dari po.id_skema, label dari skemaMap */}
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
            </CardContent>
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
              {/* Tabel barang: hanya tampilkan item yang dipilih */}
              <div className="border border-[#e5e7eb] rounded-lg overflow-x-auto mb-4">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-white font-semibold text-center h-12 border-b border-[#e5e7eb]">
                      <th className="font-medium px-10 py-4 border-r border-gray-300 text-center min-w-[200px]">Nama Barang</th>
                      <th className="font-medium px-10 py-4 border-r border-gray-300 text-center min-w-[160px]">Quantity PO</th>
                      <th className="font-medium px-10 py-4 border-r border-gray-300 text-center min-w-[180px]">Quantity Diterima</th>
                      <th className="font-medium px-10 py-4 border-r border-gray-300 text-center min-w-[140px]">Satuan</th>
                      <th className="font-medium px-10 py-4 border-r border-gray-300 text-center min-w-[220px]">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPOItems.flatMap((po) =>
                      po.items
                        .filter((item) => item.qtySisa > 0)
                        .map((item, idx) => (
                          <tr key={item.poItemId} className="border-b border-[#e5e7eb] text-center align-middle h-12">
                            <td className="px-10 py-4 border-r border-gray-300 text-center min-w-[200px]">{item.namaBarang}</td>
                            <td className="px-10 py-4 border-r border-gray-300 text-center min-w-[160px]">{item.qtySisa}</td>
                            <td className="px-10 py-4 border-r border-gray-300 text-center min-w-[180px]">
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
                                className="w-20 h-9 text-center mx-auto border border-[#e5e7eb] rounded bg-white appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                style={{
                                  MozAppearance: "textfield"
                                }}
                                onWheel={e => {
                                  e.target.blur();
                                  e.preventDefault();
                                }}
                              />
                            </td>
                            <td className="px-10 py-4 border-r border-gray-300 text-center min-w-[140px]">{item.satuan}</td>
                            <td className="px-10 py-4 border-r border-gray-300 text-center min-w-[220px]">
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
