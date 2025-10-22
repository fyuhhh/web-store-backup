"use client";

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
  const [loading, setLoading] = useState(false);

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
          skema: user.skema || "", // <-- set skema otomatis dari user login
        }));
        setUserSchema(user.skema || ""); // <-- set userSchema state
        setUserSkemaId(String(user.id_skema ?? user.skema ?? "")); // Set id_skema user
      } catch {}
    }
  }, []);

  // Ambil data BTB dari backend (persis monitoring BTB)
  useEffect(() => {
    async function fetchBTBData() {
      setLoading(true);
      try {
        const [btbRes, btbItemRes, userRes, skemaRes, satuanRes] =
          await Promise.all([
            fetch("http://localhost:5000/api/btb"),
            fetch("http://localhost:5000/api/btb-item"),
            fetch("http://localhost:5000/api/user"),
            fetch("http://localhost:5000/api/skema"),
            fetch("http://localhost:5000/api/satuan"),
          ]);
        const btbList = await btbRes.json();
        const btbItemList = await btbItemRes.json();
        const userList = await userRes.json();
        const skemaList = await skemaRes.json();
        const satuanList = await satuanRes.json();

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

        // Gabungkan: untuk setiap btb_item, cari parent btb
        const rows = btbItemList.map((item: any) => {
          const btb = btbList.find((b: any) => b.id_btb === item.id_btb);
          return {
            id: item.id_btb_item,
            noBTB: btb?.no_btb ?? "",
            tanggalBTB: btb?.tanggal_btb ?? "", // <-- ambil tanggal_btb dari backend
            tanggal: btb?.tanggal_diterima ?? "", // legacy, bisa dihapus jika tidak dipakai
            periode: btb?.periode ?? "",
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
          };
        });
        setBackendBTBRows(rows);
      } catch (err) {
        setBackendBTBRows([]);
      }
      setLoading(false);
    }
    fetchBTBData();
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

  // Handler Input BKB button
  const handleInputBKB = () => {
    if (selectedBTBIds.length === 0) {
      alert("Pilih minimal satu BTB untuk dibuatkan BKB.");
      return;
    }
    // Ambil BTB yang dipilih dari backendBTBRows
    const selectedBTB = backendBTBRows.filter((row) =>
      selectedBTBIds.includes(row.id)
    );
    // Gabungkan daftar barang dari semua BTB terpilih, hanya yang sisa > 0
    const selectedBarangWithBTBId = selectedBTB.map((row) => ({
      barang: row.nama_barang,
      jumlah: row.sisa ?? row.jumlah,
      satuan: row.id_satuan ?? null, // id_satuan untuk backend
      satuanLabel: row.satuan ?? "", // label untuk tampilan
      btbId: row.id,
      asalBTB: row.noBTB,
      tanggalBTB: row.tanggal,
      supplier: row.nama_supplier,
      skema: row.skema ?? "", // id_skema dari BTB
    }));
    // Ambil skema dari BTB pertama yang dipilih (atau dari user login jika tidak ada)
    const skemaOtomatis =
      selectedBarangWithBTBId[0]?.skema ||
      JSON.parse(localStorage.getItem("userData") || "{}").skema ||
      "";
    setShowForm(true);
    setFormData((prev: any) => ({
      ...prev,
      barang: selectedBarangWithBTBId,
      sumberBTB: selectedBTB.map((row) => row.noBTB),
      skema: skemaOtomatis,
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

    // Siapkan payload untuk backend
    const payload = {
      no_bkb: formData.noBKB,
      tanggal_bkb: formatDateForBackend(formData.tanggalBKB),
      keterangan: formData.keterangan,
      dibuat_oleh: userId,
      dikeluarkan_oleh: userId,
      skema: formData.skema, // <-- id_skema
      barang: formData.barang.map((b: any) => {
        // Ambil tanggal BTB dari backendBTBRows
        const btb = backendBTBRows.find((row) => row.id === b.btbId);
        return {
          id_btb_item: b.btbId,
          nama_barang: b.barang,
          jumlah_keluar: b.jumlah,
          satuan: b.satuan, // <-- id_satuan
          keterangan: formData.keterangan,
          tanggal: btb?.tanggal || "", // <-- tambahkan tanggal BTB
        };
      }),
    };

    try {
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
      setNotif({ type: "success", message: "BKB berhasil disimpan!" });
      setTimeout(() => {
        setNotif(null);
        router.push("/bkb/monitoring");
      }, 1800);
    } catch (err: any) {
      setNotif({ type: "error", message: "Gagal simpan BKB ke backend." });
      setTimeout(() => setNotif(null), 2500);
    }
  };

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
        <div className="max-w-3xl mx-auto py-8">
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
            </div>
          )}
          {/* Detail asal BTB */}
          <div className="mb-6">
            <Label className="font-semibold">Asal BTB</Label>
            <div className="border rounded-md p-2 bg-muted/50 text-sm">
              {formData.barang.map((b: any, idx: number) => {
                const btbInfo = getBTBInfo(b.btbId);
                return (
                  <div key={idx}>
                    <span className="font-medium">{b.barang}</span> dari
                    <span className="text-primary font-semibold">
                      {btbInfo.noBTB}
                    </span>
                    {/* Tanggal dihapus dari tampilan asal BTB */}
                    {btbInfo.supplier && (
                      <span className="ml-2 text-muted-foreground">
                        - {btbInfo.supplier}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <form onSubmit={handleSubmitBKB} className="space-y-6">
            <div className="flex gap-4 min-w-0">
              <div className="flex-1 min-w-0">
                <Label>No BKB</Label>
                <Input
                  value={formData.noBKB}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      noBKB: e.target.value,
                    }))
                  }
                  required
                  className="w-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Label>Tanggal BKB</Label>
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
                  className="w-full px-3 py-2 border rounded-md bg-white"
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
                      className="w-full px-3 py-2 border rounded-md bg-white"
                    />
                  }
                />
              </div>
              <div className="flex-1 min-w-0">
                <Label>Skema</Label>
                <Input
                  value={skemaLabel}
                  readOnly
                  className="w-full bg-muted/50 cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <Label>Daftar Barang</Label>
              <div className="border rounded-md p-2 overflow-x-auto">
                <Table className="w-full min-w-[800px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {/* Checkbox header jika ingin multi-select */}
                      </TableHead>
                      <TableHead>
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
                      <TableHead>
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
                                    .includes(
                                      tanggalBTBSearchTerm.toLowerCase()
                                    )
                                )
                                .map((t) => (
                                  <div
                                    key={t}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
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
                                    <Label className="text-sm">{t}</Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1">
                              Periode <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <Input
                              placeholder="Cari periode..."
                              value={periodeSearchTerm}
                              onChange={(e) =>
                                setPeriodeSearchTerm(e.target.value)
                              }
                            />
                            <div className="max-h-40 overflow-y-auto mt-2">
                              {uniquePeriode
                                .filter((p) =>
                                  p
                                    .toLowerCase()
                                    .includes(periodeSearchTerm.toLowerCase())
                                )
                                .map((p) => (
                                  <div
                                    key={p}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      checked={filterPeriode === p}
                                      onCheckedChange={(checked) => {
                                        setFilterPeriode(checked ? p : "");
                                      }}
                                    />
                                    <Label className="text-sm">{p}</Label>
                                  </div>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead>
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
                      <TableHead>
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
                      <TableHead>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1">
                              Quantity BTB <ChevronDown className="w-4 h-4" />
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
                      <TableHead>
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
                      <TableHead>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1">
                              Sisa Stok <ChevronDown className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-white">
                            <span className="text-xs text-muted-foreground">
                              Filter sisa stok manual diimplementasi jika perlu
                            </span>
                          </PopoverContent>
                        </Popover>
                      </TableHead>
                      <TableHead>
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
                      <TableHead>Diterima Oleh</TableHead>
                      <TableHead>Skema</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.barang.map((b: any, idx: number) => {
                      const sisa = getSisaBTB(b);
                      const btbInfo = getBTBInfo(b.btbId);
                      // Ambil label satuan dari mapping jika ada
                      const satuanLabel =
                        satuanMap[String(b.satuan)] ||
                        b.satuanLabel ||
                        b.satuan ||
                        "-";
                      return (
                        <TableRow key={idx}>
                          <TableCell>{b.barang}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
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
                                className="w-20"
                              />
                              <span className="text-xs text-muted-foreground">
                                / {formatInt(sisa)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={sisa > 0 ? "default" : "destructive"}
                            >
                              {formatInt(sisa)}
                            </Badge>
                          </TableCell>
                          <TableCell>{satuanLabel}</TableCell>
                          <TableCell>
                            <span className="font-medium">{btbInfo.noBTB}</span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div>
              <Label>Keterangan</Label>
              <Input
                value={formData.keterangan}
                onChange={(e) =>
                  setFormData((prev: any) => ({
                    ...prev,
                    keterangan: e.target.value,
                  }))
                }
                placeholder="Keterangan (opsional)"
                className="w-full"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="submit" className="bg-primary">
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
              >
                Batal
              </Button>
            </div>
          </form>
        </div>
      </MainLayout>
    );
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
            Pilih data BTB untuk dibuatkan Bukti Keluar Barang (BKB)
          </p>
        </div>
        {/* Tombol Input BKB */}
        <div className="mb-2 flex justify-end gap-2">
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={handleInputBKB}
            disabled={selectedBTBIds.length === 0}
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
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {/* Checkbox header jika ingin multi-select */}
                    </TableHead>
                    <TableHead>
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
                    <TableHead>
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
                                  <Label className="text-sm">{t}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Periode <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari periode..."
                            value={periodeSearchTerm}
                            onChange={(e) =>
                              setPeriodeSearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniquePeriode
                              .filter((p) =>
                                p
                                  .toLowerCase()
                                  .includes(periodeSearchTerm.toLowerCase())
                              )
                              .map((p) => (
                                <div
                                  key={p}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    checked={filterPeriode === p}
                                    onCheckedChange={(checked) => {
                                      setFilterPeriode(checked ? p : "");
                                    }}
                                  />
                                  <Label className="text-sm">{p}</Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead>
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
                    <TableHead>
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
                    <TableHead>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Quantity BTB <ChevronDown className="w-4 h-4" />
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
                    <TableHead>
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
                    <TableHead>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="inline-flex items-center gap-1">
                            Sisa Stok <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <span className="text-xs text-muted-foreground">
                            Filter sisa stok manual diimplementasi jika perlu
                          </span>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead>
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
                    <TableHead>Diterima Oleh</TableHead>
                    <TableHead>Skema</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={12}>Loading...</TableCell>
                    </TableRow>
                  ) : (
                    filteredBTBData.map((row, idx) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          {/* Checkbox untuk pilih BTB item */}
                          <Checkbox
                            checked={selectedBTBIds.includes(row.id)}
                            onCheckedChange={(checked) =>
                              setSelectedBTBIds((prev) =>
                                checked
                                  ? [...prev, row.id]
                                  : prev.filter((id) => id !== row.id)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>{row.noBTB}</TableCell>
                        <TableCell>{formatTanggal(row.tanggalBTB)}</TableCell>
                        <TableCell>{row.periode}</TableCell>
                        <TableCell>{row.nama_supplier}</TableCell>
                        <TableCell>{row.nama_barang}</TableCell>
                        <TableCell>{formatInt(row.jumlah)}</TableCell>
                        <TableCell>{row.satuan}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              Number(row.sisa) > 0 ? "default" : "destructive"
                            }
                          >
                            {formatInt(row.sisa)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatRupiah(row.biaya)}</TableCell>
                        <TableCell>
                          {userMap[String(row.diterimaOleh)] ??
                            row.diterimaOleh}
                        </TableCell>
                        <TableCell>
                          {skemaMap[String(row.skema)] ?? row.skema}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
