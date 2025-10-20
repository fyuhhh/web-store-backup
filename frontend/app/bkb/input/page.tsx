"use client";

import { useEffect, useState } from "react";
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
    tanggalBKB: "",
    barang: [],
    keterangan: "",
    skema: "", // <-- tambah field skema
  });
  const [userNick, setUserNick] = useState("");
  const [userSchema, setUserSchema] = useState<string>("");
  const [notif, setNotif] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const router = useRouter(); // <-- tambahkan inisialisasi router

  // Tambahkan state untuk data BTB dari backend
  const [backendBTBRows, setBackendBTBRows] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
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

        // Mapping id_skema -> skema
        const skemaMapObj: Record<string, string> = {};
        skemaList.forEach((s: any) => {
          skemaMapObj[String(s.id_skema)] = s.skema;
        });
        setSkemaMap(skemaMapObj);

        // Mapping id_satuan -> satuanLabel
        const satuanMap: Record<string, string> = {};
        satuanList.forEach((s: any) => {
          satuanMap[String(s.id_satuan)] = s.satuan;
        });

        // Gabungkan: untuk setiap btb_item, cari parent btb
        const rows = btbItemList.map((item: any) => {
          const btb = btbList.find((b: any) => b.id_btb === item.id_btb);
          return {
            id: item.id_btb_item,
            noBTB: btb?.no_btb ?? "",
            tanggal: btb?.tanggal_diterima ?? "",
            periode: btb?.periode ?? "",
            id_supplier: btb?.id_supplier ?? "",
            nama_supplier: btb?.nama_supplier ?? "",
            nama_barang: item.nama_barang ?? "",
            jumlah: item.jumlah_diterima ?? "",
            satuan: satuanMap[String(item.id_satuan)] ?? item.satuanLabel ?? "",
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

  // Helper format tanggal
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
    .filter((row) => !userSchema || row.skema === userSchema)
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
    // Gabungkan daftar barang dari semua BTB terpilih, hanya yang sisa > 0
    // dan pastikan setiap barang ada btbId-nya
    const selectedBarangWithBTBId = selectedBTB.flatMap((btb) =>
      btb.items && Array.isArray(btb.items) && btb.items.length > 0
        ? btb.items
            .filter((item: any) => (item.sisa ?? item.jumlah) > 0)
            .map((item: any) => ({
              barang: item.barang,
              jumlah: item.sisa ?? item.jumlah,
              satuan: item.satuan,
              btbId: btb.id, // <-- pastikan btbId selalu diisi
            }))
        : btb.barang && (btb.sisa ?? btb.jumlah) > 0
        ? [
            {
              barang: btb.barang,
              jumlah: btb.sisa ?? btb.jumlah,
              satuan: btb.satuan,
              btbId: btb.id, // <-- pastikan btbId selalu diisi
            },
          ]
        : []
    );
    setShowForm(true);
    setFormData((prev: any) => ({
      ...prev,
      barang: selectedBarangWithBTBId,
      // skema sudah otomatis dari useEffect
    }));
  };

  // Handler submit form BKB
  const handleSubmitBKB = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.noBKB || !formData.tanggalBKB) {
      setNotif({
        type: "error",
        message: "No BKB dan Tanggal BKB wajib diisi.",
      });
      setTimeout(() => setNotif(null), 2500);
      return;
    }
    // Validasi stok cukup
    for (const [idx, b] of formData.barang.entries()) {
      const btb = btbData.find((btb) => btb.id === b.btbId);
      let sisa = 0;
      if (btb?.items && Array.isArray(btb.items) && btb.items.length > 0) {
        const item = btb.items.find(
          (it: any) => it.barang === b.barang && (it.sisa ?? it.jumlah) > 0
        );
        sisa = item ? item.sisa ?? item.jumlah : 0;
      } else if (btb && btb.barang === b.barang) {
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
    // Simpan ke localStorage
    const bkbData = JSON.parse(localStorage.getItem("bkbData") || "[]");
    const barangWithBTBId = formData.barang.map((b: any) => ({
      ...b,
      btbId: b.btbId,
    }));
    // Ambil skema user login dari localStorage
    let userSkema = "";
    const userRaw = localStorage.getItem("userData");
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        userSkema = user.skema || "";
      } catch {}
    }
    const uniqueId =
      "BKB-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
    bkbData.push({
      id: uniqueId,
      noBKB: formData.noBKB,
      tanggalBKB: formData.tanggalBKB,
      barang: barangWithBTBId,
      items: Array.isArray(barangWithBTBId)
        ? barangWithBTBId
        : [barangWithBTBId],
      keterangan: formData.keterangan,
      sumberBTB: selectedBTB.map((b) => b.noBTB),
      createdAt: new Date().toISOString(),
      dibuatOleh: userNick,
      dikeluarkanOleh: userNick,
      skema: userSkema, // <-- sudah pasti terdefinisi
    });
    localStorage.setItem("bkbData", JSON.stringify(bkbData));

    // Kurangi stok di BTB sesuai barang yang diambil
    const newBTBData = btbData.map((btb) => {
      // Jika BTB tidak terlibat, return apa adanya
      if (!selectedBTBIds.includes(btb.id)) return btb;
      // BTB dengan items array
      if (btb.items && Array.isArray(btb.items) && btb.items.length > 0) {
        return {
          ...btb,
          items: btb.items.map((item: any) => {
            const bkbItem = formData.barang.find(
              (b: any) => b.barang === item.barang && b.btbId === btb.id
            );
            if (bkbItem) {
              const sisaLama = item.sisa ?? item.jumlah;
              return {
                ...item,
                sisa: Math.max(0, sisaLama - bkbItem.jumlah),
              };
            }
            return item;
          }),
        };
      }
      // BTB single barang
      if (btb.barang) {
        const bkbItem = formData.barang.find(
          (b: any) => b.barang === btb.barang && b.btbId === btb.id
        );
        if (bkbItem) {
          const sisaLama = btb.sisa ?? btb.jumlah;
          return {
            ...btb,
            sisa: Math.max(0, sisaLama - bkbItem.jumlah),
          };
        }
      }
      return btb;
    });
    localStorage.setItem("btbData", JSON.stringify(newBTBData));

    // Bersihkan state
    setSelectedBTBIds([]);
    setShowForm(false);

    setNotif({ type: "success", message: "BKB berhasil disimpan!" });
    setTimeout(() => {
      setNotif(null);
      router.push("/bkb/monitoring");
    }, 1800);
  };

  // Handler barang di form
  const handleBarangChange = (idx: number, field: string, value: any) => {
    // Batasi value tidak boleh lebih dari sisa
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

  // Helper: get BTB info for a barang row
  function getBTBInfo(btbId: string) {
    const btb = btbData.find((b) => b.id === btbId);
    return btb
      ? {
          noBTB: btb.noBTB,
          tanggal: btb.tanggal,
          supplier: btb.supplier,
        }
      : { noBTB: btbId, tanggal: "", supplier: "" };
  }

  // Helper: get sisa BTB for a barang row
  function getSisaBTB(b: any) {
    // Cari BTB dan item terkait
    const btb = btbData.find((btb) => btb.id === b.btbId);
    if (btb?.items && Array.isArray(btb.items) && btb.items.length > 0) {
      const item = btb.items.find((it: any) => it.barang === b.barang);
      return item ? item.sisa ?? item.jumlah : 0;
    }
    if (btb && btb.barang === b.barang) {
      return btb.sisa ?? btb.jumlah;
    }
    return 0;
  }

  // Jika showForm true, tampilkan form input BKB
  if (showForm) {
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
                    <span className="font-medium">{b.barang}</span> dari{" "}
                    <span className="text-primary font-semibold">
                      {btbInfo.noBTB}
                    </span>
                    {btbInfo.tanggal && (
                      <span className="ml-2 text-muted-foreground">
                        ({btbInfo.tanggal})
                      </span>
                    )}
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
                <Input
                  type="date"
                  value={formData.tanggalBKB}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      tanggalBKB: e.target.value,
                    }))
                  }
                  required
                  className="w-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Label>Skema</Label>
                <Input
                  value={formData.skema}
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
                      <TableHead>Nama Barang</TableHead>
                      <TableHead>Quantity Keluar</TableHead>
                      <TableHead>Sisa BTB</TableHead>
                      <TableHead>Satuan</TableHead>
                      <TableHead>Asal BTB</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.barang.map((b: any, idx: number) => {
                      const sisa = getSisaBTB(b);
                      const btbInfo = getBTBInfo(b.btbId);
                      return (
                        <TableRow key={idx}>
                          <TableCell>{b.barang}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={1}
                                max={sisa}
                                value={b.jumlah}
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
                                / {sisa}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={sisa > 0 ? "default" : "destructive"}
                            >
                              {sisa}
                            </Badge>
                          </TableCell>
                          <TableCell>{b.satuan}</TableCell>
                          <TableCell>
                            <span className="font-medium">{btbInfo.noBTB}</span>
                            {btbInfo.tanggal && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({btbInfo.tanggal})
                              </span>
                            )}
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
                    <TableHead>No. BTB</TableHead>
                    <TableHead>Tanggal BTB</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Nama Supplier</TableHead>
                    <TableHead>Nama Barang</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Satuan</TableHead>
                    <TableHead>Sisa Stok</TableHead>
                    <TableHead>Biaya</TableHead>
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
                        <TableCell>{formatTanggal(row.tanggal)}</TableCell>
                        <TableCell>{row.periode}</TableCell>
                        <TableCell>{row.nama_supplier}</TableCell>
                        <TableCell>{row.nama_barang}</TableCell>
                        <TableCell>{row.jumlah}</TableCell>
                        <TableCell>{row.satuan}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              Number(row.sisa) > 0 ? "default" : "destructive"
                            }
                          >
                            {row.sisa}
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
