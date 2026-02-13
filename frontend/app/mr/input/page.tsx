
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

export default function InputMRPage() {
    const [loading, setLoading] = useState(false);
    const [notif, setNotif] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Header State
    const [noMR, setNoMR] = useState("");
    const [tanggalMR, setTanggalMR] = useState<Date | null>(new Date());
    const [idDivisi, setIdDivisi] = useState("");
    const [divisiOptions, setDivisiOptions] = useState<any[]>([]);

    // Supplier State
    const [supplierId, setSupplierId] = useState("");
    const [supplierOptions, setSupplierOptions] = useState<any[]>([]);
    const [supplierSearch, setSupplierSearch] = useState("");
    const [showAddSupplier, setShowAddSupplier] = useState(false);
    const [newSupplier, setNewSupplier] = useState("");
    const [editSupplierId, setEditSupplierId] = useState<string | null>(null);
    const [editSupplierValue, setEditSupplierValue] = useState("");

    const [tanggalPembelian, setTanggalPembelian] = useState<Date | null>(new Date());

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

    // Calculations
    const calculateItemTotal = (item: MRItem): number => {
        const qty = Number(item.quantity) || 0;
        const harga = Number(item.harga_satuan) || 0;
        let subtotal = qty * harga;

        // Diskon
        let diskonVal = 0;
        if (item.diskon_rp) {
            diskonVal = Number(item.diskon_rp);
        } else if (item.diskon_persen) {
            const persen = parseFloat(item.diskon_persen.replace("%", "")) || 0;
            diskonVal = subtotal * (persen / 100);
        }
        subtotal -= diskonVal;

        // PPN
        let ppnVal = 0;
        if (item.ppn_rp) {
            ppnVal = Number(item.ppn_rp);
        } else if (item.ppn_persen) {
            const persen = Number(item.ppn_persen) || 0;
            ppnVal = subtotal * (persen / 100);
        }

        return subtotal + ppnVal;
    };

    // Update item field
    const updateItem = (id: string, field: keyof MRItem, value: any) => {
        setItems((prev) =>
            prev.map((item) => {
                if (item.id === id) {
                    const updated = { ...item, [field]: value };
                    // Auto-calc PPN RP if Persen changes, or Diskon RP if Persen changes?
                    // For simplicity, we just recalculate Total.
                    // If user edits PPN %, we could auto-fill PPN Rp, but let's keep it simple:
                    // We'll calculate TOTAL on render/save, but let's update local total for display
                    updated.total = calculateItemTotal(updated);
                    return updated;
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
                        <div className="space-y-4">
                            {/* Row 1: No MR, Tanggal MR, Supplier */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>No. MR</Label>
                                    <Input value={noMR} onChange={(e) => setNoMR(e.target.value)} placeholder="MR/..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tanggal MR</Label>
                                    <div>
                                        <DatePicker
                                            selected={tanggalMR}
                                            onChange={(date) => setTanggalMR(date)}
                                            dateFormat="dd-MM-yyyy"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
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
                            </div>

                            {/* Row 2: Divisi, Tanggal Pembelian */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Divisi</Label>
                                    <Select value={idDivisi} onValueChange={setIdDivisi}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Divisi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {divisiOptions.map((d) => (
                                                <SelectItem key={d.id_divisi} value={String(d.id_divisi)}>
                                                    {d.divisi}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tanggal Pembelian</Label>
                                    <div>
                                        <DatePicker
                                            selected={tanggalPembelian}
                                            onChange={(date) => setTanggalPembelian(date)}
                                            dateFormat="dd-MM-yyyy"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                                {/* Empty column for spacing */}
                                <div className="hidden md:block"></div>
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
                                        <TableHead className="min-w-[120px]">Harga (Rp)</TableHead>
                                        <TableHead className="w-[80px]">Disc %</TableHead>
                                        <TableHead className="w-[100px]">Disc Rp</TableHead>
                                        <TableHead className="w-[80px]">PPN %</TableHead>
                                        <TableHead className="w-[100px]">PPN Rp</TableHead>
                                        <TableHead className="min-w-[120px]">Total</TableHead>
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
                                                <Input
                                                    value={item.satuan}
                                                    onChange={(e) => updateItem(item.id, "satuan", e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={item.keterangan}
                                                    onChange={(e) => updateItem(item.id, "keterangan", e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={item.harga_satuan}
                                                    onChange={(e) => updateItem(item.id, "harga_satuan", e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={item.diskon_persen}
                                                    onChange={(e) => updateItem(item.id, "diskon_persen", e.target.value)}
                                                    placeholder="0%"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={item.diskon_rp}
                                                    onChange={(e) => updateItem(item.id, "diskon_rp", e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={item.ppn_persen}
                                                    onChange={(e) => updateItem(item.id, "ppn_persen", e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={item.ppn_rp}
                                                    onChange={(e) => updateItem(item.id, "ppn_rp", e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-semibold">
                                                    {item.total.toLocaleString('id-ID')}
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

                {/* Footer Actions */}
                <div className="flex justify-end">
                    <Button size="lg" onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90">
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? "Menyimpan..." : "Simpan MR"}
                    </Button>
                </div>

            </div>
        </MainLayout>
    );
}
