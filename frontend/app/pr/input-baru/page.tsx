"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// Tambahkan CSS custom untuk tanggal merah
import "./datepicker-red-weekend.css";

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
import { useSearchParams } from "next/navigation";

export default function InputBaruPRPage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const [prData, setPrData] = useState<PRData[]>([]);
  const [notif, setNotif] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    noPR: "",
    tanggalPR: null as Date | null, // ubah ke Date | null
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
  const [originalItems, setOriginalItems] = useState<any[]>([]);

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
      fetch(`http://192.168.10.10:5000/api/user`)
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
              id_skema: String(skemaId),
              skemaLabel,
            }));
          }
        });
    }

    // Fetch divisi dari backend
    fetch("http://192.168.10.10:5000/api/divisi")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDivisiOptions(data);
      })
      .catch(() => setDivisiOptions([]));

    // Fetch urgensi dari backend
    fetch("http://192.168.10.10:5000/api/urgensi")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUrgensiOptions(data);
      })
      .catch(() => setUrgensiOptions([]));

    // Fetch satuan dari backend
    fetch("http://192.168.10.10:5000/api/satuan")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSatuanOptions(data);
      })
      .catch(() => setSatuanOptions([]));

    // Fetch skema dari backend
    fetch("http://192.168.10.10:5000/api/skema")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSkemaOptions(data);
      })
      .catch(() => setSkemaOptions([]));
  }, []);

  // Fetch Data for Edit Mode
  useEffect(() => {
    if (!editId) return;

    const fetchData = async () => {
      try {
        // Fetch PR Header
        const prRes = await fetch(`http://192.168.10.10:5000/api/pr/${editId}`);
        if (!prRes.ok) throw new Error("Gagal mengambil data PR");
        const prData = await prRes.json();

        // Fetch PR Items
        const itemsRes = await fetch(`http://192.168.10.10:5000/api/pr-item/pr/${editId}`);
        if (!itemsRes.ok) throw new Error("Gagal mengambil data Items");
        const itemsData = await itemsRes.json();

        // Populate Form
        setFormData({
          noPR: prData.noPR,
          tanggalPR: prData.tanggalPR ? new Date(prData.tanggalPR) : null,
          divisi: String(prData.id_divisi || ""),
          urgensi: String(prData.id_urgensi || ""),
          id_skema: String(prData.id_skema || ""),
          skemaLabel: "", // Will be set by effect or kept empty if not needed
          items: itemsData.map((item: any) => ({
            id: String(item.id_PRItem),
            namaBarang: item.namaBarang,
            jumlah: String(parseFloat(item.jumlah)), // Format: 15.00 -> 15
            id_satuan: String(item.id_satuan),
            keterangan: item.keterangan || "",
            originalId: String(item.id_PRItem) // Track original ID
          })),
        });

        // Populate Skema Label if possible (User effect handles it, but just in case)
        // Also keep track of original items for diffing
        setOriginalItems(itemsData.map((item: any) => ({
          id: String(item.id_PRItem),
          ...item
        })));

      } catch (err: any) {
        setNotif({ type: "error", message: err.message });
      }
    };

    fetchData();
  }, [editId]);



  // Tambahkan useEffect untuk set skema dari userData saat komponen pertama kali mount (HANYA JIKA BUKAN EDIT)
  useEffect(() => {
    // if (editId) return; // Skip if editing
    const userDataString = localStorage.getItem("userData");

    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        // Misal field skema: userData.skema atau userData.id_skema
        const skemaValue = userData.id_skema || userData.skema || "";
        // Set state skema di form PR (misal: setPrFormData)
        setFormData((prev) => ({
          ...prev,
          id_skema: skemaValue,
        }));
      } catch (err) {
        // ignore
      }
    }
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

  // Helper untuk format tanggal ke DD-MM-YYYY
  function formatDate(date: Date | null) {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // Helper untuk format tanggal ke YYYY-MM-DD untuk backend
  function formatDateForBackend(date: Date | null) {
    if (!date) return "";
    // Ambil tanggal persis dari input user, tanpa modifikasi
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const resetForm = () => {
    setFormData({
      noPR: "",
      tanggalPR: null, // reset ke null
      divisi: "",
      urgensi: "",
      items: [
        { id: "1", namaBarang: "", jumlah: "", id_satuan: "", keterangan: "" },
      ],
      id_skema: "",
      skemaLabel: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emptyFields = [];
    if (!formData.noPR) emptyFields.push("No PR");
    if (!formData.tanggalPR) emptyFields.push("Tanggal PR");
    if (!formData.divisi || formData.divisi === "") emptyFields.push("Divisi");
    if (!formData.urgensi || formData.urgensi === "") emptyFields.push("Urgensi");

    const validItems = formData.items.filter(
      (item) => item.namaBarang && item.jumlah && item.id_satuan
    );
    if (validItems.length === 0) emptyFields.push("Minimal satu barang lengkap");

    if (
      formData.id_skema === "" ||
      formData.id_skema === null ||
      typeof formData.id_skema === "undefined"
    ) {
      emptyFields.push("id_skema");
    }

    if (emptyFields.length > 0) {
      setNotif({ type: "error", message: `Field berikut wajib diisi: ${emptyFields.join(", ")}` });
      return;
    }

    const userDataLocal = JSON.parse(localStorage.getItem("userData") || "{}");

    // Helper determine Plan
    const determinePlan = (date: Date | null): string => {
      if (!date) return "No Plan";
      const day = date.getDate();
      // Logic:
      // 6 - 24 -> No Plan
      // 25 - 5 (25..31 & 1..5) -> Plan
      if (day >= 6 && day <= 24) {
        return "No Plan";
      }
      return "Plan";
    };

    const planValue = determinePlan(formData.tanggalPR);
    console.log(`Input PR Date: ${formData.tanggalPR}, Plan Result: ${planValue}`);

    try {
      if (editId) {
        // === UPDATE MODE ===

        // 1. Update PR Header
        const prRes = await fetch(`http://192.168.10.10:5000/api/pr/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            noPR: formData.noPR,
            tanggalPR: formatDateForBackend(formData.tanggalPR),
            id_divisi: formData.divisi,
            id_urgensi: formData.urgensi,
            id_skema: Number(formData.id_skema),
            status: "Menunggu",
            dibuatOleh: userDataLocal.username || userDataLocal.nama_pengguna || "Unknown",
            plan: planValue, // Send explicit plan
          }),
        });
        if (!prRes.ok) throw new Error("Gagal mengupdate PR");

        // 2. Handle Items (Diffing)
        const currentItemIds = new Set(formData.items.map(i => i.id).filter(id => !id.startsWith("new-")));

        // A. Delete removed items
        for (const orgItem of originalItems) {
          if (!currentItemIds.has(String(orgItem.id_PRItem))) {
            await fetch(`http://192.168.10.10:5000/api/pr-item/${orgItem.id_PRItem}`, { method: "DELETE" });
          }
        }

        // B. Update or Create items
        for (const item of formData.items) {
          const jumlah = parseFloat(item.jumlah);
          const payload = {
            id_PR: editId,
            namaBarang: item.namaBarang,
            jumlah: jumlah,
            originalJumlah: jumlah,
            quantityAwalPR: jumlah,
            id_satuan: Number(item.id_satuan),
            keterangan: item.keterangan || "",
          };

          if (item.id.startsWith("new-")) {
            // CREATE
            await fetch("http://192.168.10.10:5000/api/pr-item", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
          } else {
            // UPDATE
            await fetch(`http://192.168.10.10:5000/api/pr-item/${item.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
          }
        }

        setNotif({ type: "success", message: "PR berhasil diupdate!" });
        setTimeout(() => {
          window.location.href = "/pr/monitoring";
        }, 1500);

      } else {
        // === CREATE MODE ===
        const prRes = await fetch("http://192.168.10.10:5000/api/pr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            noPR: formData.noPR,
            tanggalPR: formatDateForBackend(formData.tanggalPR),
            id_divisi: formData.divisi,
            id_urgensi: formData.urgensi,
            status: "Menunggu",
            dibuatOleh: userDataLocal.username || userDataLocal.nama_pengguna || "Unknown",
            id_skema: Number(formData.id_skema),
            createdAt: new Date().toISOString(),
            plan: planValue, // Send explicit plan
          }),
        });

        const prDataRes = await prRes.json();
        const id_PR = prDataRes.id_PR;

        for (const item of formData.items) {
          const jumlah = parseFloat(item.jumlah);
          await fetch("http://192.168.10.10:5000/api/pr-item", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_PR,
              namaBarang: item.namaBarang,
              jumlah: jumlah,
              originalJumlah: jumlah,
              quantityAwalPR: jumlah,
              id_satuan: Number(item.id_satuan),
              keterangan: item.keterangan || "",
            }),
          });
        }

        resetForm();
        setNotif({ type: "success", message: "PR berhasil dibuat!" });
        setTimeout(() => {
          setNotif(null);
          window.location.reload();
        }, 1500);
      } // end if-else editId

    } catch (err: any) {
      console.error("Error submitting PR:", err);
      // Jangan reset form kalau error, biar user bisa benerin
      setNotif({ type: "error", message: err.message || "Gagal menyimpan PR" });
      setTimeout(() => {
        setNotif(null);
      }, 5000);
    }
  };

  // Gunakan functional update untuk menghindari stale state
  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `new-${Date.now()}`, // Gunakan unique ID based on timestamp
          namaBarang: "",
          jumlah: "",
          id_satuan: "",
          keterangan: "",
        },
      ],
    }));
  };

  const removeItem = (id: string) => {
    setFormData((prev) => {
      if (prev.items.length <= 1) return prev;
      return {
        ...prev,
        items: prev.items.filter((item) => item.id !== id),
      };
    });
  };

  const updateItem = (id: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };



  // Handler tambah divisi
  const handleAddDivisi = async () => {
    if (!newDivisi.trim()) return;
    try {
      const res = await fetch("http://192.168.10.10:5000/api/divisi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ divisi: newDivisi }),
      });
      if (res.ok) {
        // Refresh data
        fetch("http://192.168.10.10:5000/api/divisi")
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) setDivisiOptions(data);
          });
        setNewDivisi("");
        setShowAddDivisi(false);
      }
    } catch { }
  };

  // Handler tambah satuan
  const handleAddSatuan = async () => {
    if (!newSatuan.trim()) return;
    try {
      const res = await fetch("http://192.168.10.10:5000/api/satuan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ satuan: newSatuan }),
      });
      if (res.ok) {
        // Refresh data
        fetch("http://192.168.10.10:5000/api/satuan")
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) setSatuanOptions(data);
          });
        setNewSatuan("");
        setShowAddSatuan(false);
      }
    } catch { }
  };

  // Handler hapus satuan
  const handleDeleteSatuan = async (id: string) => {
    if (!id) return;
    if (!window.confirm("Yakin ingin menghapus satuan ini?")) return;
    try {
      const res = await fetch(`http://192.168.10.10:5000/api/satuan/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetch("http://192.168.10.10:5000/api/satuan")
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) setSatuanOptions(data);
          });
      }
    } catch { }
  };



  // Handler hapus divisi
  const handleDeleteDivisi = async (id: string) => {
    if (!id) return;
    if (!window.confirm("Yakin ingin menghapus divisi ini?")) return;
    try {
      const res = await fetch(`http://192.168.10.10:5000/api/divisi/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetch("http://192.168.10.10:5000/api/divisi")
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) setDivisiOptions(data);
          });
      }
    } catch { }
  };



  // Fungsi untuk memberi class pada weekend
  function highlightWeekends(date: Date) {
    const day = date.getDay();
    // 0 = Minggu, 6 = Sabtu
    if (day === 0 || day === 6) return "datepicker-red";
    return "";
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

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {editId ? "Edit Purchase Request" : "Input PR Baru"}
            </h1>
            <p className="text-muted-foreground">
              {editId ? "Ubah data Purchase Request" : "Form untuk membuat Purchase Request baru"}
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
            <CardTitle>{editId ? "Edit PR" : "Tambah Purchase Request Baru"}</CardTitle>
            <CardDescription>
              Isi form di bawah untuk menambahkan Purchase Request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Bagian atas: No PR, Tanggal, Divisi, Urgensi dalam 1 baris */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="noPR">No. PR</Label>
                  <Input
                    id="noPR"
                    value={formData.noPR}
                    onChange={(e) =>
                      setFormData({ ...formData, noPR: e.target.value })
                    }
                    placeholder="PR/E-WALK/25/XII/001"
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="tanggalPR">Tanggal PR Dibuat</Label>
                  <DatePicker
                    id="tanggalPR"
                    selected={formData.tanggalPR}
                    onChange={(date) =>
                      setFormData({ ...formData, tanggalPR: date })
                    }
                    dateFormat="dd-MM-yyyy"
                    placeholderText="Pilih tanggal"
                    className="w-full px-3 py-2 border rounded-md bg-white"
                    popperPlacement="bottom"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    dayClassName={highlightWeekends}
                    customInput={
                      <Input
                        value={
                          formData.tanggalPR
                            ? formatDate(formData.tanggalPR)
                            : ""
                        }
                        readOnly
                        className="w-full px-3 py-2 border rounded-md bg-white"
                      />
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="divisi">Divisi</Label>
                  <Select
                    value={formData.divisi}
                    onValueChange={(value) =>
                      setFormData({ ...formData, divisi: value })
                    }
                  >
                    <SelectTrigger className="bg-white w-full">
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
                      <div className="sticky top-0 z-20 bg-white px-2 py-1 border-b border-gray-100">
                        {showAddDivisi ? (
                          <div className="flex items-center gap-2 mb-2">
                            <Input
                              placeholder="Ketikan divisi disini"
                              value={newDivisi}
                              onChange={(e) => setNewDivisi(e.target.value)}
                              className="w-[140px]"
                              autoFocus
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={async () => {
                                await handleAddDivisi();
                                setShowAddDivisi(false);
                                setNewDivisi("");
                              }}
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
                        ) : (
                          <>
                            <Input
                              placeholder="Cari divisi..."
                              value={divisiSearch}
                              onChange={(e) => setDivisiSearch(e.target.value)}
                              className="mb-2"
                              disabled={showAddDivisi}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mb-2 w-full"
                              onClick={() => {
                                setShowAddDivisi(true);
                                setDivisiSearch("");
                              }}
                              disabled={showAddDivisi}
                            >
                              + Tambahkan Divisi
                            </Button>
                          </>
                        )}
                      </div>
                      {/* Saat tambah divisi aktif, SEMUA pilihan divisi di bawah ini di-nonaktifkan */}
                      {showAddDivisi
                        ? null
                        : (
                          <>
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
                                  <div
                                    key={div.id_divisi}
                                    className="flex items-center gap-2 px-2 py-1 group hover:bg-gray-50"
                                  >
                                    <SelectItem
                                      value={String(div.id_divisi)}
                                      className="flex-1"
                                      disabled={showAddDivisi}
                                    >
                                      {div.divisi}
                                    </SelectItem>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      className="text-xs text-red-600 px-1 py-0.5"
                                      onClick={() =>
                                        handleDeleteDivisi(String(div.id_divisi))
                                      }
                                      disabled={showAddDivisi}
                                    >
                                      Hapus
                                    </Button>
                                  </div>
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
                          </>
                        )
                      }
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
                    <SelectTrigger className="bg-white w-full">
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
                        placeholder="Masukkan Nama Barang"
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
                              disabled={showAddSatuan}
                            />
                            {/* Tombol tambah satuan */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mb-2 w-full"
                              onClick={() => setShowAddSatuan((v) => !v)}
                              disabled={showAddSatuan}
                            >
                              + Tambahkan Satuan
                            </Button>
                            {/* Input tambah satuan, hanya tampil saat showAddSatuan */}
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
                                  onClick={async () => {
                                    await handleAddSatuan();
                                    setShowAddSatuan(false);
                                    setNewSatuan("");
                                  }}
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
                                <div
                                  key={sat.id_satuan}
                                  className="flex items-center gap-2 px-2 py-1 group hover:bg-gray-50"
                                >
                                  <SelectItem
                                    value={String(sat.id_satuan)}
                                    className="flex-1"
                                    disabled={showAddSatuan}
                                  >
                                    {sat.satuan}
                                  </SelectItem>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs text-red-600 px-1 py-0.5"
                                    onClick={() =>
                                      handleDeleteSatuan(
                                        String(sat.id_satuan)
                                      )
                                    }
                                    disabled={showAddSatuan}
                                  >
                                    Hapus
                                  </Button>
                                </div>
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
                <Label htmlFor="id_skema"></Label>
                <div className="space-y-2">
                  <Label
                    htmlFor="skema"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Skema
                  </Label>
                  <Input
                    id="skema"
                    value={formData.skemaLabel}
                    readOnly
                    className="border-border focus:border-primary/50 bg-gray-100"
                  />
                </div>
              </div>

              <div className="flex space-x-2 justify-end">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                >
                  {editId ? "Simpan Perubahan" : "Simpan PR"}
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