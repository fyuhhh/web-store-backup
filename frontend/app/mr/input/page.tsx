
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
import { Trash2, Plus, Save, Edit2, ArrowLeft, Calendar, FileText } from "lucide-react";
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
    const [isEditMode, setIsEditMode] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

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
        const fetchInitialData = async () => {
          try {
            const [divisiRes, supplierRes, satuanRes] = await Promise.all([
              fetch(`${API_BASE_URL}/api/divisi`),
              fetch(`${API_BASE_URL}/api/supplier`),
              fetch(`${API_BASE_URL}/api/satuan`),
            ]);
            
            const divisiData = await divisiRes.json();
            const supplierData = await supplierRes.json();
            const satuanData = await satuanRes.json();

            setDivisiOptions(divisiData);
            setSupplierOptions(supplierData);
            setSatuanOptions(satuanData);

            // Check for edit mode
            const params = new URLSearchParams(window.location.search);
            const id = params.get("id");
            if (id && id !== "null") {
                setIsEditMode(true);
                setEditId(id);
                const mrRes = await fetch(`${API_BASE_URL}/api/mr/${id}`);
                if (mrRes.ok) {
                    const mrData = await mrRes.json();
                    
                    // Populate Header
                    setNoMR(mrData.no_mr);
                    if (mrData.tanggal_mr) setTanggalMR(new Date(mrData.tanggal_mr));
                    if (mrData.tanggal_pembelian) setTanggalPembelian(new Date(mrData.tanggal_pembelian));
                    setIdDivisi(String(mrData.id_divisi || ""));
                    
                    // Find Supplier ID by Name
                    const supplier = supplierData.find((s: any) => s.namaSupplier === mrData.nama_supplier);
                    if (supplier) setSupplierId(String(supplier.id_supplier));

                    // Populate Items
                    if (mrData.items && mrData.items.length > 0) {
                        setItems(mrData.items.map((item: any) => ({
                            id: String(item.id_mr_item), // Use real ID
                            nama_barang: item.nama_barang,
                            quantity: item.quantity,
                            satuan: item.satuan,
                            keterangan: item.keterangan || "",
                            harga_satuan: item.harga_satuan,
                            diskon_persen: item.diskon_persen || "",
                            diskon_rp: item.diskon_rp,
                            ppn_persen: item.ppn_persen || "",
                            ppn_rp: item.ppn_rp,
                            total: Number(item.total)
                        })));
                        
                        // Set PPN Included Logic (Inferred if PPN exists but calculate differs... actually let's just default false unless we store it)
                        // Or check if total matches inclusive calculation... complicated. Default false for now.
                    }
                }
            }
          } catch (err) {
            console.error("Failed to fetch initial data", err);
          }
        };

        fetchInitialData();
    }, []);

    useEffect(() => {
        // Auto-generate No MR when date changes, ONLY if not in edit mode
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
        if (!noMR) {
            setNotif({ type: "error", message: "Mohon isi No MR" });
            return;
        }

        setLoading(true);
        try {
            const userData = JSON.parse(localStorage.getItem("userData") || "{}");
            const idSkema = userData.id_skema || userData.skema || null;

            // Look up supplier name safely
            const selectedSupplier = supplierOptions.find(s => String(s.id_supplier) === supplierId);
            const namaSupplierToSave = selectedSupplier ? selectedSupplier.namaSupplier : null;

            // Filter items: only include those with at least a nama_barang
            // Since quantity is NOT NULL in DB, we default it to 0 if missing for these items
            const filteredItems = items
                .filter(i => i.nama_barang && i.nama_barang.trim() !== "")
                .map(i => ({
                    nama_barang: i.nama_barang,
                    quantity: Number(i.quantity) || 0,
                    satuan: i.satuan || null,
                    keterangan: i.keterangan || "",
                    harga_satuan: Number(i.harga_satuan) || 0,
                    diskon_persen: i.diskon_persen || "",
                    diskon_rp: Number(i.diskon_rp) || 0,
                    ppn_persen: Number(i.ppn_persen) || 0,
                    ppn_rp: Number(i.ppn_rp) || 0,
                    total: Number(i.total) || 0
                }));

            const payload = {
                no_mr: noMR,
                tanggal_mr: tanggalMR ? tanggalMR.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                id_divisi: idDivisi || null,
                nama_supplier: namaSupplierToSave,
                tanggal_pembelian: tanggalPembelian ? tanggalPembelian.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
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

            // Reset form? Or redirect?
            // Reset for now
            setTimeout(() => {
                if (isEditMode) {
                     window.location.href = "/mr/monitoring"; // Redirect back to monitoring after edit
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
                {/* Notification Toast */}
                {notif && (
                    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white font-medium flex items-center gap-2 animate-in slide-in-from-top-2 ${notif.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                        {notif.message}
                    </div>
                )}

                {/* Header & Navigation */}
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

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT COLUMN: Header Info */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* 1. HEADER INFORMATION CARD */}
                        <Card className="border-none shadow-sm bg-white ring-1 ring-gray-200/50">
                            <CardHeader className="pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-2 text-primary">
                                    <FileText className="h-5 w-5" />
                                    <h3 className="font-semibold text-lg text-gray-800">Informasi Dasar</h3>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                {/* Supplier */}
                                <div className="space-y-2 lg:col-span-1">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Supplier</Label>
                                    <div className="relative">
                                        <Select value={supplierId} onValueChange={setSupplierId}>
                                            <SelectTrigger className="w-full pl-3 bg-white border-gray-200">
                                                <SelectValue placeholder="Pilih Supplier" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white max-h-[300px]">
                                                <div className="sticky top-0 z-20 bg-white px-2 py-2 border-b border-gray-100 mb-1">
                                                  {showAddSupplier ? (
                                                      <div className="flex items-center gap-2">
                                                          <Input
                                                              placeholder="Nama supplier baru"
                                                              value={newSupplier}
                                                              onChange={(e) => setNewSupplier(e.target.value)}
                                                              className="h-8"
                                                              autoFocus
                                                          />
                                                          <Button size="sm" onClick={handleAddSupplier} className="h-8">Simpan</Button>
                                                          <Button size="sm" variant="ghost" onClick={() => setShowAddSupplier(false)} className="h-8">Batal</Button>
                                                      </div>
                                                  ) : (
                                                      <div className="space-y-2">
                                                          <Input
                                                              placeholder="Cari supplier..."
                                                              value={supplierSearch}
                                                              onChange={(e) => setSupplierSearch(e.target.value)}
                                                              className="h-8 bg-gray-50"
                                                          />
                                                          <Button size="sm" variant="secondary" className="w-full h-8 text-xs" onClick={() => setShowAddSupplier(true)}>
                                                              <Plus className="h-3 w-3 mr-1"/> Tambah
                                                          </Button>
                                                      </div>
                                                  )}
                                                </div>
                                                {!showAddSupplier && (
                                                   supplierOptions.length === 0 ? (
                                                       <div className="p-4 text-center text-sm text-muted-foreground">Tidak ada data.</div>
                                                   ) : (
                                                       supplierOptions.filter((s) => s.namaSupplier.toLowerCase().includes(supplierSearch.toLowerCase())).map((s) => (
                                                           <div key={s.id_supplier} className="flex items-center justify-between group px-2 py-1.5 hover:bg-gray-50 rounded-sm cursor-default">
                                                               {editSupplierId === String(s.id_supplier) ? (
                                                                  <div className="flex items-center gap-1 w-full">
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
                                                                         <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-blue-500" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditSupplierId(String(s.id_supplier)); setEditSupplierValue(s.namaSupplier); }}>
                                                                             <Edit2 className="h-3 w-3" />
                                                                         </Button>
                                                                         <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-red-500" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteSupplier(String(s.id_supplier)); }}>
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
                                    </div>
                                </div>

                                {/* Tanggal Pembelian */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tanggal Pembelian</Label>
                                    <div className="relative">
                                         <DatePicker
                                            selected={tanggalPembelian}
                                            onChange={(date) => setTanggalPembelian(date)}
                                            dateFormat="dd MMM yyyy"
                                            className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                                            wrapperClassName="w-full"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ITEMS TABLE SECTION (Large Column) */}
                    <div className="lg:col-span-3">
                        <Card className="border-none shadow-sm bg-white ring-1 ring-gray-200/50">
                            <CardHeader className="pb-4 border-b border-gray-100 flex flex-row items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-lg text-gray-800">Daftar Barang</h3>
                                    <p className="text-sm text-muted-foreground">Isi detail barang yang ingin direquest.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                     <div className="flex items-center gap-2 mr-4">
                                         <Checkbox 
                                             id="ppn-toggle" 
                                             checked={ppnIncluded} 
                                             onCheckedChange={(checked) => setPpnIncluded(checked as boolean)}
                                         />
                                         <Label htmlFor="ppn-toggle" className="text-sm cursor-pointer select-none">Harga Sudah Termasuk PPN?</Label>
                                     </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-gray-50/80">
                                            <TableRow className="hover:bg-gray-50/80 border-b border-gray-200">
                                                <TableHead className="w-[280px] font-semibold text-gray-700 py-4 pl-6">Nama Barang</TableHead>
                                                <TableHead className="w-[100px] font-semibold text-gray-700 text-center">Qty</TableHead>
                                                <TableHead className="w-[100px] font-semibold text-gray-700 text-center">Satuan</TableHead>
                                                <TableHead className="w-[200px] font-semibold text-gray-700">Keterangan</TableHead>
                                                <TableHead className="w-[160px] font-semibold text-gray-700 text-right">Harga (Rp)</TableHead>
                                                <TableHead className="w-[100px] font-semibold text-gray-700 text-center">Disc (%)</TableHead>
                                                <TableHead className="w-[140px] font-semibold text-gray-700 text-right">Disc (Rp)</TableHead>
                                                <TableHead className="w-[100px] font-semibold text-gray-700 text-center">PPN (%)</TableHead>
                                                <TableHead className="w-[140px] font-semibold text-gray-700 text-right">PPN (Rp)</TableHead>
                                                <TableHead className="w-[180px] font-semibold text-gray-700 text-right pr-6">Total</TableHead>
                                                <TableHead className="w-[60px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item, index) => (
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
                                                         {/* Satuan Select/Combo Enhanced */}
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
                                                            value={item.keterangan}
                                                            onChange={(e) => updateItem(item.id, "keterangan", e.target.value)}
                                                            className="h-9 bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 text-muted-foreground"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <Input 
                                                            value={item.harga_satuan ? "Rp. " + Number(item.harga_satuan).toLocaleString("id-ID") : ""}
                                                            onChange={(e) => updateItem(item.id, "harga_satuan", parseRupiah(e.target.value))}
                                                            className="h-9 text-right font-mono text-sm bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
                                                            placeholder="Rp. 0"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <Input 
                                                            value={item.diskon_persen ? (item.diskon_persen.endsWith('%') ? item.diskon_persen : item.diskon_persen + "%") : ""}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                                                updateItem(item.id, "diskon_persen", val ? val + "%" : "");
                                                            }}
                                                            className="h-9 text-center text-sm bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
                                                            placeholder="0%"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <Input 
                                                            value={item.diskon_rp ? "Rp. " + Number(item.diskon_rp).toLocaleString("id-ID") : ""}
                                                            onChange={(e) => updateItem(item.id, "diskon_rp", parseRupiah(e.target.value))}
                                                            className="h-9 text-right font-mono text-sm text-red-600 bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
                                                            placeholder="Rp. 0"
                                                        />
                                                    </TableCell>
                                                     <TableCell className="py-3">
                                                        <Input 
                                                            value={item.ppn_persen ? (String(item.ppn_persen).endsWith('%') ? item.ppn_persen : item.ppn_persen + "%") : ""}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                                                updateItem(item.id, "ppn_persen", val);
                                                            }}
                                                            className="h-9 text-center text-sm bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
                                                            placeholder="0%"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <Input 
                                                            value={item.ppn_rp ? "Rp. " + Number(item.ppn_rp).toLocaleString("id-ID") : ""}
                                                            onChange={(e) => updateItem(item.id, "ppn_rp", parseRupiah(e.target.value))}
                                                            className="h-9 text-right font-mono text-sm text-green-600 bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
                                                            placeholder="Rp. 0"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-3 pr-6 text-right font-semibold text-gray-900">
                                                        {formatRupiah(item.total)}
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
                                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                                    <Button 
                                        variant="outline" 
                                        onClick={addItem}
                                        className="w-full border-dashed border-gray-300 text-muted-foreground hover:text-primary hover:border-primary hover:bg-blue-50"
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Tambah Baris Barang
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* SUMMARY SECTION */}
                    <div className="lg:col-span-3">
                         <div className="flex flex-col lg:flex-row gap-8 justify-end">
                             <div className="w-full lg:w-1/3 space-y-4">
                                  <Card className="border shadow-lg bg-gray-900 text-white">
                                       <CardContent className="p-6 space-y-6">
                                            <div className="flex justify-between items-center text-gray-300 text-sm">
                                                <span>Subtotal</span>
                                                <span className="font-mono">{formatRupiah(items.reduce((acc, item) => acc + ((Number(item.quantity) || 0) * (Number(item.harga_satuan) || 0)), 0))}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-red-300 text-sm">
                                                <span>Total Diskon</span>
                                                <span className="font-mono">- {formatRupiah(items.reduce((acc, item) => acc + (Number(item.diskon_rp) || 0), 0))}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-green-300 text-sm">
                                                <span>Total PPN</span>
                                                <span className="font-mono">+ {formatRupiah(items.reduce((acc, item) => acc + (Number(item.ppn_rp) || 0), 0))}</span>
                                            </div>
                                            <div className="h-px bg-gray-700 my-4" />
                                            <div className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <span className="text-gray-400 text-xs uppercase tracking-wider">TOTAL BAYAR</span>
                                                    <div className="text-3xl font-bold tracking-tight text-white">
                                                         {formatRupiah(items.reduce((acc, item) => acc + (Number(item.total) || 0), 0))}
                                                    </div>
                                                </div>
                                            </div>
                                       </CardContent>
                                  </Card>

                                  <div className="flex gap-3 pt-2">
                                      <Button 
                                          variant="outline" 
                                          size="lg" 
                                          className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
                                          onClick={() => window.location.reload()}
                                      >
                                          Batal
                                      </Button>
                                      <Button 
                                          size="lg" 
                                          className="flex-1 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
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
                         </div>
                    </div>

                </div>
            </div>
        </MainLayout>
    );
}
