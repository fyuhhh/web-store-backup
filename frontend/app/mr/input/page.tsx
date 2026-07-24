"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/app/pr/input-baru/datepicker-red-weekend.css";

import { MainLayout } from "@/components/layout/main-layout";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE_URL } from "@/lib/config";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Trash2, Plus, Save, Edit2, ArrowLeft, Calendar, FileText } from "lucide-react";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";

interface MRItem {
    id: string;
    nama_barang: string;
    quantity: number | "";
    satuan: string;
    spesifikasi: string;
    keterangan: string;
}

export default function InputMRPage() {
    const [loading, setLoading] = useState(false);
    const [notif, setNotif] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    // Header State
    const [noMR, setNoMR] = useState("");
    const [tanggalMR, setTanggalMR] = useState<Date | null>(new Date());
    const [idDivisi, setIdDivisi] = useState("");
    const [divisiOptions, setDivisiOptions] = useState<any[]>([]);
    const [divisiSearch, setDivisiSearch] = useState("");
    const [showAddDivisi, setShowAddDivisi] = useState(false);
    const [newDivisi, setNewDivisi] = useState("");
    const [editDivisiId, setEditDivisiId] = useState<string | null>(null);
    const [editDivisiValue, setEditDivisiValue] = useState("");

    // Satuan State
    const [satuanOptions, setSatuanOptions] = useState<any[]>([]);
    const [satuanSearch, setSatuanSearch] = useState("");
    const [showAddSatuan, setShowAddSatuan] = useState(false);
    const [newSatuan, setNewSatuan] = useState("");
    const [editSatuanId, setEditSatuanId] = useState<string | null>(null);
    const [editSatuanValue, setEditSatuanValue] = useState("");

    // Items State
    const [items, setItems] = useState<MRItem[]>([
        {
            id: Date.now().toString(),
            nama_barang: "",
            quantity: "",
            satuan: "",
            spesifikasi: "",
            keterangan: "",
        },
    ]);

    // Fetch Initial Data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const userData = JSON.parse(localStorage.getItem("userData") || "{}");
                const userIdNum = Number(userData.id_user || userData.id || 0);
                if ([168, 169].includes(userIdNum)) {
                    window.location.href = "/mr/monitoring";
                    return;
                }

                const [divisiRes, satuanRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/divisi`),
                    fetch(`${API_BASE_URL}/api/satuan`),
                ]);
                
                const divisiData = await divisiRes.json();
                const satuanData = await satuanRes.json();

                setDivisiOptions(divisiData);
                setSatuanOptions(satuanData);

                const params = new URLSearchParams(window.location.search);
                const id = params.get("id");
                if (id && id !== "null") {
                    setIsEditMode(true);
                    setEditId(id);
                    const mrRes = await fetch(`${API_BASE_URL}/api/mr/${id}`);
                    if (mrRes.ok) {
                        const mrData = await mrRes.json();
                        
                        setNoMR(mrData.no_mr);
                        if (mrData.tanggal_mr) setTanggalMR(new Date(mrData.tanggal_mr));
                        setIdDivisi(String(mrData.id_divisi || ""));

                        if (mrData.items && mrData.items.length > 0) {
                            setItems(mrData.items.map((item: any) => ({
                                id: String(item.id_mr_item),
                                nama_barang: item.nama_barang,
                                quantity: item.quantity,
                                satuan: item.satuan,
                                spesifikasi: item.spesifikasi || "",
                                keterangan: item.keterangan || "",
                            })));
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch initial data", err);
            }
        };

        fetchInitialData();
    }, []);

    // Auto-generate No MR
    useEffect(() => {
        if (tanggalMR && !isEditMode) {
            const yyyy = tanggalMR.getFullYear();
            const mm = String(tanggalMR.getMonth() + 1).padStart(2, "0");
            const dd = String(tanggalMR.getDate()).padStart(2, "0");
            const dateStr = `${yyyy}-${mm}-${dd}`;

            fetch(`${API_BASE_URL}/api/mr/next-number?tanggal_mr=${dateStr}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.nextNoMR) setNoMR(data.nextNoMR);
                })
                .catch((err) => console.error("Failed to fetch next MR number", err));
        }
    }, [tanggalMR, isEditMode]);

    // Divisi Handlers
    const handleAddDivisi = async () => {
        if (!newDivisi.trim()) return;
        try {
            const res = await fetch(API_BASE_URL + "/api/divisi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ divisi: newDivisi }),
            });
            if (res.ok) {
                const data = await res.json();
                setDivisiOptions((prev) => [...prev, data]);
                setIdDivisi(String(data.id_divisi));
                setShowAddDivisi(false);
                setNewDivisi("");
            }
        } catch (err) {
            console.error("Failed to add divisi", err);
        }
    };

    const handleEditDivisi = async (id: string) => {
        if (!editDivisiValue.trim()) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/divisi/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ divisi: editDivisiValue }),
            });
            if (res.ok) {
                fetch(`${API_BASE_URL}/api/divisi`)
                    .then((res) => res.json())
                    .then((data) => setDivisiOptions(data));
                setEditDivisiId(null);
                setEditDivisiValue("");
            }
        } catch (err) { }
    };

    const handleDeleteDivisi = async (id: string) => {
        if (!id) return;
        if (!window.confirm("Yakin ingin menghapus divisi ini?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/divisi/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setDivisiOptions((prev) => prev.filter(d => String(d.id_divisi) !== id));
                if (idDivisi === id) setIdDivisi("");
            }
        } catch (err) { }
    };

    // Satuan Handlers
    const handleAddSatuan = async () => {
        if (!newSatuan.trim()) return;
        try {
            const res = await fetch(API_BASE_URL + "/api/satuan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ satuan: newSatuan }),
            });
            if (res.ok) {
                fetch(`${API_BASE_URL}/api/satuan`)
                    .then((res) => res.json())
                    .then((data) => setSatuanOptions(data));
                setShowAddSatuan(false);
                setNewSatuan("");
            }
        } catch (err) {
            console.error("Failed to add satuan", err);
        }
    };

    const handleEditSatuan = async (id: string) => {
        if (!editSatuanValue.trim()) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/satuan/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ satuan: editSatuanValue }),
            });
            if (res.ok) {
                fetch(`${API_BASE_URL}/api/satuan`)
                    .then((res) => res.json())
                    .then((data) => setSatuanOptions(data));
                setEditSatuanId(null);
                setEditSatuanValue("");
            }
        } catch (err) { }
    };

    const handleDeleteSatuan = async (id: string) => {
        if (!id) return;
        if (!window.confirm("Yakin ingin menghapus satuan ini?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/satuan/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setSatuanOptions((prev) => prev.filter(s => String(s.id_satuan) !== id));
            }
        } catch (err) { }
    };

    const updateItem = (id: string, field: keyof MRItem, value: any) => {
        setItems((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    return { ...item, [field]: value };
                }
                return item;
            })
        );
    };

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                nama_barang: "",
                quantity: "",
                satuan: "",
                spesifikasi: "",
                keterangan: "",
            },
        ]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems((prev) => prev.filter((i) => i.id !== id));
        }
    };

    const handleSave = async () => {
        if (!noMR) {
            setNotif({ type: "error", message: "Mohon isi No MR" });
            return;
        }

        setLoading(true);
        try {
            const userData = JSON.parse(localStorage.getItem("userData") || "{}");
            const idSkema = userData.id_skema || userData.skema || null;

            const filteredItems = items
                .filter(i => i.nama_barang && i.nama_barang.trim() !== "")
                .map(i => ({
                    nama_barang: i.nama_barang,
                    quantity: Number(i.quantity) || 0,
                    satuan: i.satuan || null,
                    spesifikasi: i.spesifikasi || "",
                    keterangan: i.keterangan || "",
                    harga_satuan: 0,
                    diskon_persen: "",
                    diskon_rp: 0,
                    ppn_persen: 0,
                    ppn_rp: 0,
                    total: 0
                }));

            const payload = {
                no_mr: noMR,
                tanggal_mr: tanggalMR ? tanggalMR.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                id_divisi: idDivisi || null,
                nama_supplier: null,
                tanggal_pembelian: null,
                id_skema: idSkema,
                items: filteredItems
            };

            const url = isEditMode && editId 
                ? `${API_BASE_URL}/api/mr/${editId}`
                : `${API_BASE_URL}/api/mr`;
            
            const method = isEditMode ? "PUT" : "POST";

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(isEditMode ? "Gagal memperbarui MR" : "Gagal menyimpan MR");

            const data = await res.json();
            setNotif({ type: "success", message: isEditMode ? "MR Berhasil diperbarui!" : `MR Berhasil disimpan! ID: ${data.id_mr}` });

            setTimeout(() => {
                if (isEditMode) {
                     window.location.href = "/mr/monitoring";
                } else {
                     window.location.reload();
                }
            }, 1500);

        } catch (err: any) {
            setNotif({ type: "error", message: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto pb-20 space-y-8">
                {notif && (
                    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white font-medium flex items-center gap-2 animate-in slide-in-from-top-2 ${notif.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                        {notif.message}
                    </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Button 
                            variant="ghost" 
                            className="pl-0 hover:bg-transparent hover:text-primary mb-1 text-muted-foreground" 
                            onClick={() => window.location.href = "/mr/monitoring"}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Monitoring
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                            {isEditMode ? "Edit Material Request" : "Input New Material Request"}
                        </h1>
                        <p className="text-muted-foreground">
                            {isEditMode ? "Perbarui data request material yang sudah ada." : "Buat request material baru untuk divisi Anda."}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isEditMode && (
                            <div className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200">
                                Editing Mode
                            </div>
                        )}
                        <div className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full border border-gray-200">
                            Closing Cashier
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* HEADER INFORMATION CARD */}
                    <div className="lg:col-span-3 space-y-6">
                        <Card className="border-none shadow-sm bg-white ring-1 ring-gray-200/50">
                            <CardHeader className="pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-2 text-primary">
                                    <FileText className="h-5 w-5" />
                                    <h3 className="font-semibold text-lg text-gray-800">Informasi Dasar</h3>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* No MR */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">No. MR</Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-2.5 text-gray-400">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <Input 
                                            value={noMR} 
                                            onChange={(e) => setNoMR(e.target.value)} 
                                            placeholder="MR/YYYY/MM/XXXX" 
                                            className="pl-9 font-medium bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Tanggal MR */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tanggal MR</Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-2.5 text-gray-400 z-10 pointer-events-none">
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <div className="relative">
                                             <DatePicker
                                                selected={tanggalMR}
                                                onChange={(date) => setTanggalMR(date)}
                                                dateFormat="dd MMM yyyy"
                                                className="w-full pl-9 h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                wrapperClassName="w-full"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Divisi */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Divisi</Label>
                                    <Select value={idDivisi} onValueChange={setIdDivisi}>
                                        <SelectTrigger className="w-full bg-white border-gray-200">
                                            <SelectValue placeholder="Pilih Divisi" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white max-h-[300px]">
                                             <div className="sticky top-0 z-20 bg-white px-2 py-2 border-b border-gray-100 mb-1">
                                                 {showAddDivisi ? (
                                                     <div className="flex items-center gap-2">
                                                         <Input
                                                             placeholder="Nama divisi baru"
                                                             value={newDivisi}
                                                             onChange={(e) => setNewDivisi(e.target.value)}
                                                             className="h-8"
                                                             autoFocus
                                                         />
                                                         <Button size="sm" onClick={handleAddDivisi} className="h-8">Simpan</Button>
                                                         <Button size="sm" variant="ghost" onClick={() => setShowAddDivisi(false)} className="h-8">Batal</Button>
                                                     </div>
                                                 ) : (
                                                     <div className="space-y-2">
                                                         <Input placeholder="Cari divisi..." value={divisiSearch} onChange={(e) => setDivisiSearch(e.target.value)} className="h-8 bg-gray-50" />
                                                         <Button size="sm" variant="secondary" className="w-full h-8 text-xs" onClick={() => setShowAddDivisi(true)}>+ Tambah</Button>
                                                     </div>
                                                 )}
                                             </div>
                                             {!showAddDivisi && divisiOptions.filter(d => d.divisi.toLowerCase().includes(divisiSearch.toLowerCase())).map(d => (
                                                  <div key={d.id_divisi} className="flex items-center justify-between group px-2 py-1.5 hover:bg-gray-50 rounded-sm">
                                                      {editDivisiId === String(d.id_divisi) ? (
                                                          <div className="flex items-center gap-1 w-full">
                                                              <Input value={editDivisiValue} onChange={(e) => setEditDivisiValue(e.target.value)} className="h-7 text-xs" />
                                                              <Button size="sm" onClick={() => handleEditDivisi(String(d.id_divisi))} className="h-7 px-2">OK</Button>
                                                              <Button size="sm" variant="ghost" onClick={() => setEditDivisiId(null)} className="h-7 px-2">X</Button>
                                                          </div>
                                                      ) : (
                                                          <>
                                                              <SelectItem value={String(d.id_divisi)} className="flex-1">{d.divisi}</SelectItem>
                                                              <div className="flex items-center opacity-0 group-hover:opacity-100">
                                                                  <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-blue-500" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditDivisiId(String(d.id_divisi)); setEditDivisiValue(d.divisi); }}><Edit2 className="h-3 w-3" /></Button>
                                                                  <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-red-500" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteDivisi(String(d.id_divisi)); }}><Trash2 className="h-3 w-3" /></Button>
                                                              </div>
                                                          </>
                                                      )}
                                                  </div>
                                             ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ITEMS TABLE SECTION */}
                    <div className="lg:col-span-3">
                        <Card className="border-none shadow-sm bg-white ring-1 ring-gray-200/50">
                            <CardHeader className="pb-4 border-b border-gray-100 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-lg text-gray-800">Daftar Barang</h3>
                                    <p className="text-sm text-muted-foreground">Isi detail barang yang ingin direquest.</p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-gray-50/80">
                                            <TableRow className="hover:bg-gray-50/80 border-b border-gray-200">
                                                <TableHead className="w-[300px] font-semibold text-gray-700 py-4 pl-6">Nama Barang</TableHead>
                                                <TableHead className="w-[120px] font-semibold text-gray-700 text-center">Qty</TableHead>
                                                <TableHead className="w-[140px] font-semibold text-gray-700 text-center">Satuan</TableHead>
                                                <TableHead className="w-[280px] font-semibold text-gray-700">Spesifikasi</TableHead>
                                                <TableHead className="w-[280px] font-semibold text-gray-700">Keterangan</TableHead>
                                                <TableHead className="w-[60px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item) => (
                                                <TableRow key={item.id} className="group hover:bg-blue-50/30 transition-colors border-b border-gray-100">
                                                    <TableCell className="pl-6 py-3">
                                                        <Input 
                                                            placeholder="Nama Barang..."
                                                            value={item.nama_barang}
                                                            onChange={(e) => updateItem(item.id, "nama_barang", e.target.value)}
                                                            className="h-9 font-medium bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20" 
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <Input 
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                                                            className="h-9 text-center bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <Select 
                                                            value={item.satuan} 
                                                            onValueChange={(val) => updateItem(item.id, "satuan", val)}
                                                        >
                                                            <SelectTrigger className="w-full h-9 bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 px-2 text-center">
                                                                <SelectValue placeholder="Pilih" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white max-h-[300px] min-w-[140px]">
                                                                <div className="sticky top-0 z-20 bg-white px-2 py-2 border-b border-gray-100 mb-1">
                                                                    {showAddSatuan ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <Input
                                                                                placeholder="Baru..."
                                                                                value={newSatuan}
                                                                                onChange={(e) => setNewSatuan(e.target.value)}
                                                                                className="h-7 text-xs"
                                                                                autoFocus
                                                                            />
                                                                            <Button size="sm" onClick={handleAddSatuan} className="h-7 px-2 text-xs">OK</Button>
                                                                            <Button size="sm" variant="ghost" onClick={() => setShowAddSatuan(false)} className="h-7 px-2 text-xs">X</Button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            <Input 
                                                                                placeholder="Cari..." 
                                                                                value={satuanSearch} 
                                                                                onChange={(e) => setSatuanSearch(e.target.value)} 
                                                                                className="h-7 text-xs bg-gray-50" 
                                                                            />
                                                                            <Button 
                                                                                size="sm" 
                                                                                variant="secondary" 
                                                                                className="w-full h-7 text-xs" 
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    setShowAddSatuan(true);
                                                                                }}
                                                                            >
                                                                                <Plus className="h-3 w-3 mr-1"/> Tambah
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {!showAddSatuan && (
                                                                    satuanOptions.length === 0 ? (
                                                                        <div className="p-2 text-center text-xs text-muted-foreground">Kosong</div>
                                                                    ) : (
                                                                        satuanOptions.filter(s => s.satuan.toLowerCase().includes(satuanSearch.toLowerCase())).map(s => (
                                                                            <div key={s.id_satuan} className="flex items-center justify-between group px-2 py-1.5 hover:bg-gray-50 rounded-sm">
                                                                                {editSatuanId === String(s.id_satuan) ? (
                                                                                    <div className="flex items-center gap-1 w-full">
                                                                                        <Input 
                                                                                            value={editSatuanValue} 
                                                                                            onChange={(e) => setEditSatuanValue(e.target.value)} 
                                                                                            className="h-7 text-xs" 
                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                        />
                                                                                        <Button size="sm" onClick={(e) => { e.stopPropagation(); handleEditSatuan(String(s.id_satuan)); }} className="h-7 px-2 text-xs">OK</Button>
                                                                                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditSatuanId(null); }} className="h-7 px-2 text-xs">X</Button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <>
                                                                                        <SelectItem value={s.satuan} className="flex-1 text-xs">{s.satuan}</SelectItem>
                                                                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                            <Button 
                                                                                                size="icon" 
                                                                                                variant="ghost" 
                                                                                                className="h-5 w-5 text-muted-foreground hover:text-blue-500" 
                                                                                                onClick={(e) => { 
                                                                                                    e.preventDefault(); 
                                                                                                    e.stopPropagation(); 
                                                                                                    setEditSatuanId(String(s.id_satuan)); 
                                                                                                    setEditSatuanValue(s.satuan); 
                                                                                                }}
                                                                                            >
                                                                                                <Edit2 className="h-3 w-3" />
                                                                                            </Button>
                                                                                            <Button 
                                                                                                size="icon" 
                                                                                                variant="ghost" 
                                                                                                className="h-5 w-5 text-muted-foreground hover:text-red-500" 
                                                                                                onClick={(e) => { 
                                                                                                    e.preventDefault(); 
                                                                                                    e.stopPropagation(); 
                                                                                                    handleDeleteSatuan(String(s.id_satuan)); 
                                                                                                }}
                                                                                            >
                                                                                                <Trash2 className="h-3 w-3" />
                                                                                            </Button>
                                                                                        </div>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        ))
                                                                    )
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <Input 
                                                            placeholder="Spesifikasi..."
                                                            value={item.spesifikasi}
                                                            onChange={(e) => updateItem(item.id, "spesifikasi", e.target.value)}
                                                            className="h-9 bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 text-muted-foreground"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <Input 
                                                            placeholder="Keterangan..."
                                                            value={item.keterangan}
                                                            onChange={(e) => updateItem(item.id, "keterangan", e.target.value)}
                                                            className="h-9 bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 text-muted-foreground"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-3 text-center">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                                            onClick={() => removeItem(item.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                    <Button 
                                        variant="outline" 
                                        onClick={addItem}
                                        className="border-dashed border-gray-300 text-muted-foreground hover:text-primary hover:border-primary hover:bg-blue-50"
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Tambah Baris Barang
                                    </Button>

                                    <div className="flex gap-3">
                                        <Button 
                                            variant="outline" 
                                            size="lg" 
                                            className="border-gray-300 text-gray-700 hover:bg-gray-100"
                                            onClick={() => window.location.reload()}
                                        >
                                            Batal
                                        </Button>
                                        <Button 
                                            size="lg" 
                                            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                                            disabled={loading} 
                                            onClick={handleSave}
                                        >
                                            {loading ? "Menyimpan..." : (
                                                <>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    {isEditMode ? "Simpan Perubahan" : "Simpan MR Baru"}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
