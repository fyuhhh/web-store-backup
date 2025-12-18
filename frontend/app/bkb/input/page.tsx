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
import { ChevronDown } from "lucide-react";
import type { BTBData } from "@/lib/dummy-data";
import { MainLayout } from "@/components/layout/main-layout";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
dayjs.extend(utc);

export default function BKBInputPage() {
  // State
  const [btbData, setBtbData] = useState<BTBData[]>([]);
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

  useEffect(() => {
    const storedBTB = localStorage.getItem("btbData");
    if (storedBTB) {
      const userRaw = localStorage.getItem("userData");
      let userSchema = "";
      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);
          userSchema = user.skema || ""; // <-- ambil dari skema, bukan schema
        } catch {}
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
      } catch {}
    }

    // Ambil data BTB dari backend (persis monitoring BTB)
    async function fetchBTBData() {
      setLoading(true);
      try {
        const [btbRes, btbItemRes, userRes, skemaRes, satuanRes, divisiRes] =
          await Promise.all([
            fetch("http://localhost:5000/api/btb"),
            fetch("http://localhost:5000/api/btb-item"),
            fetch("http://localhost:5000/api/user"),
            fetch("http://localhost:5000/api/skema"),
            fetch("http://localhost:5000/api/satuan"),
            fetch("http://localhost:5000/api/divisi"),
          ]);
        const btbList = await btbRes.json();
        const btbItemList = await btbItemRes.json();
        const userList = await userRes.json();
        const skemaList = await skemaRes.json();
        const satuanList = await satuanRes.json();
        const divisiList = await divisiRes.json();

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
    fetch("http://localhost:5000/api/pr")
      .then((res) => res.json())
      .then((data) => setPrList(data));
    fetch("http://localhost:5000/api/po")
      .then((res) => res.json())
      .then((data) => setPoList(data));
    fetch("http://localhost:5000/api/po-item")
      .then((res) => res.json())
      .then((data) => setPoItemList(data));
    fetch("http://localhost:5000/api/pr-item")
      .then((res) => res.json())
      .then((data) => setPrItemList(data));
  }, []);

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
    .filter((row) => {
      const matchesSearch =
        row.noBTB.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.nama_supplier || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (row.nama_barang || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      return matchesSearch;
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
    const selectedItems = backendBTBRows.filter((row) =>
      selectedBTBItemIds.includes(row.id)
    );
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

    setShowForm(true);
    setFormData((prev: any) => ({
      ...prev,
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
      skema: selectedItems[0]?.skema ||
        JSON.parse(localStorage.getItem("userData") || "{}").skema ||
        "",
      divisi: divisiOtomatis,
    }));
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
      } catch {}
    }

    // Ambil id_btb parent dari barang pertama yang dipilih (pastikan sudah ada di formData.barang)
    let id_btb = null;
    if (formData.barang && formData.barang.length > 0) {
      id_btb = formData.barang[0].id_btb || null;
    }

    // Ambil divisi dari formData (sudah otomatis)
    // --- Ambil nama divisi dari mapping, fallback ke formData.divisi jika sudah nama ---
    const divisi =
      divisiMap[String(formData.divisi)] ||
      formData.divisi ||
      "";

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
    console.log("BKB SUBMIT: Akan dikirim ke endpoint:", "http://localhost:5000/api/bkb/full");
    console.log("BKB SUBMIT: id_btb yang dikirim:", id_btb);
    console.log("BKB SUBMIT: payload:", payload);

    try {
      // Kirim ke endpoint /api/bkb/full agar backend insert bkb + bkb_item sekaligus
      const res = await fetch("http://localhost:5000/api/bkb/full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        setNotif({ type: "error", message: err.error || "Gagal simpan BKB" });
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
      setNotif({ type: "error", message: "Gagal simpan BKB ke backend." });
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
      if (val < 1) val = 1;
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

  // Tambahkan state untuk pagination daftar BTB
  const [btbCurrentPage, setBtbCurrentPage] = useState(1);
  const btbItemsPerPage = 10;

  // ========================================
  // 1. PARSER No. BTB (E-WALK + PENTA)
  // ========================================
  function parseNoBTB(noBTB: string | null | undefined) {
    if (!noBTB || typeof noBTB !== "string") return null;
    const s = noBTB.trim().toUpperCase();

    // --- FORMAT 1: E-WALK ---
    // BTB/E-WALK/25/XI/001
    const regexEwalk = /^BTB\/E-?WALK\/(\d{2})\/([IVXLCDM]{1,4})\/(\d{1,5})$/;

    // --- FORMAT 2: PENTACITY ---
    // INV/BTB/25/XI/00001
    const regexPenta = /^INV\/BTB\/(\d{2})\/([IVXLCDM]{1,4})\/(\d{1,5})$/;

    let match = s.match(regexEwalk);
    let brand = "E-WALK";

    if (!match) {
      match = s.match(regexPenta);
      brand = "PENTA";
    }

    if (!match) return null;

    const [, tahun2, bulanRomawi, urutStr] = match;

    const bulanMap: Record<string, number> = {
      I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
      VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12,
    };

    const bulan = bulanMap[bulanRomawi] ?? 0;
    const tahun = 2000 + parseInt(tahun2, 10);
    const urut = parseInt(urutStr, 10);

    return { tahun, bulan, urut, brand };
  }

  // ========================================
  // 2. SORTING BTB TERBARU → TERLAMA
  // ========================================
  function sortBTBList(filteredBTBData: any[]) {
    const allValid = filteredBTBData.every(
      (x) => typeof x.noBTB === "string" && parseNoBTB(x.noBTB)
    );

    if (allValid) {
      return [...filteredBTBData].sort((a, b) => {
        const pa = parseNoBTB(a.noBTB)!;
        const pb = parseNoBTB(b.noBTB)!;

        if (pa.tahun !== pb.tahun) return pa.tahun - pb.tahun; // DESC
        if (pa.bulan !== pb.bulan) return pa.bulan - pb.bulan; // DESC
        return pa.urut - pb.urut; // DESC
      });
    }

    // fallback
    return [...filteredBTBData].sort((a, b) => Number(b.id) - Number(a.id));
  }

  // --- SORTING: BTB TERBARU → TERLAMA (PAKAI PARSER) ---
  const sortedBTBDataFinal = sortBTBList(filteredBTBData);

  // --- Pagination logic untuk daftar BTB ---
  const btbTotalPages = Math.max(
    1,
    Math.ceil(sortedBTBDataFinal.length / btbItemsPerPage)
  );
  const paginatedBTBData = sortedBTBDataFinal.slice(
    (btbCurrentPage - 1) * btbItemsPerPage,
    btbCurrentPage * btbItemsPerPage
  );

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
              className={`mb-4 px-4 py-2 rounded ${
                notif.type === "success"
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
              <div className="border rounded-md p-2 overflow-x-auto">
                <Table className="w-full min-w-[1100px]">
                  <TableHeader>
                    <TableRow>
                      {/* Hapus checkbox group di form input BKB */}
                      <TableHead className="border border-gray-300 text-center min-w-[160px]">
                        Nama Barang
                      </TableHead>
                      <TableHead className="border border-gray-300 text-center min-w-[140px]">
                        No. BTB
                      </TableHead>
                      <TableHead className="border border-gray-300 text-center min-w-[120px]">
                        Tanggal BTB
                      </TableHead>
                      <TableHead className="border border-gray-300 text-center min-w-[160px]">
                        Nama Supplier
                      </TableHead>
                      <TableHead className="border border-gray-300 text-center min-w-[90px]">
                        Quantity
                      </TableHead>
                      <TableHead className="border border-gray-300 text-center min-w-[90px]">
                        Satuan
                      </TableHead>
                      {/* Tambahkan kolom Keterangan */}
                      <TableHead className="border border-gray-300 text-center min-w-[160px]">
                        Keterangan
                      </TableHead>
                      {/* Tambahkan kolom Refrensi Nomor PR */}
                      <TableHead className="border border-gray-300 text-center min-w-[160px]">
                        Refrensi Nomor PR
                      </TableHead>
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
                        <TableRow key={idx}>
                          {/* Nama Barang */}
                          <TableCell className="text-center align-middle px-4 py-3">{b.barang}</TableCell>
                          {/* No. BTB */}
                          <TableCell className="text-center align-middle">{btbInfo.noBTB}</TableCell>
                          {/* Tanggal BTB */}
                          <TableCell className="text-center align-middle">{formatTanggalPas(btbRow?.tanggalBTB ?? "")}</TableCell>
                          {/* Nama Supplier */}
                          <TableCell className="text-center align-middle">{btbRow?.nama_supplier ?? "-"}</TableCell>
                          {/* Quantity */}
                          <TableCell className="text-center align-middle">
                            <div className="flex items-center gap-2 justify-center">
                              <Input
                                type="number"
                                min={1}
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
                          <TableCell className="text-center align-middle">{satuanLabel}</TableCell>
                          {/* Kolom baru: Keterangan dari b.keterangan */}
                          <TableCell className="text-center align-middle">
                            {b.keterangan || "-"}
                          </TableCell>
                          {/* Kolom baru: Refrensi Nomor PR */}
                          <TableCell className="text-center align-middle">
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
                <Label className="mb-1">No BKB</Label>
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
                <Label className="mb-1">Tanggal BKB</Label>
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
                <Label className="mb-1">Nama Penerima</Label>
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
                <Label className="mb-1">Divisi</Label>
                <Input
                  value={
                    divisiMap[String(formData.divisi)] ||
                    formData.divisi ||
                    ""
                  }
                  readOnly
                  className="w-full text-base bg-gray-100"
                  placeholder="Divisi otomatis dari PR/user"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <Label className="mb-1">Keterangan</Label>
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Input BKB</h1>
          <p className="text-muted-foreground">
            Pilih barang BTB untuk dibuatkan Bukti Keluar Barang (BKB)
          </p>
        </div>
        {/* Search Bar untuk Daftar BTB */}
        {!showForm && (
          <div className="flex items-center gap-2 mb-2">
            <Input
              placeholder="Cari No. BTB, Supplier, atau Nama Barang..."
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
            <CardTitle>Daftar BTB</CardTitle>
            <CardDescription>
              Total: {filteredBTBData.length} BTB Item
              {filteredBTBData.length > 0 && (
                <>
                  {" | "}
                  Menampilkan {(btbCurrentPage - 1) * btbItemsPerPage + 1}-
                  {Math.min(
                    btbCurrentPage * btbItemsPerPage,
                    filteredBTBData.length
                  )}
                  {" dari "}
                  {filteredBTBData.length} BTB Item
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="border border-gray-300">
                <TableHeader>
                  <TableRow>
                    {/* Checkbox group (select all per BTB) di paling kiri, rowSpan */}
                    <TableHead className="border border-gray-300 text-center w-12"></TableHead>
                    <TableHead className="border border-gray-300 text-center min-w-[140px]">
                      No. BTB
                    </TableHead>
                    <TableHead className="border border-gray-300 text-center min-w-[160px]">
                      Nama Barang
                    </TableHead>
                    <TableHead className="border border-gray-300 text-center min-w-[90px]">
                      Quantity
                    </TableHead>
                    <TableHead className="border border-gray-300 text-center min-w-[90px]">
                      Satuan
                    </TableHead>
                    <TableHead className="border border-gray-300 text-center min-w-[90px]">
                      Sisa Stok
                    </TableHead>
                    <TableHead className="border border-gray-300 text-center min-w-[120px]">
                      Biaya
                    </TableHead>
                    <TableHead className="border border-gray-300 text-center min-w-[120px]">
                      Tanggal BTB
                    </TableHead>
                    <TableHead className="border border-gray-300 text-center min-w-[160px]">
                      Nama Supplier
                    </TableHead>
                    <TableHead className="border border-gray-300 text-center min-w-[120px]">
                      Nama Penerima
                    </TableHead>
                    <TableHead className="border border-gray-300 text-center min-w-[120px]">
                      Skema
                    </TableHead>
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
                      return Object.entries(grouped).map(([id_btb, items], idx) => {
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
                              <TableRow key={`${id_btb}-item-${itemIdx}`} className="hover:bg-gray-50 transition-colors">
                                {/* Checkbox group (select all per BTB), hanya di baris pertama */}
                                {itemIdx === 0 && (
                                  <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle">
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
                                  <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap font-medium">
                                    {item.noBTB}
                                  </TableCell>
                                )}
                                {/* Nama Barang + Checkbox per item di sebelah kiri nama barang */}
                                <TableCell className="border border-gray-300 px-4 py-3 text-center whitespace-nowrap flex items-center gap-2">
                                  <Checkbox
                                    checked={selectedBTBItemIds.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      handleSelectBTBItem(item.id, !!checked);
                                    }}
                                  />
                                  <span>{item.nama_barang}</span>
                                </TableCell>
                                {/* Quantity */}
                                <TableCell className="border border-gray-300 px-4 py-3 text-center whitespace-nowrap">
                                  {formatInt(item.jumlah)}
                                </TableCell>
                                {/* Satuan */}
                                <TableCell className="border border-gray-300 px-4 py-3 text-center whitespace-nowrap">
                                  {item.satuan}
                                </TableCell>
                                {/* Sisa Stok */}
                                <TableCell className="border border-gray-300 px-4 py-3 text-center whitespace-nowrap">
                                  <Badge variant={Number(item.sisa) > 0 ? "default" : "destructive"}>
                                    {formatInt(item.sisa)}
                                  </Badge>
                                </TableCell>
                                {/* Biaya: hanya di baris pertama, rowSpan */}
                                {itemIdx === 0 && (
                                  <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap">
                                    {formatRupiah(item.biaya)}
                                  </TableCell>
                                )}
                                {/* Tanggal BTB (rowSpan) hanya di baris pertama */}
                                {itemIdx === 0 && (
                                  <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap">
                                    {formatTanggalPas(item.tanggalBTB)}
                                  </TableCell>
                                )}
                                {/* Nama Supplier (rowSpan) hanya di baris pertama */}
                                {itemIdx === 0 && (
                                  <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap">
                                    {item.nama_supplier || "-"}
                                  </TableCell>
                                )}
                                {/* Diterima Oleh (rowSpan) hanya di baris pertama */}
                                {itemIdx === 0 && (
                                  <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap">
                                    {userMap[String(item.diterimaOleh)] ?? item.diterimaOleh}
                                  </TableCell>
                                )}
                                {/* Skema (rowSpan) hanya di baris pertama */}
                                {itemIdx === 0 && (
                                  <TableCell rowSpan={items.length} className="border border-gray-300 px-4 py-3 text-center align-middle whitespace-nowrap">
                                    {skemaMap[String(item.skema)] ?? item.skema}
                                  </TableCell>
                                )}
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
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setBtbCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      className={
                        btbCurrentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: btbTotalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setBtbCurrentPage(page)}
                          isActive={btbCurrentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setBtbCurrentPage((prev) =>
                          Math.min(btbTotalPages, prev + 1)
                        )
                      }
                      className={
                        btbCurrentPage === btbTotalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
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
