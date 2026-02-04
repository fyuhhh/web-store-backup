"use client";

import React from "react";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/app/pr/input-baru/datepicker-red-weekend.css";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import type { BTBData } from "@/lib/dummy-data";
import { MainLayout } from "@/components/layout/main-layout";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import ReactDOM from "react-dom"; // tambahkan import ini jika belum ada
import { API_BASE_URL } from "@/lib/config";
dayjs.extend(utc);

export default function BKBInputPage() {
  // State
  const [btbData, setBtbData] = useState<BTBData[]>([]);
  // HAPUS: const [searchTerm, setSearchTerm] = useState("");
  // Tambahkan state untuk filter tanggal BTB (rentang)
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Set default rentang tanggal ke awal & akhir bulan saat halaman diakses
  useEffect(() => {
    if (startDate === null && endDate === null) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(firstDay);
      setEndDate(lastDay);
    }
  }, [startDate, endDate]);

  // Tambahkan state untuk pencarian seperti monitoring BKB
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSupplier, setFilterSupplier] = useState<string[]>([]);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");
  const [filterKodeSupplier, setFilterKodeSupplier] = useState<string[]>([]);
  const [kodeSupplierSearchTerm, setKodeSupplierSearchTerm] = useState("");
  const [barangSearchTerm, setBarangSearchTerm] = useState("");
  const [filterSatuan, setFilterSatuan] = useState<string[]>([]);
  const [satuanSearchTerm, setSatuanSearchTerm] = useState("");
  const [filterPeriode, setFilterPeriode] = useState("");
  const [periodeSearchTerm, setPeriodeSearchTerm] = useState("");
  const [filterTanggalBTB, setFilterTanggalBTB] = useState<string[]>([]);
  const [tanggalBTBSearchTerm, setTanggalBTBSearchTerm] = useState("");
  const [filterQtyMin, setFilterQtyMin] = useState<number | "">("");
  const [filterQtyMax, setFilterQtyMax] = useState<number | "">("");
  const [filterBiayaMin, setFilterBiayaMin] = useState<number | "">("");
  const [filterBiayaMax, setFilterBiayaMax] = useState<number | "">("");
  const [selectedBTBIds, setSelectedBTBIds] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>({
    noBKB: "",
    tanggalBKB: null as Date | null,
    barang: [],
    keterangan: "",
    skema: "", // <-- tambah field skema
    divisi: "", // <-- tambahkan field divisi
  });
  const [userNick, setUserNick] = useState("");
  const [userSchema, setUserSchema] = useState<string>("");
  const [userSkemaId, setUserSkemaId] = useState<string>(""); // Tambah state id_skema user
  const [notif, setNotif] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const router = useRouter(); // <-- tambahkan inisialisasi router
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

  // Tambahkan state untuk data BTB dari backend
  const [backendBTBRows, setBackendBTBRows] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [satuanMap, setSatuanMap] = useState<Record<string, string>>({});
  const [skemaMap, setSkemaMap] = useState<Record<string, string>>({});
  const [divisiMap, setDivisiMap] = useState<Record<string, string>>({}); // Tambah state mapping divisi
  const [loading, setLoading] = useState(false);
  const [prList, setPrList] = useState<any[]>([]); // <-- Tambah state PR
  // Tambahkan state PO, PO Item, PR Item
  const [poList, setPoList] = useState<any[]>([]);
  const [poItemList, setPoItemList] = useState<any[]>([]);

  const [prItemList, setPrItemList] = useState<any[]>([]);

  // Tambahkan state untuk dropdown divisi
  const [divisiOptions, setDivisiOptions] = useState<any[]>([]);

  const [divisiSearch, setDivisiSearch] = useState("");

  // Tambahkan state untuk tambah divisi
  const [showAddDivisi, setShowAddDivisi] = useState(false);
  const [newDivisi, setNewDivisi] = useState("");

  // Tambahkan state untuk edit divisi
  const [editDivisiId, setEditDivisiId] = useState<string | null>(null);
  const [editDivisiValue, setEditDivisiValue] = useState("");

  useEffect(() => {
    const storedBTB = localStorage.getItem("btbData");
    if (storedBTB) {
      const userRaw = localStorage.getItem("userData");
      let userSchema = "";
      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);
          userSchema = user.skema || ""; // <-- ambil dari skema, bukan schema
        } catch { }
      }
      setBtbData(
        JSON.parse(storedBTB).filter(
          (btb: any) => !userSchema || btb.skema === userSchema
        )
      );
    }
    setShowForm(false);
    setSelectedBTBIds([]);
    // Ambil user nick dan skema dari localStorage
    const userRaw = localStorage.getItem("userData");
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        setUserNick(user.nick ?? user.username ?? "");
        setFormData((prev: any) => ({
          ...prev,
          skema: user.skema || "",
          divisi: user.divisi || "", // <-- set divisi otomatis dari user login jika ada
        }));
        setUserSchema(user.skema || ""); // <-- set userSchema state
        setUserSkemaId(String(user.id_skema ?? user.skema ?? "")); // Set id_skema user
      } catch { }
    }

    // Ambil data BTB dari backend (persis monitoring BTB)
    async function fetchBTBData() {
      setLoading(true);
      try {
        const [btbRes, btbItemRes, userRes, skemaRes, satuanRes, divisiRes] =
          await Promise.all([
            fetch(API_BASE_URL + "/api/btb"),
            fetch(API_BASE_URL + "/api/btb-item"),
            fetch(API_BASE_URL + "/api/user"),
            fetch(API_BASE_URL + "/api/skema"),
            fetch(API_BASE_URL + "/api/satuan"),
            fetch(API_BASE_URL + "/api/divisi"),
          ]);
        const btbList = await btbRes.json();
        const btbItemList = await btbItemRes.json();
        const userList = await userRes.json();
        const skemaList = await skemaRes.json();
        const satuanList = await satuanRes.json();

        const divisiList = await divisiRes.json();

        // Populate divisi options
        if (Array.isArray(divisiList)) {
          setDivisiOptions(divisiList);

          // Initial fix: If formData.divisi is set (from localStorage) but is Name, convert to ID
          setFormData((prev: any) => {
            const currentDiv = prev.divisi;
            if (!currentDiv) return prev;
            // Check if it matches an ID directly
            const isId = divisiList.some((d: any) => String(d.id_divisi) === String(currentDiv));
            if (isId) return prev;

            // Try to find by name
            const found = divisiList.find((d: any) =>
              (d.divisi || d.nama_divisi || "").toLowerCase() === String(currentDiv).toLowerCase()
            );
            return found ? { ...prev, divisi: String(found.id_divisi) } : prev;
          });
        }

        // Mapping id_user -> nama_pengguna
        const userMapObj: Record<string, string> = {};
        userList.forEach((u: any) => {
          userMapObj[String(u.id_user)] = u.nama_pengguna;
        });
        setUserMap(userMapObj);

        // Mapping id_skema -> skema label
        const skemaMapObj: Record<string, string> = {};
        skemaList.forEach((s: any) => {
          skemaMapObj[String(s.id_skema)] = s.skema;
        });
        setSkemaMap(skemaMapObj);

        // Mapping id_satuan -> satuan label
        const satuanMapObj: Record<string, string> = {};
        satuanList.forEach((s: any) => {
          satuanMapObj[String(s.id_satuan)] = s.satuan;
        });
        setSatuanMap(satuanMapObj);

        // Mapping id_divisi -> nama_divisi
        const divisiMapObj: Record<string, string> = {};
        divisiList.forEach((d: any) => {
          // Support both "divisi" and "nama_divisi" field
          divisiMapObj[String(d.id_divisi)] = d.divisi || d.nama_divisi || "";
        });
        setDivisiMap(divisiMapObj);

        // Gabungkan: untuk setiap btb_item, cari parent btb
        const rows = btbItemList.map((item: any) => {
          const btb = btbList.find((b: any) => b.id_btb === item.id_btb);
          return {
            id: item.id_btb_item,
            id_btb: btb?.id_btb ?? null,
            id_po: btb?.id_po ?? null,
            noBTB: btb?.no_btb ?? "",
            tanggalBTB: btb?.tanggal_btb ?? "",
            tanggal: btb?.tanggal_diterima ?? "",
            id_supplier: btb?.id_supplier ?? "",
            nama_supplier: btb?.nama_supplier ?? "",
            nama_barang: item.nama_barang ?? "",
            jumlah: item.jumlah_diterima ?? "",
            satuan:
              satuanMapObj[String(item.id_satuan)] ?? item.satuanLabel ?? "",
            id_satuan: item.id_satuan ?? null,
            sisa: item.qty_sisa ?? "",
            biaya: btb?.biaya ?? "",
            diterimaOleh: btb?.id_user ?? "",
            skema: btb?.id_skema ?? "",
            keterangan: item.keterangan ?? "", // <-- tambahkan ini!
          };
        });
        setBackendBTBRows(rows);
      } catch (err) {
        setBackendBTBRows([]);
      }
      setLoading(false);
    }
    fetchBTBData();

    // Ambil data PR, PO, PO Item, PR Item dari backend
    fetch(API_BASE_URL + "/api/pr")
      .then((res) => res.json())
      .then((data) => setPrList(data));
    fetch(API_BASE_URL + "/api/po")
      .then((res) => res.json())
      .then((data) => setPoList(data));
    fetch(API_BASE_URL + "/api/po-item")
      .then((res) => res.json())
      .then((data) => setPoItemList(data));
    fetch(API_BASE_URL + "/api/pr-item")
      .then((res) => res.json())
      .then((data) => setPrItemList(data));
  }, []);

  // Auto-fill BKB Number on Form Show/Date Change
  useEffect(() => {
    // Only run if form is shown or formData has relevant values
    if (!showForm) return;

    const tanggal = formData.tanggalBKB;
    const noBKB = formData.noBKB;
    const skema = formData.skema || userSkemaId;

    if (!skema || !tanggal) return;

    // Guard: Only auto-fill if field is empty OR looks like a standard format "BKB/..."
    const isEmpryOrStandard = !noBKB || noBKB.startsWith("BKB/");
    if (!isEmpryOrStandard) return;

    const fetchNextNumber = async () => {
      try {
        const dateParam = formatDateForBackend(tanggal);
        if (!dateParam) return;

        const res = await fetch(`${API_BASE_URL}/api/bkb/next-number?id_skema=${skema}&tanggal_bkb=${dateParam}`);
        if (res.ok) {
          const data = await res.json();
          if (data.nextNoBKB) {
            setFormData((prev: any) => ({ ...prev, noBKB: data.nextNoBKB }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch next BKB number", err);
      }
    };

    fetchNextNumber();
  }, [showForm, formData.skema, formData.tanggalBKB]);


  // Helper format tanggal DD-MM-YYYY (sama seperti monitoring PO)
  function formatTanggal(tgl: string | null | undefined) {
    if (!tgl) return "-";
    const [date] = tgl.split("T");
    const [y, m, d] = date.split("-");
    if (!y || !m || !d) return tgl;
    return `${d}-${m}-${y}`;
  }

  // Helper format rupiah
  function formatRupiah(val: any) {
    if (val === undefined || val === "" || isNaN(val)) return "";
    return "Rp " + Number(val).toLocaleString("id-ID");
  }

  // Helper untuk format integer tanpa .00
  function formatInt(val: any) {
    if (val === undefined || val === null || val === "") return "";
    const num = Number(val);
    return Number.isNaN(num)
      ? ""
      : num % 1 === 0
        ? num.toString()
        : num.toFixed(2);
  }

  // Unique values for filters
  const uniqueSuppliers = Array.from(
    new Set(
      btbData.map((btb) => btb.supplier).filter((s) => s && s.trim() !== "")
    )
  ).sort();
  const uniqueKodeSupplier = Array.from(
    new Set(
      btbData.map((btb) => btb.kodeSupplier).filter((k) => k && k.trim() !== "")
    )
  ).sort();
  const uniqueSatuan = Array.from(
    new Set(
      btbData.map((btb) => btb.satuan).filter((s) => s && s.trim() !== "")
    )
  ).sort();
  const uniquePeriode = Array.from(
    new Set(btbData.map((btb) => btb.periode).filter(Boolean))
  ).sort();
  const uniqueTanggalBTB = Array.from(
    new Set(btbData.map((btb) => btb.tanggal).filter(Boolean))
  ).sort();

  // Filtered data: hanya tampilkan BTB/items dengan stok > 0 dan skema sesuai user
  const filteredBTBData = backendBTBRows
    // Filter hanya BTB dengan id_skema sesuai user login
    .filter((row) => !userSkemaId || String(row.skema) === String(userSkemaId))
    // Filter hanya yang sisa stok > 0
    .filter((row) => Number(row.sisa) > 0)
    // Filter berdasarkan pencarian (searchTerm) seperti monitoring BKB
    .filter((row) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        String(row.noBTB ?? "").toLowerCase().includes(search) ||
        String(row.nama_barang ?? "").toLowerCase().includes(search) ||
        String(row.nama_supplier ?? "").toLowerCase().includes(search) ||
        String(row.satuan ?? "").toLowerCase().includes(search) ||
        String(row.diterimaOleh ?? "").toLowerCase().includes(search) ||
        String(row.tanggalBTB ?? "").toLowerCase().includes(search) ||
        String(row.keterangan ?? "").toLowerCase().includes(search)
      );
    })
    // Filter berdasarkan rentang tanggal BTB jika diisi
    .filter((row) => {
      let matchDateRange = true;
      if (startDate || endDate) {
        // row.tanggalBTB format: yyyy-mm-dd atau yyyy-mm-ddTHH:mm:ss
        const tgl = (row.tanggalBTB || "").split("T")[0];
        if (tgl) {
          const parts = tgl.split("-");
          const tglDate = new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
          );

          let afterStart = true;
          let beforeEnd = true;

          if (startDate) {
            afterStart = tglDate >= startDate;
          }

          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            beforeEnd = tglDate <= end;
          }

          matchDateRange = afterStart && beforeEnd;
        } else {
          matchDateRange = false;
        }
      }
      return matchDateRange;
    });

  // Ambil detail BTB terpilih
  const selectedBTB = btbData.filter((btb) => selectedBTBIds.includes(btb.id));
  // Gabungkan daftar barang dari semua BTB terpilih, hanya yang sisa > 0
  const selectedBarang = selectedBTB.flatMap((btb) =>
    btb.items && Array.isArray(btb.items) && btb.items.length > 0
      ? btb.items
        .filter((item: any) => (item.sisa ?? item.jumlah) > 0)
        .map((item: any) => ({
          barang: item.barang,
          jumlah: item.sisa ?? item.jumlah,
          satuan: item.satuan,
          btbId: btb.id,
        }))
      : btb.barang && (btb.sisa ?? btb.jumlah) > 0
        ? [
          {
            barang: btb.barang,
            jumlah: btb.sisa ?? btb.jumlah,
            satuan: btb.satuan,
            btbId: btb.id,
          },
        ]
        : []
  );

  // Handler checkbox
  const handleSelectBTB = (btbId: string, checked: boolean) => {
    setSelectedBTBIds((prev) =>
      checked ? [...prev, btbId] : prev.filter((id) => id !== btbId)
    );
  };

  // State untuk checkbox per item
  const [selectedBTBItemIds, setSelectedBTBItemIds] = useState<string[]>(
    []
  );

  // Handler checkbox per item
  const handleSelectBTBItem = (itemId: string, checked: boolean) => {
    setSelectedBTBItemIds((prev) =>
      checked ? [...prev, itemId] : prev.filter((id) => id !== itemId)
    );
  };

  // Handler Input BKB button
  const handleInputBKB = () => {
    if (selectedBTBItemIds.length === 0) {
      alert("Pilih minimal satu barang BTB untuk dibuatkan BKB.");
      return;
    }
    // Ambil barang yang dipilih dari backendBTBRows
    let selectedItems = backendBTBRows.filter((row) =>
      selectedBTBItemIds.includes(row.id)
    );
    // --- Pastikan urutan item sesuai No BTB (ASC) ---
    selectedItems = sortBTBList(selectedItems);
    // --- Ambil id_po dari item pertama (pastikan sudah ada di mapping!)
    const id_po = selectedItems[0]?.id_po || null;

    // --- Cari id_PR dari PO Item
    let id_pr = null;
    if (id_po && poItemList.length > 0) {
      // Cari salah satu PO Item yang id_PO-nya sama
      const poItem = poItemList.find((pi: any) => String(pi.id_PO) === String(id_po));
      if (poItem && prItemList.length > 0) {
        // Cari PR Item yang id_PRItem-nya sama
        const prItem = prItemList.find((pri: any) => String(pri.id_PRItem) === String(poItem.id_PRItem));
        if (prItem) {
          id_pr = prItem.id_PR;
        }
      }
    }

    // --- Cari id_divisi dari PR
    let divisiOtomatis = "";
    if (id_pr && prList.length > 0) {
      const pr = prList.find((pr: any) =>
        String(pr.id_PR) === String(id_pr)
      );
      if (pr && pr.id_divisi) divisiOtomatis = pr.id_divisi;
    }

    // Fallback ke user login jika tidak ketemu
    if (!divisiOtomatis) {
      divisiOtomatis =
        selectedItems[0]?.divisi ||
        JSON.parse(localStorage.getItem("userData") || "{}").divisi ||
        "";
    }

    // Resolve divisiOtomatis to ID if it is a Name
    if (divisiOtomatis && divisiOptions.length > 0) {
      const isId = divisiOptions.some((d: any) => String(d.id_divisi) === String(divisiOtomatis));
      if (!isId) {
        const found = divisiOptions.find((d: any) =>
          (d.divisi || d.nama_divisi || "").toLowerCase() === String(divisiOtomatis).toLowerCase()
        );
        if (found) {
          divisiOtomatis = String(found.id_divisi);
        }
      }
    }

    setShowForm(true);
    // Determine schema (Priority: Item Schema > User Schema > Default)
    const skemaToUse = selectedItems[0]?.skema ||
      JSON.parse(localStorage.getItem("userData") || "{}").skema ||
      "";

    // Prepare initial date
    const initialDate = new Date();

    // Explicitly fetch next number immediately
    const fetchAndSetNumber = async () => {
      try {
        const dateParam = formatDateForBackend(initialDate); // Re-use helper
        if (dateParam && skemaToUse) {
          const res = await fetch(`${API_BASE_URL}/api/bkb/next-number?id_skema=${skemaToUse}&tanggal_bkb=${dateParam}`);
          if (res.ok) {
            const data = await res.json();
            if (data.nextNoBKB) {
              setFormData((prev: any) => ({ ...prev, noBKB: data.nextNoBKB }));
            }
          }
        }
      } catch (err) { console.error(err); }
    };
    fetchAndSetNumber();

    setFormData((prev: any) => ({
      ...prev,
      tanggalBKB: initialDate,
      barang: selectedItems.map((row) => ({
        barang: row.nama_barang,
        jumlah: row.sisa ?? row.jumlah,
        satuan: row.id_satuan ?? null,
        satuanLabel: row.satuan ?? "",
        btbId: row.id,
        id_btb: row.id_btb,
        asalBTB: row.noBTB,
        tanggalBTB: row.tanggal,
        supplier: row.nama_supplier,
        skema: row.skema ?? "",
        divisi: divisiOtomatis,
        keterangan: row.keterangan ?? "", // <-- pastikan mapping keterangan dari backend
      })),
      sumberBTB: selectedItems.map((row) => row.noBTB),
      skema: skemaToUse,
      divisi: divisiOtomatis,
    }));
  };

  // Handler tambah divisi
  const handleAddDivisi = async () => {
    if (!newDivisi.trim()) return;
    try {
      const res = await fetch(API_BASE_URL + "/api/divisi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ divisi: newDivisi }),
      });
      if (res.ok) {
        // Refresh data
        fetch(API_BASE_URL + "/api/divisi")
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) setDivisiOptions(data);
          });
        setNewDivisi("");
        setShowAddDivisi(false);
      }
    } catch { }
  };

  // Handler hapus divisi
  const handleDeleteDivisi = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    if (!window.confirm("Yakin ingin menghapus divisi ini?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/divisi/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetch(API_BASE_URL + "/api/divisi")
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) setDivisiOptions(data);
          });
      }
    } catch { }
  };

  // Handler edit divisi
  const handleEditDivisi = async (id: string) => {
    if (!editDivisiValue.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/divisi/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ divisi: editDivisiValue }),
      });
      if (res.ok) {
        fetch(API_BASE_URL + "/api/divisi")
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) setDivisiOptions(data);
          });
        setEditDivisiId(null);
        setEditDivisiValue("");
      }
    } catch { }
  };

  // Helper format tanggal ke yyyy-mm-dd untuk backend
  function formatDateForBackend(date: Date | null) {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Handler submit form BKB
  const handleSubmitBKB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.noBKB || !formData.tanggalBKB) {
      setNotif({
        type: "error",
        message: "No BKB dan Tanggal BKB wajib diisi.",
      });
      setTimeout(() => setNotif(null), 2500);
      return;
    }
    // Validasi stok cukup (pakai backendBTBRows, bukan btbData/localStorage)
    for (const [idx, b] of formData.barang.entries()) {
      const btb = backendBTBRows.find((row) => row.id === b.btbId);
      let sisa = 0;
      if (btb) {
        sisa = btb.sisa ?? btb.jumlah;
      }
      if (b.jumlah > sisa) {
        setNotif({
          type: "error",
          message: `Stok barang "${b.barang}" pada BTB tidak cukup!`,
        });
        setTimeout(() => setNotif(null), 2500);
        return;
      }
    }

    // Ambil user info dari localStorage
    const userRaw = localStorage.getItem("userData");
    let userId = null;
    let userSkema = "";
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        userId = user.id_user || user.id;
        userSkema = user.skema || "";
      } catch { }
    }

    // Ambil id_btb parent dari barang pertama yang dipilih (pastikan sudah ada di formData.barang)
    let id_btb = null;
    if (formData.barang && formData.barang.length > 0) {
      id_btb = formData.barang[0].id_btb || null;
    }

    // Ambil divisi dari formData (sudah otomatis)
    // --- Ambil nama divisi dari mapping, fallback ke formData.divisi jika sudah nama ---
    // --- Ambil nama divisi dari divisiOptions (terupdate) agar support edit nama ---
    const selectedDivisi = divisiOptions.find(
      (d: any) => String(d.id_divisi) === String(formData.divisi)
    );
    const divisi =
      selectedDivisi?.divisi || selectedDivisi?.nama_divisi || formData.divisi || "";

    // Siapkan payload untuk endpoint /api/bkb/full
    const payload = {
      no_bkb: formData.noBKB,
      tanggal_bkb: formatDateForBackend(formData.tanggalBKB),
      keterangan: formData.keterangan,
      dibuat_oleh: userId,
      dikeluarkan_oleh: userId,
      diterima_oleh: formData.diterima_oleh || "",
      skema: formData.skema, // <-- id_skema
      id_btb: id_btb, // <-- parent id_btb
      divisi: divisi, // <-- kirim nama divisi ke backend
      barang: formData.barang.map((b: any) => {
        const btb = backendBTBRows.find((row) => row.id === b.btbId);
        return {
          id_btb_item: b.btbId,
          nama_barang: b.barang,
          jumlah_keluar: b.jumlah,
          satuan: b.satuan, // <-- id_satuan
          keterangan: formData.keterangan,
          tanggal: btb?.tanggal || "",
        };
      }),
    };

    // --- Tambahkan console log sebelum fetch ---
    console.log("BKB SUBMIT: Akan dikirim ke endpoint:", API_BASE_URL + "/api/bkb/full");
    console.log("BKB SUBMIT: id_btb yang dikirim:", id_btb);
    console.log("BKB SUBMIT: payload:", payload);

    try {
      // Kirim ke endpoint /api/bkb/full agar backend insert bkb + bkb_item sekaligus
      const res = await fetch(API_BASE_URL + "/api/bkb/full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        setNotif({ type: "error", message: err.message || err.error || "Gagal simpan BKB" });
        setTimeout(() => setNotif(null), 2500);
        return;
      }
      setNotif({
        type: "success",
        message:
          "BKB berhasil disimpan! Halaman akan direfresh...",
      });
      // Auto refresh halaman setelah submit sukses
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      if (err.message?.includes("digunakan")) {
        console.warn("Validation error:", err.message);
        setNotif({ type: "error", message: err.message });
      } else {
        console.error(err);
        setNotif({ type: "error", message: "Gagal simpan BKB ke backend." });
      }
      setTimeout(() => setNotif(null), 2500);
    }
  };

  // Helper format tanggal ke yyyy-mm-dd untuk backend
  function formatDateForBackend(date: Date | null) {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Handler barang di form (tidak perlu dropdown satuan)
  const handleBarangChange = (idx: number, field: string, value: any) => {
    if (field === "jumlah") {
      const sisa = getSisaBTB(formData.barang[idx]);
      let val = Number(value);
      if (val > sisa) val = sisa;
      if (val < 0) val = 0; // <-- ubah dari 1 ke 0 agar minimum 0
      setFormData((prev: any) => ({
        ...prev,
        barang: prev.barang.map((b: any, i: number) =>
          i === idx ? { ...b, [field]: val } : b
        ),
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        barang: prev.barang.map((b: any, i: number) =>
          i === idx ? { ...b, [field]: value } : b
        ),
      }));
    }
  };

  // Helper: get BTB info for a barang row (ambil dari backendBTBRows)
  function getBTBInfo(btbId: string) {
    const btb = backendBTBRows.find((b) => b.id === btbId);
    return btb
      ? {
        noBTB: btb.noBTB,
        tanggal: btb.tanggal,
        supplier: btb.nama_supplier,
      }
      : { noBTB: btbId, tanggal: "", supplier: "" };
  }

  // Helper: get sisa BTB for a barang row
  function getSisaBTB(b: any) {
    const btb = backendBTBRows.find((row) => row.id === b.btbId);
    return btb ? btb.sisa ?? btb.jumlah : 0;
  }



  // ========================================
  // 1. PARSER No. BTB (E-WALK + PENTA)
  // ========================================
  // 1. PARSER No. BTB (E-WALK + PENTA)
  function parseNoBTB(noBTB: string | null | undefined) {
    if (!noBTB || typeof noBTB !== "string") return { year: 0, month: 0, urut: 0 };
    const s = noBTB.trim().toUpperCase();

    const romanMap: { [key: string]: number } = {
      'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6,
      'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12
    };

    const matchMid = s.match(/\/(\d{2})\/([IVX]+)(?:\/|$)/);
    let year = 0;
    let month = 0;

    if (matchMid) {
      year = 2000 + parseInt(matchMid[1], 10);
      month = romanMap[matchMid[2]] || 0;
    }

    const matchSeq = s.match(/(\d+)(?!.*\d)/);
    let urut = matchSeq ? parseInt(matchSeq[1], 10) : 0;

    return { year, month, urut };
  }

  // ========================================
  // 2. SORTING BTB TERBARU → TERLAMA
  // ========================================
  // ========================================
  // 2. SORTING BTB TERBARU → TERLAMA
  // ========================================
  function sortBTBList(filteredBTBData: any[]) {
    return [...filteredBTBData].sort((a, b) => {
      const pa = parseNoBTB(a.noBTB);
      const pb = parseNoBTB(b.noBTB);

      if (pa.year !== pb.year) return pa.year - pb.year;
      if (pa.month !== pb.month) return pa.month - pb.month;
      return pa.urut - pb.urut;
    });
  }

  // --- SORTING: BTB TERBARU → TERLAMA (PAKAI PARSER) ---
  const sortedBTBDataFinal = sortBTBList(filteredBTBData);

  // --- Pagination removed: show all data ---
  const paginatedBTBData = sortedBTBDataFinal;

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

  // Pada form input BKB, Asal BTB dan Daftar Barang ambil dari formData.barang (hasil checkbox)
  if (showForm) {
    // Ambil label skema dari mapping
    const skemaLabel =
      skemaMap[String(formData.skema)] || formData.skema || "-";
    return (
      <MainLayout>
        <div className="max-w-[1400px] px-4 mx-auto py-8">
          <h1 className="text-2xl font-bold mb-4">Input BKB</h1>
          {/* Notifikasi */}
          {notif && (
            <div
              className={`mb-4 px-4 py-2 rounded ${notif.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
                }`}
            >
              {notif.message}
              {/* Jika sukses, tampilkan tombol kembali ke monitoring */}
              {notif.type === "success" && (
                <div className="mt-2">
                  <Button
                    type="button"
                    onClick={() => router.push("/bkb/monitoring")}
                    className="bg-primary"
                  >
                    Kembali ke Monitoring BKB
                  </Button>
                </div>
              )}
            </div>
          )}
          <form onSubmit={handleSubmitBKB} className="space-y-6">
            {/* Daftar Barang & Tabel di paling atas */}
            <div>
              <Label className="mb-2">Daftar Barang</Label>
              <div className="border rounded-md p-2 overflow-x-auto" style={{ maxHeight: "70vh", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}>
                <Table className="w-full min-w-[1100px]">
                  <TableHeader>
                    <TableRow>
                      {/* Hapus checkbox group di form input BKB */}
                      {[
                        "Nama Barang",
                        "No. BTB",
                        "Tanggal BTB",
                        "Nama Supplier",
                        "Quantity",
                        "Satuan",
                        "Keterangan",
                        "Refrensi Nomor PR",
                      ].map((label) => (
                        <TableHead
                          key={label}
                          className="border border-gray-300 text-center"
                          style={{
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                            background: "#f3f4f6",
                            borderBottom: "2px solid #d1d5db",
                          }}
                        >
                          {label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.barang.map((b: any, idx: number) => {
                      const sisa = getSisaBTB(b);
                      const btbInfo = getBTBInfo(b.btbId);
                      const satuanLabel =
                        satuanMap[String(b.satuan)] ||
                        b.satuanLabel ||
                        b.satuan ||
                        "-";
                      const btbRow = backendBTBRows.find(
                        (row) => row.id === b.btbId
                      );
                      // --- Cari refrensi nomor PR dari btbRow ---
                      let noPR = "-";
                      if (btbRow) {
                        // Cek apakah ada field no_pr atau refrensiNoPr di btbRow
                        noPR = btbRow.no_pr || btbRow.refrensiNoPr || "-";
                        // Jika tidak ada, coba cari dari PO/PR mapping jika tersedia
                        if (
                          noPR === "-" &&
                          poItemList.length > 0 &&
                          prItemList.length > 0
                        ) {
                          // Cari PO Item dari id_po
                          const poItem = poItemList.find(
                            (pi: any) => String(pi.id_PO) === String(btbRow.id_po)
                          );
                          if (poItem) {
                            // Cari PR Item dari id_PRItem
                            const prItem = prItemList.find(
                              (pri: any) =>
                                String(pri.id_PRItem) === String(poItem.id_PRItem)
                            );
                            if (prItem) {
                              // Cari PR dari id_PR
                              const pr = prList.find(
                                (pr: any) =>
                                  String(pr.id_PR) === String(prItem.id_PR)
                              );
                              if (pr && pr.noPR) noPR = pr.noPR;
                            }
                          }
                        }
                      }
                      return (
                        <TableRow key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50/50 transition-colors`}>
                          {/* Nama Barang */}
                          <TableCell className="text-center align-middle px-4 py-3 uppercase">{b.barang}</TableCell>
                          {/* No. BTB */}
                          <TableCell className="text-center align-middle uppercase">{btbInfo.noBTB}</TableCell>
                          {/* Tanggal BTB */}
                          <TableCell className="text-center align-middle">{formatTanggalPas(btbRow?.tanggalBTB ?? "")}</TableCell>
                          {/* Nama Supplier */}
                          <TableCell className="text-center align-middle uppercase">{btbRow?.nama_supplier ?? "-"}</TableCell>
                          {/* Quantity */}
                          <TableCell className="text-center align-middle">
                            <div className="flex items-center gap-2 justify-center">
                              <Input
                                type="number"
                                min={1} // <-- ubah dari 1 ke 0
                                max={sisa}
                                value={formatInt(b.jumlah)}
                                onChange={(e) =>
                                  handleBarangChange(
                                    idx,
                                    "jumlah",
                                    e.target.value
                                  )
                                }
                                required
                                className="w-24 text-base text-center"
                              />
                              <span className="text-xs text-muted-foreground">
                                / {formatInt(sisa)}
                              </span>
                            </div>
                          </TableCell>
                          {/* Satuan */}
                          <TableCell className="text-center align-middle uppercase">{satuanLabel}</TableCell>
                          {/* Kolom baru: Keterangan dari b.keterangan */}
                          <TableCell className="text-center align-middle uppercase">
                            {b.keterangan
                              ? <KeteranganPopover text={b.keterangan} max={15} />
                              : "-"}
                          </TableCell>
                          {/* Kolom baru: Refrensi Nomor PR */}
                          <TableCell className="text-center align-middle uppercase">
                            {noPR}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
            {/* No BKB, Tanggal BKB, Nama Penerima */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 min-w-0">
              <div className="flex flex-col min-w-0">
                <Label className="mb-1">NO. BKB</Label>
                <Input
                  value={formData.noBKB}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      noBKB: e.target.value,
                    }))
                  }
                  required
                  className="w-full text-base"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <Label className="mb-1">TANGGAL BKB</Label>
                <DatePicker
                  id="tanggalBKB"
                  selected={formData.tanggalBKB}
                  onChange={(date) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      tanggalBKB: date,
                    }))
                  }
                  dateFormat="dd-MM-yyyy"
                  placeholderText="Pilih tanggal"
                  className="w-full px-3 py-2 border rounded-md bg-white text-base"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  dayClassName={highlightWeekends}
                  customInput={
                    <Input
                      value={
                        formData.tanggalBKB
                          ? `${String(formData.tanggalBKB.getDate()).padStart(
                            2,
                            "0"
                          )}-${String(
                            formData.tanggalBKB.getMonth() + 1
                          ).padStart(
                            2,
                            "0"
                          )}-${formData.tanggalBKB.getFullYear()}`
                          : ""
                      }
                      readOnly
                      className="w-full px-3 py-2 border rounded-md bg-white text-base"
                    />
                  }
                  popperPlacement="right-start"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <Label className="mb-1">NAMA PENERIMA</Label>
                <Input
                  value={formData.diterima_oleh || ""}
                  onChange={e => setFormData((prev: any) => ({ ...prev, diterima_oleh: e.target.value }))}
                  placeholder="Masukkan nama penerima"
                  className="w-full text-base"
                />
                {/* Input skema tetap dikirim ke backend, tapi disembunyikan */}
                <input type="hidden" name="skema" value={formData.skema} />
              </div>
            </div>
            {/* Divisi dan Keterangan di bawahnya */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-w-0">
              <div className="flex flex-col min-w-0">
                <Label className="mb-1">DIVISI</Label>
                <Select
                  value={String(formData.divisi)}
                  onValueChange={(val) =>
                    setFormData((prev: any) => ({ ...prev, divisi: val }))
                  }
                >
                  <SelectTrigger className="w-full text-base bg-white">
                    <SelectValue placeholder="Pilih Divisi" />
                  </SelectTrigger>
                  <SelectContent
                    className="max-h-[300px] bg-white z-[9999]"
                    style={{
                      scrollbarWidth: "auto",
                      scrollbarColor: "#bbb #fff",
                      overscrollBehavior: "contain",
                    }}
                  >
                    <div className="sticky top-0 z-20 bg-white px-2 py-2 border-b border-gray-100">
                      {showAddDivisi ? (
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Ketikan divisi disini"
                            value={newDivisi}
                            onChange={(e) => setNewDivisi(e.target.value)}
                            className="flex-1 h-8 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              e.stopPropagation();
                            }}
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              await handleAddDivisi();
                            }}
                            className="bg-primary text-white h-8 text-xs"
                          >
                            Simpan
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowAddDivisi(false);
                              setNewDivisi("");
                            }}
                            className="h-8 text-xs"
                          >
                            Batal
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Input
                            placeholder="Cari divisi..."
                            value={divisiSearch}
                            onChange={(e) => setDivisiSearch(e.target.value)}
                            className="mb-2 h-8 text-sm"
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowAddDivisi(true);
                              setDivisiSearch("");
                            }}
                          >
                            + Tambahkan Divisi
                          </Button>
                        </>
                      )}
                    </div>
                    {divisiOptions.length === 0 ? (
                      <SelectItem value="__loading" disabled>
                        Memuat...
                      </SelectItem>
                    ) : (
                      divisiOptions
                        .filter((d: any) =>
                          (d.divisi || d.nama_divisi || "")
                            .toLowerCase()
                            .includes(divisiSearch.toLowerCase())
                        )
                        .map((div: any) => (
                          <div
                            key={div.id_divisi}
                            className="flex items-center gap-2 px-2 py-1 group hover:bg-gray-50 bg-white"
                          >
                            {editDivisiId === String(div.id_divisi) ? (
                              <div className="flex flex-1 items-center gap-2" onClick={(e) => e.preventDefault()}>
                                <Input
                                  value={editDivisiValue}
                                  onChange={(e) =>
                                    setEditDivisiValue(e.target.value)
                                  }
                                  className="h-7 text-xs flex-1"
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  className="px-2 h-7 text-xs bg-primary text-white"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleEditDivisi(String(div.id_divisi));
                                  }}
                                >
                                  Simpan
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="px-2 h-7 text-xs"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setEditDivisiId(null);
                                    setEditDivisiValue("");
                                  }}
                                >
                                  Batal
                                </Button>
                              </div>
                            ) : (
                              <>
                                <SelectItem
                                  value={String(div.id_divisi)}
                                  className="flex-1 cursor-pointer"
                                >
                                  {div.divisi || div.nama_divisi || ""}
                                </SelectItem>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setEditDivisiId(String(div.id_divisi));
                                      setEditDivisiValue(div.divisi || div.nama_divisi || "");
                                    }}
                                  >
                                    <span className="text-[10px] font-bold">Edit</span>
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6 text-red-600 hover:text-red-800 hover:bg-red-50"
                                    onClick={(e) => handleDeleteDivisi(String(div.id_divisi), e)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col min-w-0">
                <Label className="mb-1">KETERANGAN</Label>
                <Input
                  value={formData.keterangan}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      keterangan: e.target.value,
                    }))
                  }
                  placeholder="Keterangan (opsional)"
                  className="w-full text-base"
                />
              </div>
            </div>
            {/* Tombol Simpan/Batal */}
            <div className="flex gap-2 justify-end">
              <Button type="submit" className="bg-primary px-6 text-base">
                Simpan BKB
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setSelectedBTBIds([]);
                  localStorage.removeItem("selectedBTBForBKB");
                }}
                className="px-6 text-base"
              >
                Batal
              </Button>
            </div>
          </form>
        </div>
      </MainLayout>
    );
  }

  // --- Group BTB items by id_btb for table rendering (match monitoring BTB) ---
  function groupBTBByIdBTB(data: any[]) {
    const grouped: Record<string, any[]> = {};
    data.forEach((row) => {
      const key = row.id_btb || row.noBTB;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });
    return grouped;
  }

  // Tabel BTB: urutan kolom sama seperti monitoring BTB
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Input BKB</h1>
          <p className="text-muted-foreground">
            Pilih barang BTB untuk dibuatkan Bukti Keluar Barang (BKB)
          </p>
        </div>
        {/* Filter tanggal BTB */}
        {!showForm && (
          <div className="flex items-center gap-2 mb-2">
            <Label className="text-sm font-medium">TANGGAL BTB:</Label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="yyyy-MM-dd"
              placeholderText="Mulai"
              className="w-[110px] px-2 py-1 border rounded-md bg-white text-xs"
              maxDate={endDate || undefined}
              isClearable
            />
            <span>-</span>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              dateFormat="yyyy-MM-dd"
              placeholderText="Selesai"
              className="w-[110px] px-2 py-1 border rounded-md bg-white text-xs"
              minDate={startDate || undefined}
              isClearable
            />
            <style jsx global>{`
              .react-datepicker__day.datepicker-red {
                color: #e53935 !important;
                font-weight: bold;
              }
              .react-datepicker-popper {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                z-index: 9999 !important;
              }
            `}</style>
          </div>
        )}
        {/* Tambahkan search bar seperti monitoring BKB */}
        {!showForm && (
          <div className="flex items-center gap-2 mb-2">
            <Input
              placeholder="Cari semua kolom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[320px]"
            />
          </div>
        )}
        {/* Tombol Input BKB */}
        <div className="mb-2 flex justify-end gap-2">
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={handleInputBKB}
            disabled={selectedBTBItemIds.length === 0}
          >
            Input BKB
          </Button>
        </div>
        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>DAFTAR BTB</CardTitle>
            <CardDescription>
              Total: {filteredBTBData.length} BTB Item
              {filteredBTBData.length > 0 && (
                <>
                  {" | "}
                  Menampilkan Semua Data
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto" style={{ maxHeight: "70vh", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}>
              <Table className="w-full min-w-[1100px]">
                <TableHeader>
                  <TableRow>
                    {/* Hapus checkbox group di form input BKB */}
                    <TableHead
                      className="border border-gray-300 text-center w-12"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    ></TableHead>
                    <TableHead
                      className="border border-gray-300 text-center min-w-[140px] uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      NO. BTB
                    </TableHead>
                    <TableHead
                      className="border border-gray-300 text-center min-w-[160px] uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      NAMA BARANG
                    </TableHead>
                    <TableHead
                      className="border border-gray-300 text-center min-w-[90px] uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      KUANTITAS
                    </TableHead>
                    <TableHead
                      className="border border-gray-300 text-center min-w-[90px] uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      SATUAN
                    </TableHead>
                    <TableHead
                      className="border border-gray-300 text-center min-w-[90px] uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      SISA STOK
                    </TableHead>
                    <TableHead
                      className="border border-gray-300 text-center min-w-[120px] uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      BIAYA
                    </TableHead>
                    <TableHead
                      className="border border-gray-300 text-center min-w-[120px] uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      TANGGAL BTB
                    </TableHead>
                    <TableHead
                      className="border border-gray-300 text-center min-w-[160px] uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      NAMA SUPPLIER
                    </TableHead>
                    <TableHead
                      className="border border-gray-300 text-center min-w-[120px] uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      NAMA PENERIMA
                    </TableHead>
                    {/* <TableHead
                      className="border border-gray-300 text-center min-w-[120px] uppercase"
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        background: "#f3f4f6",
                        borderBottom: "2px solid #d1d5db",
                      }}
                    >
                      SKEMA
                    </TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-4">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : (
                    (() => {
                      const grouped = groupBTBByIdBTB(paginatedBTBData);
                      // CRITICAL FIX: Sort the groups explicitly by sequence number of the first item
                      const sortedGroups = Object.entries(grouped).sort(([, itemsA], [, itemsB]) => {
                        const getSeq = (items: any[]) => {
                          const no = items[0]?.noBTB || "";
                          const match = no.trim().match(/(\d+)$/);
                          return match ? parseInt(match[1], 10) : 0;
                        };
                        return getSeq(itemsA) - getSeq(itemsB); // Ascending
                      });

                      return sortedGroups.map(([id_btb, items], idx) => {
                        if (!items || items.length === 0) return null;
                        // Urutkan items ASC by id_btb_item (atau id_btbItem/id)
                        const sortedItems = [...items].sort((a, b) => {
                          const getId = (x) => x.id_btb_item ?? x.id_btbItem ?? x.id;
                          return getId(a) - getId(b);
                        });
                        const fragmentKey = id_btb || `id_btb-unknown-${idx}`;
                        return (
                          <React.Fragment key={fragmentKey}>
                            {sortedItems.map((item, itemIdx) => (
                              <TableRow key={`${id_btb}-item-${itemIdx}`} className={`hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                                {/* Checkbox group (select all per BTB), hanya di baris pertama */}
                                {itemIdx === 0 && (
                                  <TableCell rowSpan={items.length} className="border border-gray-300 px-3 py-1 text-center align-middle">
                                    <Checkbox
                                      checked={items.every((itm) => selectedBTBItemIds.includes(itm.id))}
                                      {...(
                                        items.some((itm) => selectedBTBItemIds.includes(itm.id)) &&
                                          !items.every((itm) => selectedBTBItemIds.includes(itm.id))
                                          ? { indeterminate: true }
                                          : {}
                                      )}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          const idsToAdd = items.map((itm) => itm.id).filter((id) => !selectedBTBItemIds.includes(id));
                                          setSelectedBTBItemIds((prev) => [...prev, ...idsToAdd]);
                                        } else {
                                          setSelectedBTBItemIds((prev) => prev.filter((id) => !items.map((itm) => itm.id).includes(id)));
                                        }
                                      }}
                                    />
                                  </TableCell>
                                )}
                                {/* No. BTB (rowSpan) hanya di baris pertama */}
                                {itemIdx === 0 && (
                                  <TableCell rowSpan={items.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap font-medium uppercase">
                                    {item.noBTB}
                                  </TableCell>
                                )}
                                {/* Nama Barang + Checkbox per item di sebelah kiri nama barang */}
                                <TableCell className="border border-gray-300 px-3 py-1 text-center whitespace-nowrap flex items-center gap-2 uppercase">
                                  <Checkbox
                                    checked={selectedBTBItemIds.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      handleSelectBTBItem(item.id, !!checked);
                                    }}
                                  />
                                  <span>{item.nama_barang}</span>
                                </TableCell>
                                {/* Quantity */}
                                <TableCell className="border border-gray-300 px-3 py-1 text-center whitespace-nowrap">
                                  {formatInt(item.jumlah)}
                                </TableCell>
                                {/* Satuan */}
                                <TableCell className="border border-gray-300 px-3 py-1 text-center whitespace-nowrap uppercase">
                                  {item.satuan}
                                </TableCell>
                                {/* Sisa Stok */}
                                <TableCell className="border border-gray-300 px-3 py-1 text-center whitespace-nowrap">
                                  <Badge variant={Number(item.sisa) > 0 ? "default" : "destructive"}>
                                    {formatInt(item.sisa)}
                                  </Badge>
                                </TableCell>
                                {/* Biaya: hanya di baris pertama, rowSpan */}
                                {itemIdx === 0 && (
                                  <TableCell rowSpan={items.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap uppercase">
                                    {formatRupiah(item.biaya)}
                                  </TableCell>
                                )}
                                {/* Tanggal BTB (rowSpan) hanya di baris pertama */}
                                {itemIdx === 0 && (
                                  <TableCell rowSpan={items.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap uppercase">
                                    {formatTanggalPas(item.tanggalBTB)}
                                  </TableCell>
                                )}
                                {/* Nama Supplier (rowSpan) hanya di baris pertama */}
                                {itemIdx === 0 && (
                                  <TableCell rowSpan={items.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap uppercase">
                                    {item.nama_supplier || "-"}
                                  </TableCell>
                                )}
                                {/* Diterima Oleh (rowSpan) hanya di baris pertama */}
                                {itemIdx === 0 && (
                                  <TableCell rowSpan={items.length} className="border border-gray-300 px-3 py-1 text-center align-middle whitespace-nowrap uppercase">
                                    {String(userMap[String(item.diterimaOleh)] ?? item.diterimaOleh).replace(/_/g, " ")}
                                  </TableCell>
                                )}
                                {/* Skema (rowSpan) hanya di baris pertama */}
                                {/* {itemIdx === 0 && (
                                  <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap uppercase">
                                    {skemaMap[String(item.skema)] ?? item.skema}
                                  </TableCell>
                                )} */}
                              </TableRow>
                            ))}
                          </React.Fragment>
                        );
                      });
                    })()
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination bawah tabel */}
            {/* Pagination removed */}
          </CardContent>
        </Card>
      </div>
    </MainLayout >
  );
}

function highlightWeekends(date: Date) {
  const day = date.getDay();
  if (day === 0 || day === 6) return "datepicker-red";
  return undefined;
}

function formatTanggalKurangSehari(tgl: string) {
  if (!tgl) return "-";
  let dateObj;
  if (/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
    dateObj = dayjs(tgl).subtract(1, "day");
  } else if (tgl.includes("T")) {
    dateObj = dayjs(tgl).subtract(1, "day");
  } else {
    dateObj = dayjs(tgl).subtract(1, "day");
  }
  return dateObj.format("DD-MM-YYYY");
}

function formatTanggalTambahSehari(tgl: string) {
  if (!tgl) return "-";
  // Pastikan hanya tambah 1 hari, tidak double
  return dayjs(tgl).add(1, "day").format("DD-MM-YYYY");
}

function formatTanggalPas(tgl: string) {
  if (!tgl) return "-";
  return dayjs.utc(tgl).local().format("DD-MM-YYYY");
}

// Komponen untuk popover keterangan (hover, abu-abu)
function KeteranganPopover({ text, max = 15 }: { text: string; max?: number }) {
  const [show, setShow] = React.useState(false);
  const [pos, setPos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const ref = React.useRef<HTMLSpanElement>(null);

  if (!text) return "";
  if (text.length <= max) return text;

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPos({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 4,
    });
    setShow(true);
  };
  const handleMouseLeave = () => setShow(false);

  return (
    <>
      <span
        ref={ref}
        className="cursor-pointer"
        style={{
          whiteSpace: "nowrap",
          textDecoration: "underline dotted",
          color: "#6b7280",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {text.slice(0, max) + "..."}{" "}
      </span>
      {show &&
        typeof window !== "undefined" &&
        ReactDOM.createPortal(
          <div
            className="z-[9999] bg-gray-100 text-gray-700 border border-gray-300 rounded px-3 py-2 shadow-lg max-w-xs text-sm"
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              minWidth: 200,
              whiteSpace: "pre-line",
              pointerEvents: "none",
            }}
          >
            {text}
          </div>,
          document.body
        )}
    </>
  );
}
