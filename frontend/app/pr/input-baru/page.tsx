"use client";

import type React from "react";

import { useState, useEffect } from "react";
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
import { type PRData, initializeDummyData } from "@/lib/dummy-data";

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
      { id: "1", namaBarang: "", jumlah: "", satuan: "", keterangan: "" },
    ],
    skema: "", // tambah field skema
  });

  // Tambahkan state untuk data dropdown dari backend
  const [divisiOptions, setDivisiOptions] = useState<any[]>([]);
  const [urgensiOptions, setUrgensiOptions] = useState<any[]>([]);
  const [satuanOptions, setSatuanOptions] = useState<any[]>([]);

  useEffect(() => {
    initializeDummyData();
    loadPRData();
    // Set skema otomatis dari userData
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    setFormData((prev) => ({
      ...prev,
      skema: userData.skema || "",
    }));

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userData = JSON.parse(localStorage.getItem("userData") || "{}");

    // Validate required fields
    if (
      !formData.noPR ||
      !formData.tanggalPR ||
      !formData.divisi ||
      !formData.urgensi
    ) {
      setNotif({ type: "error", message: "Semua field harus diisi" });
      setTimeout(() => setNotif(null), 2500);
      return;
    }

    // Validate that all items have required fields
    const validItems = formData.items.filter(
      (item) => item.namaBarang && item.jumlah && item.satuan
    );

    if (validItems.length === 0) {
      setNotif({
        type: "error",
        message: "Minimal satu item harus diisi dengan lengkap",
      });
      setTimeout(() => setNotif(null), 2500);
      return;
    }

    // Convert jumlah to number
    const itemsWithNumbers = validItems.map((item) => ({
      ...item,
      jumlah: Number.parseInt(item.jumlah),
      originalJumlah: Number.parseInt(item.jumlah),
      quantityAwalPR: Number.parseInt(item.jumlah), // set sekali dari input awal
    }));

    // Create new PR
    const newPR: PRData = {
      id: `PR-${String(prData.length + 1).padStart(3, "0")}`,
      noPR: formData.noPR,
      tanggalPR: formData.tanggalPR,
      items: itemsWithNumbers,
      divisi: formData.divisi as "IT" | "Civil" | "Eng" | "FAD" | "HRD",
      urgensi: formData.urgensi as "Low" | "Medium" | "High",
      status: "Menunggu",
      dibuatOleh: userData.username || "Unknown",
      skema: userData.skema || "", // simpan skema dari user login
      createdAt: new Date().toISOString(),
    };

    // Cek No PR unik
    if (prData.some((pr) => pr.noPR === formData.noPR)) {
      setNotif({
        type: "error",
        message: "No PR sudah pernah digunakan, gunakan nomor lain!",
      });
      setTimeout(() => setNotif(null), 2500);
      return;
    }

    savePRData([...prData, newPR]);
    resetForm();
    setNotif({ type: "success", message: "PR berhasil dibuat!" });
    setTimeout(() => setNotif(null), 2000);
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
          satuan: "",
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
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    setFormData({
      noPR: "",
      tanggalPR: "",
      divisi: "",
      urgensi: "",
      items: [
        { id: "1", namaBarang: "", jumlah: "", satuan: "", keterangan: "" },
      ],
      skema: userData.skema || "", // reset skema otomatis
    });
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
                    <SelectContent className="bg-white max-h-64 overflow-y-auto">
                      {divisiOptions.length === 0 ? (
                        <SelectItem value="__loading" disabled>
                          Memuat...
                        </SelectItem>
                      ) : (
                        divisiOptions.map((div: any) => (
                          <SelectItem key={div.id_divisi} value={div.divisi}>
                            {div.divisi}
                          </SelectItem>
                        ))
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
                          <SelectItem key={urg.id_urgensi} value={urg.urgensi}>
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
                        value={item.satuan}
                        onValueChange={(value) =>
                          updateItem(item.id, "satuan", value)
                        }
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Pilih satuan" />
                        </SelectTrigger>
                        <SelectContent className="bg-white max-h-64 overflow-y-auto">
                          {satuanOptions.length === 0 ? (
                            <SelectItem value="__loading" disabled>
                              Memuat...
                            </SelectItem>
                          ) : (
                            satuanOptions.map((sat: any) => (
                              <SelectItem key={sat.id_satuan} value={sat.satuan}>
                                {sat.satuan}
                              </SelectItem>
                            ))
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
                <Label htmlFor="skema">Skema</Label>
                <Input
                  id="skema"
                  value={formData.skema}
                  readOnly
                  disabled
                  className="bg-gray-100"
                />
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
