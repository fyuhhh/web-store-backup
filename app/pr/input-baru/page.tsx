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

  // Form state
  const [formData, setFormData] = useState({
    noPR: "",
    tanggalPR: "",
    divisi: "",
    urgensi: "",
    items: [
      { id: "1", namaBarang: "", jumlah: "", satuan: "", keterangan: "" },
    ],
  });

  useEffect(() => {
    initializeDummyData();
    loadPRData();
  }, []);

  const loadPRData = () => {
    const stored = localStorage.getItem("prData");
    if (stored) {
      const parsedData = JSON.parse(stored);
      const validatedData = parsedData.map((pr: any) => ({
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
      alert("Semua field harus diisi");
      return;
    }

    // Validate that all items have required fields
    const validItems = formData.items.filter(
      (item) => item.namaBarang && item.jumlah && item.satuan
    );

    if (validItems.length === 0) {
      alert("Minimal satu item harus diisi dengan lengkap");
      return;
    }

    // Convert jumlah to number
    const itemsWithNumbers = validItems.map((item) => ({
      ...item,
      jumlah: Number.parseInt(item.jumlah),
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
      createdAt: new Date().toISOString(),
    };

    savePRData([...prData, newPR]);
    resetForm();
    alert("PR berhasil dibuat!");
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
    setFormData({
      noPR: "",
      tanggalPR: "",
      divisi: "",
      urgensi: "",
      items: [
        { id: "1", namaBarang: "", jumlah: "", satuan: "", keterangan: "" },
      ],
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
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
                    <SelectContent className="bg-white">
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="Civil">Civil</SelectItem>
                      <SelectItem value="Eng">Engineering</SelectItem>
                      <SelectItem value="FAD">Finance & Admin</SelectItem>
                      <SelectItem value="HRD">Human Resources</SelectItem>
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
                    <SelectContent className="bg-white">
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
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
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg"
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
                        <SelectContent className="bg-white">
                          <SelectItem value="pcs">pcs</SelectItem>
                          <SelectItem value="unit">unit</SelectItem>
                          <SelectItem value="set">set</SelectItem>
                          <SelectItem value="box">box</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="liter">liter</SelectItem>
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
