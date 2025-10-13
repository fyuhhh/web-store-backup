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
  const filteredBTBData = btbData
    .filter((btb) => !userSchema || btb.skema === userSchema) // <-- filter by schema
    .filter((btb) => {
      const barangList =
        btb.items && Array.isArray(btb.items)
          ? btb.items.map((item: any) => item.barang?.toLowerCase() ?? "")
          : [btb.barang?.toLowerCase() ?? ""];
      const matchesSearch =
        btb.noBTB.toLowerCase().includes(searchTerm.toLowerCase()) ||
        btb.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barangList.some((barang) => barang.includes(searchTerm.toLowerCase()));
      const matchesBarangSearch =
        !barangSearchTerm ||
        barangList.some((barang) =>
          barang.includes(barangSearchTerm.toLowerCase())
        );
      const matchesSupplier =
        filterSupplier.length === 0 || filterSupplier.includes(btb.supplier);
      const matchesKodeSupplier =
        filterKodeSupplier.length === 0 ||
        filterKodeSupplier.includes(btb.kodeSupplier);
      const satuanList =
        btb.items && Array.isArray(btb.items)
          ? btb.items.map((item: any) => item.satuan)
          : [btb.satuan];
      const matchesSatuan =
        filterSatuan.length === 0 ||
        satuanList.some((satuan) => filterSatuan.includes(satuan));
      const matchesTanggalBTB =
        filterTanggalBTB.length === 0 || filterTanggalBTB.includes(btb.tanggal);
      const matchesPeriode =
        !filterPeriode ||
        btb.periode === filterPeriode ||
        btb.periode?.toLowerCase().includes(periodeSearchTerm.toLowerCase());
      const qtyList =
        btb.items && Array.isArray(btb.items)
          ? btb.items.map((item: any) => item.jumlah)
          : [btb.jumlah];
      const matchesQtyMin =
        filterQtyMin === "" ||
        qtyList.some((qty) => Number(qty) >= Number(filterQtyMin));
      const matchesQtyMax =
        filterQtyMax === "" ||
        qtyList.some((qty) => Number(qty) <= Number(filterQtyMax));
      const biayaVal = Number(btb.biaya) || 0;
      const matchesBiayaMin =
        filterBiayaMin === "" || biayaVal >= Number(filterBiayaMin);
      const matchesBiayaMax =
        filterBiayaMax === "" || biayaVal <= Number(filterBiayaMax);

      return (
        matchesSearch &&
        matchesBarangSearch &&
        matchesSupplier &&
        matchesKodeSupplier &&
        matchesSatuan &&
        matchesPeriode &&
        matchesTanggalBTB &&
        matchesQtyMin &&
        matchesQtyMax &&
        matchesBiayaMin &&
        matchesBiayaMax
      );
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

  // Tabel BTB: hanya tampilkan BTB/items dengan stok > 0, dan checkbox hanya aktif jika stok > 0
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
              Total: {filteredBTBData.length} BTB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Checkbox
                        checked={
                          filteredBTBData.length > 0 &&
                          filteredBTBData.every((btb) =>
                            selectedBTBIds.includes(btb.id)
                          )
                        }
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedBTBIds(
                              filteredBTBData
                                .filter((btb) => {
                                  // Cek stok > 0
                                  if (
                                    btb.items &&
                                    Array.isArray(btb.items) &&
                                    btb.items.length > 0
                                  ) {
                                    return btb.items.some(
                                      (item: any) =>
                                        (item.sisa ?? item.jumlah) > 0
                                    );
                                  }
                                  return (btb.sisa ?? btb.jumlah) > 0;
                                })
                                .map((btb) => btb.id)
                            );
                          } else {
                            setSelectedBTBIds([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
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
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
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
                                    id={`tanggal-${t}`}
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
                                  <Label
                                    htmlFor={`tanggal-${t}`}
                                    className="text-sm"
                                  >
                                    {t}
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
                          >
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
                                    id={`periode-${p}`}
                                    checked={filterPeriode === p}
                                    onCheckedChange={(checked) => {
                                      setFilterPeriode(checked ? p : "");
                                    }}
                                  />
                                  <Label
                                    htmlFor={`periode-${p}`}
                                    className="text-sm"
                                  >
                                    {p}
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
                          >
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
                                    id={`supplier-${s}`}
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
                                  <Label
                                    htmlFor={`supplier-${s}`}
                                    className="text-sm"
                                  >
                                    {s}
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
                          >
                            Kode Supplier <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <Input
                            placeholder="Cari kode supplier..."
                            value={kodeSupplierSearchTerm}
                            onChange={(e) =>
                              setKodeSupplierSearchTerm(e.target.value)
                            }
                          />
                          <div className="max-h-40 overflow-y-auto mt-2">
                            {uniqueKodeSupplier
                              .filter((k) =>
                                k
                                  .toLowerCase()
                                  .includes(
                                    kodeSupplierSearchTerm.toLowerCase()
                                  )
                              )
                              .map((k) => (
                                <div
                                  key={k}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`kode-supplier-${k}`}
                                    checked={filterKodeSupplier.includes(k)}
                                    onCheckedChange={(checked) => {
                                      if (checked)
                                        setFilterKodeSupplier([
                                          ...filterKodeSupplier,
                                          k,
                                        ]);
                                      else
                                        setFilterKodeSupplier(
                                          filterKodeSupplier.filter(
                                            (x) => x !== k
                                          )
                                        );
                                    }}
                                  />
                                  <Label
                                    htmlFor={`kode-supplier-${k}`}
                                    className="text-sm"
                                  >
                                    {k}
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
                          >
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
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Quantity <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <div className="space-y-2">
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
                          >
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
                                    id={`satuan-${s}`}
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
                                  <Label
                                    htmlFor={`satuan-${s}`}
                                    className="text-sm"
                                  >
                                    {s}
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead>Sisa Stok</TableHead>
                    <TableHead>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                          >
                            Biaya <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-white">
                          <div className="space-y-2">
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
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBTBData.map((btb) => {
                    const items =
                      btb.items &&
                      Array.isArray(btb.items) &&
                      btb.items.length > 0
                        ? btb.items
                        : btb.barang
                        ? [
                            {
                              barang: btb.barang,
                              jumlah: btb.jumlah,
                              satuan: btb.satuan,
                              sisa: btb.sisa ?? btb.jumlah,
                            },
                          ]
                        : [];
                    // Filter hanya tampilkan item dengan stok > 0
                    const itemsWithStock = items.filter(
                      (item: any) => (item.sisa ?? item.jumlah) > 0
                    );
                    if (itemsWithStock.length === 0) return null;
                    return itemsWithStock.map((item: any, idx: number) => (
                      <TableRow key={btb.id + "-" + idx}>
                        <TableCell>
                          {idx === 0 && (
                            <Checkbox
                              checked={selectedBTBIds.includes(btb.id)}
                              disabled={itemsWithStock.every(
                                (it: any) => (it.sisa ?? it.jumlah) <= 0
                              )}
                              onCheckedChange={(checked) =>
                                handleSelectBTB(btb.id, checked === true)
                              }
                            />
                          )}
                        </TableCell>
                        <TableCell>{idx === 0 ? btb.noBTB : ""}</TableCell>
                        <TableCell>{idx === 0 ? btb.tanggal : ""}</TableCell>
                        <TableCell>{idx === 0 ? btb.periode : ""}</TableCell>
                        <TableCell>{idx === 0 ? btb.supplier : ""}</TableCell>
                        <TableCell>
                          {idx === 0 ? btb.kodeSupplier : ""}
                        </TableCell>
                        <TableCell>{item.barang}</TableCell>
                        <TableCell>{item.jumlah}</TableCell>
                        <TableCell>{item.satuan}</TableCell>
                        <TableCell>
                          <Badge
                            variant={item.sisa > 0 ? "default" : "destructive"}
                          >
                            {item.sisa ?? item.jumlah}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {idx === 0
                            ? "Rp " +
                              (btb.biaya?.toLocaleString?.("id-ID") ??
                                btb.biaya)
                            : ""}
                        </TableCell>
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
