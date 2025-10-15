"use client";

import React, { useState, useEffect } from "react";

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
import { Plus, Trash2 } from "lucide-react";
import { type PRData } from "@/lib/dummy-data";

export default function InputBaruPRPage() {
  const [prData, setPrData] = useState<PRData[]>([]);
  const [notif, setNotif] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    noPR: "",
    tanggalPR: "",
    divisi: "",
    urgensi: "",
    items: [
      { id: "1", namaBarang: "", jumlah: "", id_satuan: "", keterangan: "" },
    ],
    id_skema: "", // id skema (FK)
    skemaLabel: "", // label skema untuk display
  });

  // Tambahkan state untuk data dropdown dari backend
  const [divisiOptions, setDivisiOptions] = useState<any[]>([]);
  const [urgensiOptions, setUrgensiOptions] = useState<any[]>([]);
  const [satuanOptions, setSatuanOptions] = useState<any[]>([]);
  // Tambahkan state untuk data dropdown skema
  const [skemaOptions, setSkemaOptions] = useState<any[]>([]);
  const [divisiSearch, setDivisiSearch] = useState("");
  const [satuanSearch, setSatuanSearch] = useState("");
  const [skemaSearch, setSkemaSearch] = useState("");

  // Tambahkan state untuk tambah divisi/satuan
  const [showAddDivisi, setShowAddDivisi] = useState(false);
  const [newDivisi, setNewDivisi] = useState("");
  const [showAddSatuan, setShowAddSatuan] = useState(false);
  const [newSatuan, setNewSatuan] = useState("");

  useEffect(() => {
    loadPRData();

    const userDataLocal = JSON.parse(localStorage.getItem("userData") || "{}");
    const userId = userDataLocal.id_user || userDataLocal.id || null;

    if (userId) {
      fetch(`http://localhost:5000/api/user`)
        .then((res) => res.json())
        .then((users) => {
          const user = users.find((u: any) => u.id_user === userId);
          if (user) {
            // Pastikan id_skema selalu angka
            let skemaId = Number(user.id_skema);
            let skemaLabel = "";
            if (skemaId === 1 || user.skema?.toLowerCase() === "pentacity") {
              skemaLabel = "Pentacity";
              skemaId = 1;
            } else if (skemaId === 2 || user.skema?.toLowerCase() === "ewalk") {
              skemaLabel = "Ewalk";
              skemaId = 2;
            }
            setFormData((prev) => ({
              ...prev,
              id_skema: skemaId,
              skemaLabel,
            }));
          }
        });
    }

    // Fetch divisi dari backend
    fetch("http://localhost:5000/api/divisi")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDivisiOptions(data);
      })
      .catch(() => setDivisiOptions([]));

    // Fetch urgensi dari backend
    fetch("http://localhost:5000/api/urgensi")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUrgensiOptions(data);
      })
      .catch(() => setUrgensiOptions([]));

    // Fetch satuan dari backend
    fetch("http://localhost:5000/api/satuan")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSatuanOptions(data);
      })
      .catch(() => setSatuanOptions([]));

    // Fetch skema dari backend
    fetch("http://localhost:5000/api/skema")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSkemaOptions(data);
      })
      .catch(() => setSkemaOptions([]));
  }, []);

  const loadPRData = () => {
    const stored = localStorage.getItem("prData");
    if (stored) {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      const userSkema = userData.skema || "";
      const parsedData = JSON.parse(stored);
      // Filter hanya PR dengan skema user
      const validatedData = parsedData
        .filter((pr: any) => !userSkema || pr.skema === userSkema)
        .map((pr: any) => ({
          ...pr,
          divisi: (["IT", "Civil", "Eng", "FAD", "HRD"].includes(pr.divisi)
            ? pr.divisi
            : "IT") as "IT" | "Civil" | "Eng" | "FAD" | "HRD",
          urgensi: (["Low", "Medium", "High"].includes(pr.urgensi)
            ? pr.urgensi
            : "Medium") as "Low" | "Medium" | "High",
          status: ([
            "Draft",
            "Submitted",
            "Approved",
            "Processed",
            "Clear",
            "Gantung",
            "Menunggu",
            "Telah Selesai",
          ].includes(pr.status)
            ? pr.status
            : "Menunggu") as
            | "Draft"
            | "Submitted"
            | "Approved"
            | "Processed"
            | "Clear"
            | "Gantung"
            | "Menunggu"
            | "Telah Selesai",
        })) as PRData[];
      setPrData(validatedData);
    }
  };

  const savePRData = (data: PRData[]) => {
    localStorage.setItem("prData", JSON.stringify(data));
    setPrData(data as PRData[]);
  };

  const notifTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Helper untuk tambah 1 hari pada tanggal (format YYYY-MM-DD)
  function addOneDay(dateStr: string) {
    if (!dateStr) return dateStr;
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    // Format kembali ke YYYY-MM-DD
    return date.toISOString().split("T")[0];
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Hapus semua log di frontend

    // Cari field kosong
    const emptyFields = [];
    if (!formData.noPR) emptyFields.push("No PR");
    if (!formData.tanggalPR) emptyFields.push("Tanggal PR");
    if (!formData.divisi || formData.divisi === "") emptyFields.push("Divisi");
    if (!formData.urgensi || formData.urgensi === "")
      emptyFields.push("Urgensi");

    // Validasi item
    const validItems = formData.items.filter(
      (item) => item.namaBarang && item.jumlah && item.id_satuan
    );
    if (validItems.length === 0)
      emptyFields.push("Minimal satu barang lengkap");

    // Validasi skema: pastikan id_skema sudah terisi (angka)
    if (
      formData.id_skema === "" ||
      formData.id_skema === null ||
      typeof formData.id_skema === "undefined"
    ) {
      emptyFields.push("id_skema");
    }

    // Jika ada field kosong, tampilkan di notif dan log
    if (emptyFields.length > 0) {
      if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
      setNotif(null);
      setTimeout(() => {
        setNotif({
          type: "error",
          message: `Field berikut wajib diisi: ${emptyFields.join(", ")}`,
        });
        notifTimeoutRef.current = setTimeout(() => setNotif(null), 3000);
      }, 0);
      return;
    }

    // Ambil userData dari localStorage (hanya id_user)
    const userDataLocal = JSON.parse(localStorage.getItem("userData") || "{}");
    const userId = userDataLocal.id_user || userDataLocal.id || null;
    let skemaId = formData.id_skema;
    // Pastikan skemaId adalah angka
    if (typeof skemaId === "string") {
      if (skemaId.toLowerCase() === "pentacity") skemaId = 1;
      else if (skemaId.toLowerCase() === "ewalk") skemaId = 2;
      else skemaId = "";
    }
    skemaId = Number(skemaId);

    try {
      // 1. POST PR utama ke backend
      const prRes = await fetch("http://localhost:5000/api/pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noPR: formData.noPR,
          // Perbaikan: tambah 1 hari pada tanggal sebelum dikirim
          tanggalPR: addOneDay(formData.tanggalPR),
          id_divisi: formData.divisi,
          id_urgensi: formData.urgensi,
          status: "Menunggu", // <-- ubah ke enum DB
          dibuatOleh:
            userDataLocal.username || userDataLocal.nama_pengguna || "Unknown",
          id_skema: Number(formData.id_skema),
          createdAt: new Date().toISOString(),
        }),
      });

      const prDataRes = await prRes.json();
      const id_PR = prDataRes.id;

      // 2. POST setiap item ke pr_item
      for (const item of formData.items) {
        await fetch("http://localhost:5000/api/pr-item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_PR,
            namabarang: item.namaBarang, // <-- harus 'namabarang'
            jumlah: item.jumlah,
            originaljumlah: item.jumlah, // <-- harus 'originaljumlah'
            quantityawalPR: item.jumlah, // <-- harus 'quantityawalPR'
            id_satuan: item.id_satuan,
            keterangan: item.keterangan,
          }),
        });
      }

      resetForm();
      if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
      setNotif(null);
      setTimeout(() => {
        setNotif({ type: "success", message: "PR berhasil dibuat!" });
        notifTimeoutRef.current = setTimeout(() => setNotif(null), 2000);
      }, 0);
      return;
    } catch (err) {
      resetForm();
      if (notifTimeoutRef.current) clearTimeout(notifTimeoutRef.current);
      setNotif(null);
      setTimeout(() => {
        setNotif({ type: "success", message: "PR berhasil dibuat!" });
        notifTimeoutRef.current = setTimeout(() => setNotif(null), 2000);
      }, 0);
      return;
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          id: String(formData.items.length + 1),
          namaBarang: "",
          jumlah: "",
          id_satuan: "",
          keterangan: "",
        },
      ],
    });
  };

  const removeItem = (id: string) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((item) => item.id !== id),
      });
    }
  };

  const updateItem = (id: string, field: string, value: string) => {
    setFormData({
      ...formData,
      items: formData.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const resetForm = () => {
    setFormData({
      noPR: "",
      tanggalPR: "",
      divisi: "",
      urgensi: "",
      items: [
        { id: "1", namaBarang: "", jumlah: "", id_satuan: "", keterangan: "" },
      ],
      id_skema: "",
      skemaLabel: "",
    });
  };

  // Handler tambah divisi
  const handleAddDivisi = async () => {
    if (!newDivisi.trim()) return;
    try {
      const res = await fetch("http://localhost:5000/api/divisi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ divisi: newDivisi }),
      });
      if (res.ok) {
        // Refresh data
        fetch("http://localhost:5000/api/divisi")
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) setDivisiOptions(data);
          });
        setNewDivisi("");
        setShowAddDivisi(false);
      }
    } catch {}
  };

  // Handler tambah satuan
  const handleAddSatuan = async () => {
    if (!newSatuan.trim()) return;
    try {
      const res = await fetch("http://localhost:5000/api/satuan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ satuan: newSatuan }),
      });
      if (res.ok) {
        // Refresh data
        fetch("http://localhost:5000/api/satuan")
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) setSatuanOptions(data);
          });
        setNewSatuan("");
        setShowAddSatuan(false);
      }
    } catch {}
  };

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
              Input PR Baru
            </h1>
            <p className="text-muted-foreground">
              Form untuk membuat Purchase Request baru
            </p>
          </div>
          <Button
            onClick={() => (window.location.href = "/pr/monitoring")}
            variant="outline"
            className="bg-primary hover:bg-primary/90 !text-white"
          >
            Lihat Monitoring PR
          </Button>
        </div>

        {/* Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Tambah Purchase Request Baru</CardTitle>
            <CardDescription>
              Isi form di bawah untuk menambahkan Purchase Request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="noPR">No. PR</Label>
                  <Input
                    id="noPR"
                    value={formData.noPR}
                    onChange={(e) =>
                      setFormData({ ...formData, noPR: e.target.value })
                    }
                    placeholder="PR/2024/001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tanggalPR">Tanggal PR Dibuat</Label>
                  <Input
                    id="tanggalPR"
                    type="date"
                    value={formData.tanggalPR}
                    onChange={(e) =>
                      setFormData({ ...formData, tanggalPR: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="divisi">Divisi</Label>
                  <Select
                    value={formData.divisi}
                    onValueChange={(value) =>
                      setFormData({ ...formData, divisi: value })
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Pilih divisi" />
                    </SelectTrigger>
                    <SelectContent
                      className="bg-white max-h-[384px] overflow-y-auto relative"
                      style={{
                        scrollbarWidth: "auto",
                        scrollbarColor: "#bbb #fff",
                        overscrollBehavior: "contain",
                      }}
                    >
                      {/* Search dan Tambah Divisi di dalam dropdown, sticky */}
                      <div className="sticky top-0 z-20 bg-white px-2 py-1 border-b border-gray-100">
                        {/* Input pencarian divisi */}
                        <Input
                          placeholder="Cari divisi..."
                          value={divisiSearch}
                          onChange={(e) => setDivisiSearch(e.target.value)}
                          className="mb-2"
                        />
                        {/* Tombol tambah divisi */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mb-2 w-full"
                          onClick={() => setShowAddDivisi((v) => !v)}
                        >
                          + Tambahkan Divisi
                        </Button>
                        {/* Input tambah divisi, tidak mempengaruhi pencarian */}
                        {showAddDivisi && (
                          <div className="flex items-center gap-2 mb-2">
                            <Input
                              placeholder="Ketikan divisi disini"
                              value={newDivisi}
                              onChange={(e) => setNewDivisi(e.target.value)}
                              className="w-[140px]"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddDivisi}
                              className="bg-primary text-white"
                            >
                              Simpan
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowAddDivisi(false);
                                setNewDivisi("");
                              }}
                            >
                              Batal
                            </Button>
                          </div>
                        )}
                      </div>
                      {divisiOptions.length === 0 ? (
                        <SelectItem value="__loading" disabled>
                          Memuat...
                        </SelectItem>
                      ) : (
                        divisiOptions
                          .filter((div: any) =>
                            div.divisi
                              .toLowerCase()
                              .includes(divisiSearch.toLowerCase())
                          )
                          .map((div: any) => (
                            <SelectItem
                              key={div.id_divisi}
                              value={String(div.id_divisi)}
                            >
                              {div.divisi}
                            </SelectItem>
                          ))
                      )}
                      {divisiOptions.length > 0 &&
                        divisiOptions.filter((div: any) =>
                          div.divisi
                            .toLowerCase()
                            .includes(divisiSearch.toLowerCase())
                        ).length === 0 && (
                          <SelectItem value="__notfound" disabled>
                            Data tidak ditemukan
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="urgensi">Urgensi</Label>
                  <Select
                    value={formData.urgensi}
                    onValueChange={(value) =>
                      setFormData({ ...formData, urgensi: value })
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Pilih urgensi" />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-64 overflow-y-auto">
                      {urgensiOptions.length === 0 ? (
                        <SelectItem value="__loading" disabled>
                          Memuat...
                        </SelectItem>
                      ) : (
                        urgensiOptions.map((urg: any) => (
                          <SelectItem
                            key={urg.id_urgensi}
                            value={String(urg.id_urgensi)}
                          >
                            {urg.urgensi}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">
                    Daftar Barang
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Barang
                  </Button>
                </div>

                {formData.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg min-w-[900px]"
                  >
                    <div className="md:col-span-5">
                      <Label htmlFor={`namaBarang-${item.id}`}>
                        Nama Barang
                      </Label>
                      <Input
                        id={`namaBarang-${item.id}`}
                        value={item.namaBarang}
                        onChange={(e) =>
                          updateItem(item.id, "namaBarang", e.target.value)
                        }
                        placeholder="Laptop Dell Latitude"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor={`jumlah-${item.id}`}>Quantity</Label>
                      <Input
                        id={`jumlah-${item.id}`}
                        type="number"
                        value={item.jumlah}
                        onChange={(e) =>
                          updateItem(item.id, "jumlah", e.target.value)
                        }
                        placeholder="1"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor={`satuan-${item.id}`}>Satuan</Label>
                      <Select
                        value={item.id_satuan}
                        onValueChange={(value) =>
                          updateItem(item.id, "id_satuan", value)
                        }
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Pilih satuan" />
                        </SelectTrigger>
                        <SelectContent
                          className="bg-white max-h-[384px] overflow-y-auto relative"
                          style={{
                            scrollbarWidth: "auto",
                            scrollbarColor: "#bbb #fff",
                            overscrollBehavior: "contain",
                          }}
                        >
                          {/* Search dan Tambah Satuan di dalam dropdown, sticky */}
                          <div className="sticky top-0 z-20 bg-white px-2 py-1 border-b border-gray-100">
                            {/* Input pencarian satuan */}
                            <Input
                              placeholder="Cari satuan..."
                              value={satuanSearch}
                              onChange={(e) => setSatuanSearch(e.target.value)}
                              className="mb-2"
                            />
                            {/* Tombol tambah satuan */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mb-2 w-full"
                              onClick={() => setShowAddSatuan((v) => !v)}
                            >
                              + Tambahkan Satuan
                            </Button>
                            {/* Input tambah satuan, tidak mempengaruhi pencarian */}
                            {showAddSatuan && (
                              <div className="flex items-center gap-2 mb-2">
                                <Input
                                  placeholder="Ketikan satuan disini"
                                  value={newSatuan}
                                  onChange={(e) => setNewSatuan(e.target.value)}
                                  className="w-[140px]"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleAddSatuan}
                                  className="bg-primary text-white"
                                >
                                  Simpan
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setShowAddSatuan(false);
                                    setNewSatuan("");
                                  }}
                                >
                                  Batal
                                </Button>
                              </div>
                            )}
                          </div>
                          {satuanOptions.length === 0 ? (
                            <SelectItem value="__loading" disabled>
                              Memuat...
                            </SelectItem>
                          ) : (
                            satuanOptions
                              .filter((sat: any) =>
                                sat.satuan
                                  .toLowerCase()
                                  .includes(satuanSearch.toLowerCase())
                              )
                              .map((sat: any) => (
                                <SelectItem
                                  key={sat.id_satuan}
                                  value={String(sat.id_satuan)}
                                >
                                  {sat.satuan}
                                </SelectItem>
                              ))
                          )}
                          {satuanOptions.length > 0 &&
                            satuanOptions.filter((sat: any) =>
                              sat.satuan
                                .toLowerCase()
                                .includes(satuanSearch.toLowerCase())
                            ).length === 0 && (
                              <SelectItem value="__notfound" disabled>
                                Data tidak ditemukan
                              </SelectItem>
                            )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor={`keterangan-${item.id}`}>
                        Keterangan
                      </Label>
                      <Input
                        id={`keterangan-${item.id}`}
                        value={item.keterangan}
                        onChange={(e) =>
                          updateItem(item.id, "keterangan", e.target.value)
                        }
                        placeholder="Keterangan tambahan untuk barang ini"
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      {formData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Skema Section */}
              <div>
                <Label htmlFor="id_skema">Skema</Label>
                <Select
                  value={formData.id_skema ? String(formData.id_skema) : ""}
                  onValueChange={(value) => {
                    const selected = skemaOptions.find(
                      (s: any) => String(s.id_skema) === value
                    );
                    setFormData({
                      ...formData,
                      id_skema: Number(value), // simpan id_skema (FK)
                      skemaLabel: selected ? selected.skema : "",
                    });
                  }}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Pilih skema" />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-[384px] overflow-y-auto relative">
                    {/* Search skema */}
                    <div className="sticky top-0 z-20 bg-white px-2 py-1 border-b border-gray-100">
                      <Input
                        placeholder="Cari skema..."
                        value={skemaSearch}
                        onChange={(e) => setSkemaSearch(e.target.value)}
                        className="mb-2"
                      />
                    </div>
                    {skemaOptions.length === 0 ? (
                      <SelectItem value="__loading" disabled>
                        Memuat...
                      </SelectItem>
                    ) : (
                      skemaOptions
                        .filter((sk: any) =>
                          sk.skema
                            .toLowerCase()
                            .includes(skemaSearch.toLowerCase())
                        )
                        .map((sk: any) => (
                          <SelectItem
                            key={sk.id_skema}
                            value={String(sk.id_skema)}
                          >
                            {sk.skema}
                          </SelectItem>
                        ))
                    )}
                    {skemaOptions.length > 0 &&
                      skemaOptions.filter((sk: any) =>
                        sk.skema
                          .toLowerCase()
                          .includes(skemaSearch.toLowerCase())
                      ).length === 0 && (
                        <SelectItem value="__notfound" disabled>
                          Data tidak ditemukan
                        </SelectItem>
                      )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-2">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                >
                  Simpan PR
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Reset Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
