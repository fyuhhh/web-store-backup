
"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/app/pr/input-baru/datepicker-red-weekend.css"; // Reuse existing styles

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
import { Checkbox } from "@/components/ui/checkbox";
import { API_BASE_URL } from "@/lib/config";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Trash2, Plus, Save, Edit2 } from "lucide-react";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface MRItem {
    id: string; // Temporary ID for UI
    nama_barang: string;
    quantity: number | "";
    satuan: string;
    keterangan: string;
    harga_satuan: number | "";
    diskon_persen: string;
    diskon_rp: number | "";
    ppn_persen: number | "";
    ppn_rp: number | ""; // Calculated or manual? Requirements say "PPN RP."
    total: number;
}

// Helper functions for formatting
const formatRupiah = (value: number | string) => {
    if (value === "" || value === 0 || value === "0") return "";
    const num = Number(value);
    if (isNaN(num)) return "";
    return "Rp. " + num.toLocaleString("id-ID");
};

const parseRupiah = (value: string) => {
    return value.replace(/[^0-9]/g, "");
};

const formatPersen = (value: number | string) => {
    if (value === "" || value === 0 || value === "0") return "";
    return String(value).replace("%", "") + "%";
};

const parsePersen = (value: string) => {
    return value.replace(/[^0-9,.]/g, "").replace(",", ".");
};

export default function InputMRPage() {
    const [loading, setLoading] = useState(false);
    const [notif, setNotif] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Header State
    const [noMR, setNoMR] = useState("");
    const [tanggalMR, setTanggalMR] = useState<Date | null>(new Date());
    // Divisi State
    const [idDivisi, setIdDivisi] = useState("");
    const [divisiOptions, setDivisiOptions] = useState<any[]>([]);
    const [divisiSearch, setDivisiSearch] = useState("");
    const [showAddDivisi, setShowAddDivisi] = useState(false);
    const [newDivisi, setNewDivisi] = useState("");
    const [editDivisiId, setEditDivisiId] = useState<string | null>(null);
    const [editDivisiValue, setEditDivisiValue] = useState("");

    // Supplier State
    const [supplierId, setSupplierId] = useState("");
    const [supplierOptions, setSupplierOptions] = useState<any[]>([]);
    const [supplierSearch, setSupplierSearch] = useState("");
    const [showAddSupplier, setShowAddSupplier] = useState(false);
    const [newSupplier, setNewSupplier] = useState("");
    const [editSupplierId, setEditSupplierId] = useState<string | null>(null);
    const [editSupplierValue, setEditSupplierValue] = useState("");

    const [tanggalPembelian, setTanggalPembelian] = useState<Date | null>(new Date());
    const [ppnIncluded, setPpnIncluded] = useState(false);

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
            keterangan: "",
            harga_satuan: "",
            diskon_persen: "",
            diskon_rp: "",
            ppn_persen: "",
            ppn_rp: "",
            total: 0,
        },
    ]);

    // Fetch Divisi & Suppliers
    useEffect(() => {
        fetch(`${API_BASE_URL}/api/divisi`)
            .then((res) => res.json())
            .then((data) => setDivisiOptions(data))
            .catch((err) => console.error("Failed to fetch divisi", err));

        fetch(`${API_BASE_URL}/api/supplier`)
            .then((res) => res.json())
            .then((data) => setSupplierOptions(data))
            .catch((err) => console.error("Failed to fetch suppliers", err));

        fetch(`${API_BASE_URL}/api/satuan`)
            .then((res) => res.json())
            .then((data) => setSatuanOptions(data))
            .catch((err) => console.error("Failed to fetch satuan", err));
    }, []);

    useEffect(() => {
        // Auto-generate No MR when date changes
        if (tanggalMR) {
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
    }, [tanggalMR]);

    // Supplier Handlers
    const handleAddSupplier = async () => {
        if (!newSupplier.trim()) return;
        try {
            const res = await fetch(API_BASE_URL + "/api/supplier", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ namaSupplier: newSupplier }),
            });
            if (res.ok) {
                const data = await res.json();
                setSupplierOptions((prev) => [...prev, data]);
                setSupplierId(String(data.id_supplier));
                setShowAddSupplier(false);
                setNewSupplier("");
            }
        } catch (err) {
            console.error("Failed to add supplier", err);
        }
    };

    const handleEditSupplier = async (id: string) => {
        if (!editSupplierValue.trim()) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/supplier/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ namaSupplier: editSupplierValue }),
            });
            if (res.ok) {
                // Refresh list or update local
                fetch(`${API_BASE_URL}/api/supplier`)
                    .then((res) => res.json())
                    .then((data) => setSupplierOptions(data));
                setEditSupplierId(null);
                setEditSupplierValue("");
            }
        } catch (err) { }
    };

    const handleDeleteSupplier = async (id: string) => {
        if (!id) return;
        if (!window.confirm("Yakin ingin menghapus supplier ini?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/supplier/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setSupplierOptions((prev) => prev.filter(s => String(s.id_supplier) !== id));
                if (supplierId === id) setSupplierId("");
            }
        } catch (err) { }
    };

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
                // Refresh list
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
                // Refresh list
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

    // Calculations
    const calculateItemTotal = (item: MRItem, ppnInc: boolean): number => {
        const qty = Number(item.quantity) || 0;
        const harga = Number(item.harga_satuan) || 0;
        const subtotal = qty * harga;
        let diskonVal = Number(item.diskon_rp) || 0;

        // Net before tax
        const netObj = subtotal - diskonVal;

        if (ppnInc) {
            // Total is simply the net amount (tax is inside)
            return netObj;
            // Note: ppn_rp should be extracted dynamically if needed, 
            // but for 'total' field in MRItem, it usually represents "Amount To Pay" for that line.
        } else {
            let ppnVal = Number(item.ppn_rp) || 0;
            return netObj + ppnVal;
        }
    };

    // Update item field with smart calculation
    const updateItem = (id: string, field: keyof MRItem, value: any) => {
        setItems((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    let updated = { ...item, [field]: value };

                    // Recalculate based on current state (or updated field)
                    const qty = Number(updated.quantity) || 0;
                    const harga = Number(updated.harga_satuan) || 0;
                    const subtotal = qty * harga; // Gross

                    // 1. Recalculate Diskon RP if % exists
                    if (field === "diskon_persen" || field === "quantity" || field === "harga_satuan") {
                        if (updated.diskon_persen) {
                            const persen = parseFloat(updated.diskon_persen.replace("%", "")) || 0;
                            updated.diskon_rp = (subtotal * persen) / 100;
                        }
                    } else if (field === "diskon_rp") {
                        // Recalculate Diskon %
                        const rp = Number(value) || 0;
                        updated.diskon_persen = subtotal > 0 ? ((rp / subtotal) * 100).toFixed(2) + "%" : "0%";
                    }

                    const diskonRp = Number(updated.diskon_rp) || 0;
                    const afterDiskon = subtotal - diskonRp;

                    // 2. Recalculate PPN RP if % exists (or field is PPN related)
                    if (field === "ppn_persen" || field === "quantity" || field === "harga_satuan" || field === "diskon_persen" || field === "diskon_rp") {
                        if (updated.ppn_persen) {
                            const persen = Number(updated.ppn_persen) || 0;
                            if (ppnIncluded) {
                                // Inclusive: PPN = Total - (Total / (1 + Rate))
                                // Total here is 'afterDiskon'
                                const dpp = afterDiskon / (1 + (persen / 100));
                                updated.ppn_rp = afterDiskon - dpp;
                            } else {
                                // Exclusive: PPN = DPP * Rate
                                updated.ppn_rp = afterDiskon * (persen / 100);
                            }
                        }
                    } else if (field === "ppn_rp") {
                        // Reverse calculate %
                        const ppnVal = Number(value) || 0;
                        if (ppnIncluded) {
                            // Difficult to reverse perfectly without circular logic if changing RP directly in Inclusive mode,
                            // but generally: PPN = Total - (Total/1+R). 
                            // Let's simplified: If user manually types PPN Rp, we validly assume it's the tax amount.
                            // DPP = Total - PPN. Rate = PPN/DPP
                            const dpp = afterDiskon - ppnVal;
                            updated.ppn_persen = dpp > 0 ? ((ppnVal / dpp) * 100) : 0;
                        } else {
                            // Exclusive
                            const dpp = afterDiskon;
                            updated.ppn_persen = dpp > 0 ? ((ppnVal / dpp) * 100) : 0;
                        }
                    }

                    updated.total = calculateItemTotal(updated, ppnIncluded);
                    return updated;
                }
                return item;
            })
        );
    };

    // Effect to recalculate all items when ppnIncluded changes
    useEffect(() => {
        setItems(prev => prev.map(item => {
            let updated = { ...item };
            const qty = Number(updated.quantity) || 0;
            const harga = Number(updated.harga_satuan) || 0;
            const subtotal = qty * harga;
            const diskonRp = Number(updated.diskon_rp) || 0;
            const afterDiskon = subtotal - diskonRp;
            const ppnPersen = Number(updated.ppn_persen) || 0;

            if (ppnIncluded) {
                const dpp = afterDiskon / (1 + (ppnPersen / 100));
                updated.ppn_rp = afterDiskon - dpp;
            } else {
                updated.ppn_rp = afterDiskon * (ppnPersen / 100);
            }
            updated.total = calculateItemTotal(updated, ppnIncluded);
            return updated;
        }));
    }, [ppnIncluded]);

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                nama_barang: "",
                quantity: "",
                satuan: "",
                keterangan: "",
                harga_satuan: "",
                diskon_persen: "",
                diskon_rp: "",
                ppn_persen: "",
                ppn_rp: "",
                total: 0,
            },
        ]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems((prev) => prev.filter((i) => i.id !== id));
        }
    };

    const handleSave = async () => {
        if (!noMR || !tanggalMR || !supplierId || !tanggalPembelian) {
            setNotif({ type: "error", message: "Mohon lengkapi data header (No MR, Tanggal, Supplier)" });
            return;
        }
        if (items.length === 0 || items.some(i => !i.nama_barang || !i.quantity || !i.harga_satuan)) {
            setNotif({ type: "error", message: "Mohon lengkapi data barang (Nama, Qty, Harga)" });
            return;
        }

        // Look up supplier name
        const selectedSupplier = supplierOptions.find(s => String(s.id_supplier) === supplierId);
        const namaSupplierToSave = selectedSupplier ? selectedSupplier.namaSupplier : "";
        if (!namaSupplierToSave) {
            setNotif({ type: "error", message: "Supplier tidak valid" });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                no_mr: noMR,
                tanggal_mr: tanggalMR.toISOString().split("T")[0],
                id_divisi: idDivisi || null,
                nama_supplier: namaSupplierToSave,
                tanggal_pembelian: tanggalPembelian.toISOString().split("T")[0],
                items: items.map(i => ({
                    nama_barang: i.nama_barang,
                    quantity: Number(i.quantity),
                    satuan: i.satuan,
                    keterangan: i.keterangan,
                    harga_satuan: Number(i.harga_satuan),
                    diskon_persen: i.diskon_persen,
                    diskon_rp: Number(i.diskon_rp) || 0,
                    ppn_persen: Number(i.ppn_persen) || 0,
                    ppn_rp: Number(i.ppn_rp) || 0,
                    total: i.total
                }))
            };

            const res = await fetch(`${API_BASE_URL}/api/mr`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Gagal menyimpan MR");

            const data = await res.json();
            setNotif({ type: "success", message: `MR Berhasil disimpan! ID: ${data.id_mr}` });

            // Reset form? Or redirect?
            // Reset for now
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (err: any) {
            setNotif({ type: "error", message: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6 pb-20">
                {/* Notification Toast */}
                {notif && (
                    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow text-white ${notif.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                        {notif.message}
                    </div>
                )}

                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Input MR (Closing Cashier)</h1>
                </div>

                {/* Combined Header Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi MR & Supplier</CardTitle>
                        <CardDescription>Lengkapi data header MR dan Supplier</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        {/* Combined Grid: 5 Columns on LG, single row */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                            {/* 1. No MR */}
                            <div className="space-y-2">
                                <Label>No. MR</Label>
                                <Input value={noMR} onChange={(e) => setNoMR(e.target.value)} placeholder="MR/..." />
                            </div>
                            {/* 2. Tanggal MR */}
                            <div className="space-y-2">
                                <Label>Tanggal MR</Label>
                                <div className="w-full">
                                    <DatePicker
                                        selected={tanggalMR}
                                        onChange={(date) => setTanggalMR(date)}
                                        dateFormat="dd-MM-yyyy"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        wrapperClassName="w-full"
                                    />
                                </div>
                            </div>
                            {/* 3. Supplier */}
                            <div className="space-y-2">
                                <Label>Supplier</Label>
                                <Select
                                    value={supplierId}
                                    onValueChange={setSupplierId}
                                >
                                    <SelectTrigger className="w-full border-border focus:border-primary/50 bg-white">
                                        <SelectValue placeholder="Pilih Supplier" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white max-h-[384px] overflow-y-auto relative">
                                        <div className="sticky top-0 z-20 bg-white px-2 py-1 border-b border-gray-100">
                                            {showAddSupplier ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        placeholder="Nama supplier baru"
                                                        value={newSupplier}
                                                        onChange={(e) => setNewSupplier(e.target.value)}
                                                        className="h-8"
                                                        autoFocus
                                                    />
                                                    <Button size="sm" onClick={handleAddSupplier}>Simpan</Button>
                                                    <Button size="sm" variant="ghost" onClick={() => setShowAddSupplier(false)}>Batal</Button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <Input
                                                        placeholder="Cari supplier..."
                                                        value={supplierSearch}
                                                        onChange={(e) => setSupplierSearch(e.target.value)}
                                                        className="h-8"
                                                    />
                                                    <Button size="sm" variant="outline" className="w-full h-8" onClick={() => setShowAddSupplier(true)}>
                                                        + Tambah Supplier
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {!showAddSupplier && (
                                            <>
                                                {supplierOptions.length === 0 ? (
                                                    <div className="p-2 text-sm text-muted-foreground">Tidak ada data.</div>
                                                ) : (
                                                    supplierOptions.filter((s) => s.namaSupplier.toLowerCase().includes(supplierSearch.toLowerCase())).map((s) => (
                                                        <div key={s.id_supplier} className="flex items-center justify-between group px-1">
                                                            {editSupplierId === String(s.id_supplier) ? (
                                                                <div className="flex items-center gap-1 w-full p-1">
                                                                    <Input
                                                                        value={editSupplierValue}
                                                                        onChange={(e) => setEditSupplierValue(e.target.value)}
                                                                        className="h-7 text-xs"
                                                                    />
                                                                    <Button size="sm" onClick={() => handleEditSupplier(String(s.id_supplier))} className="h-7 px-2">OK</Button>
                                                                    <Button size="sm" variant="ghost" onClick={() => setEditSupplierId(null)} className="h-7 px-2">X</Button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <SelectItem value={String(s.id_supplier)} className="flex-1 cursor-pointer">
                                                                        {s.namaSupplier}
                                                                    </SelectItem>
                                                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-6 w-6 text-blue-500"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation(); // prevent selection
                                                                                setEditSupplierId(String(s.id_supplier));
                                                                                setEditSupplierValue(s.namaSupplier);
                                                                            }}
                                                                        >
                                                                            <Edit2 className="h-3 w-3" />
                                                                        </Button>
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-6 w-6 text-red-500"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                handleDeleteSupplier(String(s.id_supplier));
                                                                            }}
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* 4. Divisi */}
                            <div className="space-y-2">
                                <Label>Divisi</Label>
                                <Select value={idDivisi} onValueChange={setIdDivisi}>
                                    <SelectTrigger className="w-full border-border focus:border-primary/50 bg-white">
                                        <SelectValue placeholder="Pilih Divisi" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white max-h-[384px] overflow-y-auto relative">
                                        <div className="sticky top-0 z-20 bg-white px-2 py-1 border-b border-gray-100">
                                            {showAddDivisi ? (
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        placeholder="Nama divisi baru"
                                                        value={newDivisi}
                                                        onChange={(e) => setNewDivisi(e.target.value)}
                                                        className="h-8"
                                                        autoFocus
                                                    />
                                                    <Button size="sm" onClick={handleAddDivisi}>Simpan</Button>
                                                    <Button size="sm" variant="ghost" onClick={() => setShowAddDivisi(false)}>Batal</Button>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <Input
                                                        placeholder="Cari divisi..."
                                                        value={divisiSearch}
                                                        onChange={(e) => setDivisiSearch(e.target.value)}
                                                        className="h-8"
                                                    />
                                                    <Button size="sm" variant="outline" className="w-full h-8" onClick={() => setShowAddDivisi(true)}>
                                                        + Tambah Divisi
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {!showAddDivisi && (
                                            <>
                                                {divisiOptions.length === 0 ? (
                                                    <div className="p-2 text-sm text-muted-foreground">Tidak ada data.</div>
                                                ) : (
                                                    divisiOptions.filter((d) => d.divisi.toLowerCase().includes(divisiSearch.toLowerCase())).map((d) => (
                                                        <div key={d.id_divisi} className="flex items-center justify-between group px-1">
                                                            {editDivisiId === String(d.id_divisi) ? (
                                                                <div className="flex items-center gap-1 w-full p-1">
                                                                    <Input
                                                                        value={editDivisiValue}
                                                                        onChange={(e) => setEditDivisiValue(e.target.value)}
                                                                        className="h-7 text-xs"
                                                                    />
                                                                    <Button size="sm" onClick={() => handleEditDivisi(String(d.id_divisi))} className="h-7 px-2">OK</Button>
                                                                    <Button size="sm" variant="ghost" onClick={() => setEditDivisiId(null)} className="h-7 px-2">X</Button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <SelectItem value={String(d.id_divisi)} className="flex-1 cursor-pointer">
                                                                        {d.divisi}
                                                                    </SelectItem>
                                                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-6 w-6 text-blue-500"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation(); // prevent selection
                                                                                setEditDivisiId(String(d.id_divisi));
                                                                                setEditDivisiValue(d.divisi);
                                                                            }}
                                                                        >
                                                                            <Edit2 className="h-3 w-3" />
                                                                        </Button>
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            className="h-6 w-6 text-red-500"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                handleDeleteDivisi(String(d.id_divisi));
                                                                            }}
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* 5. Tanggal Pembelian */}
                            <div className="space-y-2">
                                <Label>Tanggal Pembelian</Label>
                                <div className="w-full">
                                    <DatePicker
                                        selected={tanggalPembelian}
                                        onChange={(date) => setTanggalPembelian(date)}
                                        dateFormat="dd-MM-yyyy"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        wrapperClassName="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Items Table */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Daftar Barang</CardTitle>
                        <Button variant="outline" size="sm" onClick={addItem}>
                            <Plus className="h-4 w-4 mr-2" /> Tambah Barang
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[150px]">Nama Barang</TableHead>
                                        <TableHead className="w-[80px]">Qty</TableHead>
                                        <TableHead className="w-[80px]">Satuan</TableHead>
                                        <TableHead className="min-w-[120px]">Keterangan</TableHead>
                                        <TableHead className="min-w-[140px]">Harga (Rp.)</TableHead>
                                        <TableHead className="w-[90px]">Diskon (%)</TableHead>
                                        <TableHead className="min-w-[120px]">Diskon (Rp.)</TableHead>
                                        <TableHead className="w-[90px]">PPN (%)</TableHead>
                                        <TableHead className="min-w-[120px]">PPN (Rp.)</TableHead>
                                        <TableHead className="min-w-[150px]">Total</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Input
                                                    value={item.nama_barang}
                                                    onChange={(e) => updateItem(item.id, "nama_barang", e.target.value)}
                                                    placeholder="Nama Barang"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                                                    className="w-full"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={item.satuan}
                                                    onValueChange={(value) => updateItem(item.id, "satuan", value)}
                                                >
                                                    <SelectTrigger className="w-full bg-white h-9">
                                                        <SelectValue placeholder="" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white max-h-[300px] overflow-y-auto">
                                                        <div className="sticky top-0 z-20 bg-white px-2 py-2 border-b border-gray-100">
                                                            {showAddSatuan ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Input
                                                                        placeholder="Satuan baru..."
                                                                        value={newSatuan}
                                                                        onChange={(e) => setNewSatuan(e.target.value)}
                                                                        className="h-8"
                                                                        autoFocus
                                                                    />
                                                                    <Button size="sm" onClick={handleAddSatuan} className="h-8 px-2">OK</Button>
                                                                    <Button size="sm" variant="ghost" onClick={() => setShowAddSatuan(false)} className="h-8 px-2">X</Button>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    <Input
                                                                        placeholder="Cari..."
                                                                        value={satuanSearch}
                                                                        onChange={(e) => setSatuanSearch(e.target.value)}
                                                                        className="h-8 mb-1"
                                                                    />
                                                                    <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => setShowAddSatuan(true)}>
                                                                        + Tambah
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {!showAddSatuan && (
                                                            <>
                                                                {satuanOptions.length === 0 ? (
                                                                    <div className="p-2 text-xs text-muted-foreground text-center">No data</div>
                                                                ) : (
                                                                    satuanOptions.filter((s) => s.satuan.toLowerCase().includes(satuanSearch.toLowerCase())).map((s) => (
                                                                        <div key={s.id_satuan} className="flex items-center justify-between group px-1 py-0.5 hover:bg-slate-50">
                                                                            {editSatuanId === String(s.id_satuan) ? (
                                                                                <div className="flex items-center gap-1 w-full p-1">
                                                                                    <Input
                                                                                        value={editSatuanValue}
                                                                                        onChange={(e) => setEditSatuanValue(e.target.value)}
                                                                                        className="h-7 text-xs"
                                                                                    />
                                                                                    <Button size="sm" onClick={() => handleEditSatuan(String(s.id_satuan))} className="h-7 px-2">OK</Button>
                                                                                    <Button size="sm" variant="ghost" onClick={() => setEditSatuanId(null)} className="h-7 px-2">X</Button>
                                                                                </div>
                                                                            ) : (
                                                                                <>
                                                                                    <SelectItem value={s.satuan} className="flex-1 cursor-pointer py-1.5 text-sm">
                                                                                        {s.satuan}
                                                                                    </SelectItem>
                                                                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                        <Button
                                                                                            size="icon"
                                                                                            variant="ghost"
                                                                                            className="h-6 w-6 text-blue-500"
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
                                                                                            className="h-6 w-6 text-red-500"
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
                                                                )}
                                                            </>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={item.keterangan}
                                                    onChange={(e) => updateItem(item.id, "keterangan", e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={formatRupiah(item.harga_satuan)}
                                                    onChange={(e) => updateItem(item.id, "harga_satuan", parseRupiah(e.target.value))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={formatPersen(item.diskon_persen)}
                                                    onChange={(e) => updateItem(item.id, "diskon_persen", parsePersen(e.target.value))}
                                                    placeholder="0%"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={formatRupiah(item.diskon_rp)}
                                                    onChange={(e) => updateItem(item.id, "diskon_rp", parseRupiah(e.target.value))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={formatPersen(item.ppn_persen)}
                                                    onChange={(e) => updateItem(item.id, "ppn_persen", parsePersen(e.target.value))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={formatRupiah(item.ppn_rp)}
                                                    onChange={(e) => updateItem(item.id, "ppn_rp", parseRupiah(e.target.value))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-semibold">
                                                    {item.total ? "Rp. " + item.total.toLocaleString('id-ID') : "Rp. 0"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>



                {/* PPN Checkbox */}
                <div className="flex items-center gap-2 mt-4">
                    <Checkbox
                        id="ppn-included"
                        checked={ppnIncluded}
                        onCheckedChange={(checked) => setPpnIncluded(!!checked)}
                    />
                    <Label htmlFor="ppn-included" className="cursor-pointer">
                        Harga sudah termasuk PPN
                    </Label>
                </div>

                {/* Calculation Summary */}
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-3">RINGKASAN PERHITUNGAN</h3>
                    <div className="border rounded-lg p-4 space-y-3 bg-white">
                        {(() => {
                            const summary = items.reduce(
                                (acc, item) => {
                                    const qty = Number(item.quantity) || 0;
                                    const harga = Number(item.harga_satuan) || 0;
                                    const gross = qty * harga;
                                    const diskon = Number(item.diskon_rp) || 0;
                                    const ppn = Number(item.ppn_rp) || 0;
                                    const net = gross - diskon;

                                    let dpp = 0;
                                    if (ppnIncluded) {
                                        // If included, total = net
                                        // PPN = net - (net / (1+rate))
                                        // DPP = net - PPN
                                        // Since we already calculated item.ppn_rp in state, we can use it? 
                                        // Yes, for consistency.
                                        dpp = net - ppn;
                                    } else {
                                        dpp = net;
                                    }

                                    return {
                                        subtotal: acc.subtotal + dpp, // Accumulate DPP
                                        diskon: acc.diskon + diskon,
                                        ppn: acc.ppn + ppn,
                                        total: acc.total + (item.total || 0),
                                    };
                                },
                                { subtotal: 0, diskon: 0, ppn: 0, total: 0 }
                            );

                            return (
                                <>
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>
                                            Rp {summary.subtotal.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between font-medium">
                                        <span>Total Diskon:</span>
                                        <span className="text-red-500">
                                            -Rp {summary.diskon.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total PPN:</span>
                                        <span className="text-green-600">
                                            {ppnIncluded ? "" : "+"}Rp {summary.ppn.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                    <hr className="my-2" />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total Pembayaran:</span>
                                        <span className="text-primary">
                                            Rp {summary.total.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                    {ppnIncluded && (
                                        <div className="text-xs text-muted-foreground mt-2">
                                            <b>Catatan:</b> Total pembayaran sudah termasuk PPN.
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end">
                    <Button size="lg" onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90">
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? "Menyimpan..." : "Simpan MR"}
                    </Button>
                </div>

            </div>
        </MainLayout >
    );
}
