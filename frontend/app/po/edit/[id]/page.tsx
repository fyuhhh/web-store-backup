"use client";

import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/app/pr/input-baru/datepicker-red-weekend.css";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner"; // Use sonner for consistent toasts

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
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Tipe data (sesuaikan dengan Input Page)
interface PRItem {
    id: string; // id_PRItem
    namaBarang: string;
    jumlah: number;
    quantityAwalPR: number; // Snapshot awal saat PR dibuat
    satuan: string;
    satuanLabel: string;
    id_satuan: string;
    keterangan: string;
    status: string;
}

interface POData {
    id: string;
    noPO: string;
    tanggalPO: string;
    supplier: string;
    estimasiTanggalDiterima: string;
    status: string;
    items: any[];
}

export default function EditPOPage() {
    const params = useParams();
    const router = useRouter();
    const id_PO = params.id as string;

    const [poData, setPoData] = useState<POData | null>(null);

    // PO Form state
    const [poFormData, setPoFormData] = useState({
        noPO: "",
        tanggalPO: null as Date | null,
        supplier: "",
        estimasiTanggalDiterima: null as Date | null,
        diskon: "",
        ppn: "",
        statusPengiriman: "",
        skema: "",
        namaPembeli: "",
    });

    const [userSkema, setUserSkema] = useState("");
    const [ppnIncluded, setPpnIncluded] = useState(false);

    // State for PO items with pricing
    const [poItems, setPoItems] = useState<
        Array<{
            prId: string;
            noPR: string;
            skema: string;
            items: Array<
                PRItem & {
                    hargaSatuan: number | string;
                    jumlahPO: number;
                    jumlahAsli: number; // Total available (sisa PR + yg sudah di PO ini)
                    diskonItem: string;
                    diskonPersen?: string;
                    diskonNominal?: string;
                    ppnItem: number | "";
                    skema: string;
                    dibuatOleh: string;
                    id_satuan: string;
                    // Tambahan field untuk tracking
                    id_POItem?: string; // ID PO Item dari backend untuk referensi (tidak dipakai update direct, tapi untuk mapping)
                }
            >;
        }>
    >([]);

    // Discount breakdown state (Stores the rich breakdown items)
    const [discountBreakdown, setDiscountBreakdown] = useState<any[]>([]);

    // State options
    const [supplierOptions, setSupplierOptions] = useState<any[]>([]);
    const [supplierSearch, setSupplierSearch] = useState("");
    const [showAddSupplier, setShowAddSupplier] = useState(false);
    const [newSupplier, setNewSupplier] = useState("");
    const [editSupplierId, setEditSupplierId] = useState<string | null>(null);
    const [editSupplierValue, setEditSupplierValue] = useState("");

    const [statusPengirimanOptions, setStatusPengirimanOptions] = useState<any[]>([]);
    const [statusPengirimanSearch, setStatusPengirimanSearch] = useState("");
    const [showAddStatusPengiriman, setShowAddStatusPengiriman] = useState(false);
    const [newStatusPengiriman, setNewStatusPengiriman] = useState("");
    const [editStatusPengirimanId, setEditStatusPengirimanId] = useState<string | null>(null);
    const [editStatusPengirimanValue, setEditStatusPengirimanValue] = useState("");

    const [satuanOptions, setSatuanOptions] = useState<any[]>([]);
    const [divisiOptions, setDivisiOptions] = useState<any[]>([]);
    const [urgensiOptions, setUrgensiOptions] = useState<any[]>([]);

    const [lastDiskonChanged, setLastDiskonChanged] = useState<{
        [key: string]: "persen" | "nominal";
    }>({});

    // --- Fetch Initial Data & References ---
    useEffect(() => {
        const fetchReferences = async () => {
            const [supRes, statRes, satRes, divRes, urgRes] = await Promise.all([
                fetch("http://localhost:5000/api/supplier"),
                fetch("http://localhost:5000/api/status-pengiriman"),
                fetch("http://localhost:5000/api/satuan"),
                fetch("http://localhost:5000/api/divisi"),
                fetch("http://localhost:5000/api/urgensi"),
            ]);

            const [suppliers, statuses, satuans, divisions, urgencies] = await Promise.all([
                supRes.json(),
                statRes.json(),
                satRes.json(),
                divRes.json(),
                urgRes.json(),
            ]);

            setSupplierOptions(suppliers);
            setStatusPengirimanOptions(statuses);
            setSatuanOptions(satuans);
            setDivisiOptions(divisions);
            setUrgensiOptions(urgencies);
        };

        fetchReferences();

        // Get user schema
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        setUserSkema(userData.skema || "");
    }, []);

    // --- Fetch PO & Map Logic ---
    useEffect(() => {
        if (!id_PO || satuanOptions.length === 0) return;

        const fetchPOAndItems = async () => {
            try {
                // 1. Fetch PO Header
                const poRes = await fetch(`http://localhost:5000/api/po/${id_PO}`);
                if (!poRes.ok) throw new Error("PO not found");
                const poData = await poRes.json();
                setPoData(poData);

                // 2. Fetch All PO Items for this PO
                const poItemsRes = await fetch("http://localhost:5000/api/po-item");
                const allPoItems = await poItemsRes.json();
                const currentPoItems = allPoItems.filter(
                    (item: any) => String(item.id_PO) === String(id_PO)
                );

                // 3. Fetch All PRs & PR Items for reference (names, units, initial quantities)
                const prRes = await fetch("http://localhost:5000/api/pr");
                const prs = await prRes.json();

                // Kita butuh fetch PR items spesifik untuk update quantity "jumlahAsli"
                // Ambil semua PR Items
                const prItemsRes = await fetch("http://localhost:5000/api/pr-item");
                const allPrItems = await prItemsRes.json();

                // 4. Map Header Data
                setPoFormData({
                    noPO: poData.noPO,
                    tanggalPO: poData.tanggalPO ? new Date(poData.tanggalPO) : null,
                    supplier: String(poData.id_supplier),
                    estimasiTanggalDiterima: poData.estimasiTanggalTerima
                        ? new Date(poData.estimasiTanggalTerima)
                        : null,
                    diskon: poData.diskon ? `${poData.diskon}%` : "",
                    ppn: poData.ppn ? String(poData.ppn) : "",
                    statusPengiriman: String(poData.id_statusPengiriman),
                    skema: poData.id_skema,
                    namaPembeli: currentPoItems[0]?.namaPembeli || "", // Assuming same buyer for all items in PO
                });

                // 5. Group PO Items by PR ID to match `poItems` state structure
                // Structure: Array<{ prId, noPR, skema, items: [...] }>

                // First map backend items to rich items
                const richItems = currentPoItems.map((pItem: any) => {
                    const prItem = allPrItems.find((pi: any) => String(pi.id_PRItem) === String(pItem.id_PRItem)) || {};
                    const parentPR = prs.find((pr: any) => String(pr.id_PR) === String(prItem.id_PR)) || {};

                    // Calculate "Jumlah Asli" (Total Available if PO is reset)
                    // = Current Sisa di PR + Quantity di PO ini
                    const sisaDiPR = Number(prItem.jumlah) || 0;
                    const qtyDiPO = Number(pItem.jumlahPO) || 0;
                    const jumlahAsliTotal = sisaDiPR + qtyDiPO;

                    return {
                        prId: parentPR.id_PR,
                        noPR: parentPR.noPR,
                        skema: parentPR.id_skema,
                        // Item details
                        id: pItem.id_PRItem, // Use PR Item ID as key identifier
                        id_POItem: pItem.id_po_item,
                        namaBarang: prItem.namaBarang || pItem.namaBarang, // fallback
                        jumlahPO: qtyDiPO,
                        jumlahAsli: jumlahAsliTotal,
                        hargaSatuan: pItem.hargaSatuan,
                        diskonItem: "",
                        diskonPersen: pItem.diskonPersen ? `${pItem.diskonPersen}%` : "",
                        diskonNominal: pItem.diskonRupiah ? String(pItem.diskonRupiah) : "",
                        ppnItem: pItem.ppnPersen || "",
                        keterangan: pItem.keterangan || prItem.keterangan || "",
                        id_satuan: pItem.id_satuan || prItem.id_satuan,
                        satuanLabel: getSatuanLabel(pItem.id_satuan || prItem.id_satuan),
                        // Parent info for grouping
                        prDate: parentPR.tanggalPR,
                        dibuatOleh: parentPR.dibuatOleh,
                    };
                });

                // Group by PR
                const groupedMap = new Map();
                richItems.forEach((item: any) => {
                    if (!groupedMap.has(item.prId)) {
                        groupedMap.set(item.prId, {
                            prId: item.prId,
                            noPR: item.noPR,
                            skema: item.skema,
                            items: [],
                        });
                    }
                    groupedMap.get(item.prId).items.push(item);
                });

                setPoItems(Array.from(groupedMap.values()));

            } catch (err) {
                console.error(err);
                toast.error("Gagal memuat data PO");
            }
        };

        fetchPOAndItems();
    }, [id_PO, satuanOptions]); // Re-run if ID or options change

    // --- Helper Functions ---
    function getSatuanLabel(satuanValue: string) {
        const found = satuanOptions.find(
            (s: any) => String(s.id_satuan) === String(satuanValue)
        );
        return found ? found.satuan : satuanValue;
    }

    function highlightWeekends(date: Date) {
        const day = date.getDay();
        if (day === 0 || day === 6) return "datepicker-red";
        return undefined;
    }

    function formatDateForBackend(date: Date | string | null) {
        if (!date) return "";
        if (typeof date === "string") {
            if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
            if (date.includes("T")) return date.split("T")[0];
            return date;
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    // --- Calculation Logic (Copied from Input) ---
    const calculateTotal = () => {
        let subtotal = 0;
        let totalDiskon = 0;
        let totalPPN = 0;
        let totalPayment = 0;
        const breakdown: Array<{
            namaBarang: string;
            hargaSatuan: number;
            jumlahPO: number;
            diskonPersen: string;
            diskonNominal: string;
            ppnItem: number;
            subtotal: number;
            diskonAmount: number;
            ppnAmount: number;
            total: number;
            diskonBreakdown: Array<{ label: string; value: string; amount: number }>;
        }> = [];

        poItems.forEach((poItem) => {
            poItem.items.forEach((item) => {
                let harga = 0;
                if (typeof item.hargaSatuan === "string") {
                    const normalized = item.hargaSatuan.replace(/\./g, "").replace(",", ".");
                    harga = parseFloat(normalized) || 0;
                } else {
                    harga = Number(item.hargaSatuan) || 0;
                }
                const qty = Number(item.jumlahPO) || 0;
                const ppn = Number(item.ppnItem) || 0;
                const itemSubtotal = harga * qty;

                const diskonKey = poItem.prId + "-" + item.id;
                let diskonAmount = 0;
                let diskonBreakdownArr: Array<any> = [];

                // Determine calculation method based on last change or existing data
                // For Edit Page: if diskonPersen exists and no last change record, treat as percent
                const isPersen =
                    lastDiskonChanged[diskonKey] === "persen" ||
                    (!lastDiskonChanged[diskonKey] && item.diskonPersen && item.diskonPersen.includes("%"));

                if (isPersen) {
                    let currentAmount = itemSubtotal;
                    const diskonPersenArr = (item.diskonPersen || "")
                        .split("+")
                        .map((d) => d.trim())
                        .filter((d) => d.endsWith("%"))
                        .map((d) => {
                            const val = parseFloat(d.replace("%", "").replace(",", "."));
                            return isNaN(val) ? null : val;
                        })
                        .filter((v) => v !== null) as number[];

                    diskonPersenArr.forEach((persen, idx) => {
                        const amount = currentAmount * (persen / 100);
                        diskonAmount += amount;
                        currentAmount -= amount;
                        diskonBreakdownArr.push({
                            label: `Diskon % ke-${idx + 1}`,
                            value: persen + "%",
                            amount,
                        });
                    });
                } else {
                    // Nominal
                    diskonAmount = parseFloat(String(item.diskonNominal).replace(",", ".")) || 0;
                    if (diskonAmount > 0) {
                        diskonBreakdownArr.push({
                            label: "Diskon Rp.",
                            value: diskonAmount.toLocaleString("id-ID"),
                            amount: diskonAmount,
                        });
                    }
                }

                const afterDiskon = Math.max(0, itemSubtotal - diskonAmount);
                let ppnAmount = afterDiskon * (ppn / 100);
                let subtotalItem = afterDiskon;
                let total = 0;

                if (ppnIncluded) {
                    subtotalItem = afterDiskon;
                    total = afterDiskon;
                } else {
                    subtotalItem = afterDiskon;
                    total = afterDiskon + ppnAmount;
                }

                subtotal += subtotalItem;
                totalDiskon += diskonAmount;
                totalPPN += ppnAmount;
                totalPayment += total;

                breakdown.push({
                    namaBarang: item.namaBarang,
                    hargaSatuan: harga,
                    jumlahPO: qty,
                    diskonPersen: item.diskonPersen || "",
                    diskonNominal: item.diskonNominal || "",
                    ppnItem: ppn,
                    subtotal: subtotalItem,
                    diskonAmount,
                    ppnAmount,
                    total,
                    diskonBreakdown: diskonBreakdownArr,
                });
            });
        });

        return {
            subtotal,
            totalDiskon,
            totalPPN,
            totalPayment,
            breakdown,
        };
    };

    useEffect(() => {
        const calculations = calculateTotal();
        setDiscountBreakdown(calculations.breakdown);
    }, [poFormData.diskon, poItems, ppnIncluded]); // Add ppnIncluded dependency

    // --- Handlers ---

    // Suppliers
    const handleAddSupplier = async () => {
        if (!newSupplier.trim()) return;
        const res = await fetch("http://localhost:5000/api/supplier", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ namaSupplier: newSupplier }),
        });
        if (res.ok) {
            const data = await res.json();
            setSupplierOptions((prev) => [...prev, data]);
            setPoFormData((prev) => ({ ...prev, supplier: data.id_supplier }));
            setShowAddSupplier(false);
            setNewSupplier("");
        }
    };

    const handleEditSupplier = async (id: string) => {
        if (!editSupplierValue.trim()) return;
        try {
            const res = await fetch(`http://localhost:5000/api/supplier/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ namaSupplier: editSupplierValue }),
            });
            if (res.ok) {
                // refresh
                const ref = await fetch("http://localhost:5000/api/supplier");
                setSupplierOptions(await ref.json());
                setEditSupplierId(null);
                setEditSupplierValue("");
            }
        } catch { }
    };

    const handleDeleteSupplier = async (id: string) => {
        if (!window.confirm("Yakin ingin menghapus supplier ini?")) return;
        try {
            const res = await fetch(`http://localhost:5000/api/supplier/${id}`, { method: "DELETE" });
            if (res.ok) {
                const ref = await fetch("http://localhost:5000/api/supplier");
                setSupplierOptions(await ref.json());
            }
        } catch { }
    };

    // Status Pengiriman
    const handleAddStatusPengiriman = async () => {
        if (!newStatusPengiriman.trim()) return;
        const res = await fetch("http://localhost:5000/api/status-pengiriman", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status_pengiriman: newStatusPengiriman }),
        });
        if (res.ok) {
            const data = await res.json();
            setStatusPengirimanOptions((prev) => [...prev, data]);
            setPoFormData((prev) => ({ ...prev, statusPengiriman: data.id_statusPengiriman }));
            setShowAddStatusPengiriman(false);
            setNewStatusPengiriman("");
        }
    };

    const handleEditStatusPengiriman = async (id: string) => {
        if (!editStatusPengirimanValue.trim()) return;
        try {
            const res = await fetch(`http://localhost:5000/api/status-pengiriman/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status_pengiriman: editStatusPengirimanValue }),
            });
            if (res.ok) {
                const ref = await fetch("http://localhost:5000/api/status-pengiriman");
                setStatusPengirimanOptions(await ref.json());
                setEditStatusPengirimanId(null);
                setEditStatusPengirimanValue("");
            }
        } catch { }
    };

    const handleDeleteStatusPengiriman = async (id: string) => {
        if (!window.confirm("Yakin ingin menghapus status ini?")) return;
        try {
            const res = await fetch(`http://localhost:5000/api/status-pengiriman/${id}`, { method: "DELETE" });
            if (res.ok) {
                const ref = await fetch("http://localhost:5000/api/status-pengiriman");
                setStatusPengirimanOptions(await ref.json());
            }
        } catch { }
    };

    // Input Handlers
    function handleHargaSatuanChange(prId: string, itemId: string, value: string) {
        let cleanValue = value.replace(/^Rp\.?\s*/i, "").replace(/[^\d.,]/g, "");
        setPoItems((prev) => prev.map((pItem) =>
            pItem.prId === prId ? {
                ...pItem,
                items: pItem.items.map((i) => i.id === itemId ? { ...i, hargaSatuan: cleanValue } : i)
            } : pItem
        ));
    }

    function handleQtyChange(prId: string, itemId: string, value: string) {
        setPoItems((prev) => prev.map((pItem) =>
            pItem.prId === prId ? {
                ...pItem,
                items: pItem.items.map((i) => {
                    if (i.id === itemId) {
                        const maxQty = Number(i.jumlahAsli);
                        let newQty = Math.max(0, Math.floor(Number(value)) || 0);
                        if (newQty > maxQty) newQty = maxQty;
                        return { ...i, jumlahPO: newQty };
                    }
                    return i;
                })
            } : pItem
        ));
    }

    function handleDiskonPersenChange(prId: string, itemId: string, value: string) {
        setPoItems((prev) => prev.map((pItem) => pItem.prId === prId ? {
            ...pItem,
            items: pItem.items.map((i) => {
                if (i.id !== itemId) return i;
                let harga = 0;
                if (typeof i.hargaSatuan === "string") {
                    harga = parseFloat(i.hargaSatuan.replace(/\./g, "").replace(",", ".")) || 0;
                } else {
                    harga = Number(i.hargaSatuan) || 0;
                }
                const itemSubtotal = harga * (Number(i.jumlahPO) || 0);

                // Calculate conversion to nominal
                let diskonAmount = 0;
                let currentAmount = itemSubtotal;
                const diskonPersenArr = value.split("+").filter(d => d.trim().endsWith("%"));
                diskonPersenArr.forEach(d => {
                    const p = parseFloat(d.replace("%", "").replace(",", "."));
                    if (!isNaN(p)) {
                        const amt = currentAmount * (p / 100);
                        diskonAmount += amt;
                        currentAmount -= amt;
                    }
                });

                return {
                    ...i,
                    diskonPersen: value,
                    diskonNominal: diskonAmount ? Math.round(diskonAmount).toString() : ""
                };
            })
        } : pItem));
        setLastDiskonChanged(prev => ({ ...prev, [prId + "-" + itemId]: "persen" }));
    }

    function handleDiskonNominalChange(prId: string, itemId: string, value: string) {
        setPoItems((prev) => prev.map((pItem) => pItem.prId === prId ? {
            ...pItem,
            items: pItem.items.map((i) => {
                if (i.id !== itemId) return i;
                let harga = 0;
                if (typeof i.hargaSatuan === "string") {
                    harga = parseFloat(i.hargaSatuan.replace(/\./g, "").replace(",", ".")) || 0;
                } else {
                    harga = Number(i.hargaSatuan) || 0;
                }
                const itemSubtotal = harga * (Number(i.jumlahPO) || 0);
                const nominal = parseFloat(value.replace(",", ".")) || 0;

                let persenStr = "";
                if (itemSubtotal > 0 && nominal > 0) {
                    const p = (nominal / itemSubtotal) * 100;
                    persenStr = p % 1 === 0 ? `${p.toFixed(0)}%` : `${p.toFixed(2)}%`;
                }
                return { ...i, diskonNominal: value, diskonPersen: persenStr };
            })
        } : pItem));
        setLastDiskonChanged(prev => ({ ...prev, [prId + "-" + itemId]: "nominal" }));
    }

    function handlePPNItemChange(prId: string, itemId: string, value: string) {
        setPoItems((prev) => prev.map((pItem) => pItem.prId === prId ? {
            ...pItem,
            items: pItem.items.map((i) => i.id === itemId ? { ...i, ppnItem: value === "" ? "" : Number(value) } : i)
        } : pItem));
    }

    // --- Update Handler (RESET -> RE-INSERT) ---
    const handleUpdatePO = async () => {
        if (!poFormData.supplier || (typeof poFormData.supplier === "string" && poFormData.supplier.trim() === "")) {
            toast.error("Supplier harus diisi!");
            return;
        }
        if (!poFormData.namaPembeli.trim()) {
            toast.error("Nama Pembeli wajib diisi!");
            return;
        }
        if (poItems.length === 0) {
            toast.error("Tidak ada item untuk disimpan!");
            return;
        }

        const calculations = calculateTotal();
        const loadingToast = toast.loading("Menyimpan Perubahan PO...");

        try {
            // 1. Reset Items (Backend performs: Restore PR Qty -> Delete PO Items)
            // This ensures we start "clean" with the PRs restored to their pre-PO state
            const resetRes = await fetch(`http://localhost:5000/api/po/reset-items/${id_PO}`, {
                method: "POST",
            });
            if (!resetRes.ok) throw new Error("Gagal mereset data lama");

            // 2. Update PO Header
            function parseDiskonPersenToNumber(diskonStr: string) {
                if (!diskonStr) return 0;
                const match = diskonStr.match(/(\d+(\.\d+)?)%?/);
                return match ? parseFloat(match[1]) : 0;
            }

            await fetch(`http://localhost:5000/api/po/${id_PO}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    noPO: poFormData.noPO,
                    tanggalPO: formatDateForBackend(poFormData.tanggalPO),
                    id_supplier: poFormData.supplier,
                    diskon: parseDiskonPersenToNumber(poFormData.diskon),
                    originalDiskon: calculations.totalDiskon,
                    ppn: parseFloat(poFormData.ppn) || 0,
                    ppnAmount: calculations.totalPPN,
                    totalPembayaran: calculations.totalPayment,
                    // orderedBy: tidak perlu diupdate jika tidak berubah, atau kirim user login
                    estimasiTanggalTerima: formatDateForBackend(poFormData.estimasiTanggalDiterima),
                    id_statusPengiriman: poFormData.statusPengiriman,
                    status: "Menunggu", // Atau biarkan status lama jika ada logika lain
                }),
            });

            // 3. Re-insert PO Items (Create new PO Items -> Deduct PR Items)
            // Mirror logic from Create PO
            for (const poItem of poItems) {
                for (const item of poItem.items) {
                    const jumlahPOInt = Math.floor(Number(item.jumlahPO)) || 0;
                    const jumlahAsliInt = Math.floor(Number(item.jumlahAsli)) || 0; // This is the total avail (restored amount)

                    // Skip if quantity is 0
                    if (jumlahPOInt === 0) continue;

                    // Calculate Details
                    let diskonPersenValue = 0;
                    if (item.diskonPersen && typeof item.diskonPersen === "string") {
                        const match = item.diskonPersen.match(/(\d+(\.\d+)?)/);
                        diskonPersenValue = match ? parseFloat(match[1]) : 0;
                    }
                    const diskonRupiahValue = Number(item.diskonNominal) || 0;
                    const ppnPersenValue = Number(item.ppnItem) || 0;

                    const harga = typeof item.hargaSatuan === "string" ? parseFloat(item.hargaSatuan.replace(/\./g, "").replace(",", ".")) : Number(item.hargaSatuan);
                    const itemSubtotal = harga * jumlahPOInt;

                    // Re-calc diskon amount exact
                    let diskonAmount = 0;
                    if (item.diskonPersen && typeof item.diskonPersen === "string") {
                        let cur = itemSubtotal;
                        const arr = item.diskonPersen.split("+").filter(d => d.endsWith("%")).map(d => parseFloat(d.replace("%", "")));
                        arr.forEach(p => {
                            const amt = cur * (p / 100);
                            diskonAmount += amt;
                            cur -= amt;
                        });
                    } else {
                        diskonAmount = diskonRupiahValue;
                    }

                    const afterDiskon = Math.max(0, itemSubtotal - diskonAmount);
                    const ppnRupiahValue = afterDiskon * (ppnPersenValue / 100);
                    const totalPerItem = afterDiskon + ppnRupiahValue;

                    // A. Create PO Item
                    await fetch("http://localhost:5000/api/po-item", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            id_PO: id_PO,
                            id_PRItem: item.id, // item.id is PR Item ID
                            hargaSatuan: harga,
                            jumlahPO: jumlahPOInt,
                            jumlahAsli: jumlahAsliInt,
                            diskonPersen: diskonPersenValue,
                            diskonRupiah: diskonRupiahValue,
                            ppnPersen: ppnPersenValue,
                            ppnRupiah: ppnRupiahValue,
                            totalPerItem: totalPerItem,
                            namaPembeli: poFormData.namaPembeli,
                            keterangan: item.keterangan,
                            id_satuan: item.id_satuan,
                        }),
                    });

                    // B. Update PR Item Quantity (Deduct again)
                    // Fetch current to get generic props if needed
                    const prItemRes = await fetch(`http://localhost:5000/api/pr-item/${item.id}`);
                    const prItemData = await prItemRes.json();

                    const newJumlah = Math.max(0, jumlahAsliInt - jumlahPOInt); // Deduct new PO Qty from Total Avail

                    await fetch(`http://localhost:5000/api/pr-item/${item.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            id_PR: poItem.prId,
                            namaBarang: item.namaBarang,
                            jumlah: newJumlah,
                            originalJumlah: prItemData.originalJumlah || jumlahAsliInt,
                            quantityAwalPR: prItemData.quantityAwalPR || jumlahAsliInt,
                            id_satuan: prItemData.id_satuan || item.id_satuan,
                            keterangan: item.keterangan || "",
                        }),
                    });
                }
            }

            // Update PR Status (Sync function from Input)
            const prIds = Array.from(new Set(poItems.map((poItem) => poItem.prId)));
            for (const prId of prIds) {
                const prItemRes = await fetch(`http://localhost:5000/api/pr-item/pr/${prId}`);
                const prItems = await prItemRes.json();
                const allZero = prItems.every((item: any) => Number(item.jumlah) === 0);
                const newStatus = allZero ? "Telah Selesai" : "Gantung";

                const prRes = await fetch(`http://localhost:5000/api/pr/${prId}`);
                const prData = await prRes.json();
                await fetch(`http://localhost:5000/api/pr/${prId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        noPR: prData.noPR,
                        id_divisi: prData.id_divisi,
                        id_urgensi: prData.id_urgensi,
                        status: newStatus,
                        dibuatOleh: prData.dibuatOleh,
                        id_skema: prData.id_skema,
                        createdAt: prData.createdAt,
                    })
                });
            }

            toast.dismiss(loadingToast);
            toast.success("PO berhasil diperbarui!");
            setTimeout(() => router.push("/po/status"), 1500);

        } catch (err) {
            console.error(err);
            toast.dismiss(loadingToast);
            toast.error("Terjadi kesalahan saat menyimpan PO");
        }
    };


    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Edit PO</h1>
                        <p className="text-muted-foreground">
                            {poFormData.noPO}
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push("/po/monitoring")}
                        variant="outline"
                    >
                        Kembali
                    </Button>
                </div>

                {/* PO Form */}
                <Card className="bg-card border-border shadow-md rounded-md">
                    <CardHeader>
                        <CardTitle>Edit Purchase Order</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Row 1 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                                <div className="space-y-2">
                                    <Label>No. PO</Label>
                                    <Input value={poFormData.noPO} onChange={(e) => setPoFormData({ ...poFormData, noPO: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tanggal PO</Label>
                                    <DatePicker
                                        selected={poFormData.tanggalPO}
                                        onChange={(date) => setPoFormData({ ...poFormData, tanggalPO: date })}
                                        dateFormat="dd-MM-yyyy"
                                        className="w-full px-3 py-2 border rounded-md"
                                        customInput={
                                            <Input
                                                value={
                                                    poFormData.tanggalPO
                                                        ? dayjs(poFormData.tanggalPO).format("DD-MM-YYYY")
                                                        : ""
                                                }
                                                readOnly
                                                className="bg-white"
                                            />
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Estimasi Diterima</Label>
                                    <DatePicker
                                        selected={poFormData.estimasiTanggalDiterima}
                                        onChange={(date) => setPoFormData({ ...poFormData, estimasiTanggalDiterima: date })}
                                        dateFormat="dd-MM-yyyy"
                                        className="w-full px-3 py-2 border rounded-md"
                                        customInput={
                                            <Input
                                                value={
                                                    poFormData.estimasiTanggalDiterima
                                                        ? dayjs(poFormData.estimasiTanggalDiterima).format("DD-MM-YYYY")
                                                        : ""
                                                }
                                                readOnly
                                                className="bg-white"
                                            />
                                        }
                                    />
                                </div>
                            </div>

                            {/* Baris 2: Supplier, Status Pengiriman, Nama Pembeli */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                                {/* Supplier */}
                                <div className="space-y-2">
                                    <Label htmlFor="supplier">
                                        Supplier
                                    </Label>
                                    <Select
                                        value={String(poFormData.supplier)}
                                        onValueChange={(value) =>
                                            setPoFormData({ ...poFormData, supplier: value })
                                        }
                                    >
                                        <SelectTrigger className="border-border focus:border-primary/50 bg-white">
                                            <SelectValue placeholder="Pilih supplier" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white max-h-[384px] overflow-y-auto relative">
                                            <div className="sticky top-0 z-20 bg-white px-2 py-1 border-b border-gray-100">
                                                {showAddSupplier ? (
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Input
                                                            placeholder="Nama supplier baru"
                                                            value={newSupplier}
                                                            onChange={(e) => setNewSupplier(e.target.value)}
                                                            className="w-[140px]"
                                                            autoFocus
                                                        />
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={handleAddSupplier}
                                                            className="bg-primary text-white"
                                                        >
                                                            Simpan
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setShowAddSupplier(false);
                                                                setNewSupplier("");
                                                            }}
                                                        >
                                                            Batal
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Input
                                                            placeholder="Cari supplier..."
                                                            value={supplierSearch}
                                                            onChange={(e) => setSupplierSearch(e.target.value)}
                                                            className="mb-2"
                                                            disabled={showAddSupplier}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="mb-2 w-full"
                                                            onClick={() => setShowAddSupplier(true)}
                                                            disabled={showAddSupplier}
                                                        >
                                                            + Tambahkan Supplier
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                            {showAddSupplier
                                                ? null
                                                : (
                                                    <>
                                                        {supplierOptions.length === 0 ? (
                                                            <SelectItem value="__loading" disabled>
                                                                Memuat...
                                                            </SelectItem>
                                                        ) : (
                                                            supplierOptions
                                                                .filter((sup: any) =>
                                                                    sup.namaSupplier
                                                                        .toLowerCase()
                                                                        .includes(supplierSearch.toLowerCase())
                                                                )
                                                                .map((sup: any) => (
                                                                    <div
                                                                        key={sup.id_supplier}
                                                                        className="flex items-center gap-2 px-2 py-1 group hover:bg-gray-50"
                                                                    >
                                                                        {editSupplierId === String(sup.id_supplier) ? (
                                                                            <>
                                                                                <Input
                                                                                    value={editSupplierValue}
                                                                                    onChange={(e) =>
                                                                                        setEditSupplierValue(e.target.value)
                                                                                    }
                                                                                    className="w-[90px] h-7 text-xs"
                                                                                    disabled={showAddSupplier}
                                                                                />
                                                                                <Button
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    className="px-2 py-1 text-xs bg-primary text-white"
                                                                                    onClick={() =>
                                                                                        handleEditSupplier(String(sup.id_supplier))
                                                                                    }
                                                                                    disabled={showAddSupplier}
                                                                                >
                                                                                    Simpan
                                                                                </Button>
                                                                                <Button
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    className="px-2 py-1 text-xs"
                                                                                    onClick={() => {
                                                                                        setEditSupplierId(null);
                                                                                        setEditSupplierValue("");
                                                                                    }}
                                                                                    disabled={showAddSupplier}
                                                                                >
                                                                                    Batal
                                                                                </Button>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <SelectItem
                                                                                    key={sup.id_supplier}
                                                                                    value={String(sup.id_supplier)}
                                                                                    className="flex-1"
                                                                                    disabled={showAddSupplier}
                                                                                >
                                                                                    {sup.namaSupplier}
                                                                                </SelectItem>
                                                                                <Button
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="text-xs text-blue-600 px-1 py-0.5"
                                                                                    onClick={() => {
                                                                                        setEditSupplierId(String(sup.id_supplier));
                                                                                        setEditSupplierValue(sup.namaSupplier);
                                                                                    }}
                                                                                    disabled={showAddSupplier}
                                                                                >
                                                                                    Edit
                                                                                </Button>
                                                                                <Button
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="text-xs text-red-600 px-1 py-0.5"
                                                                                    onClick={() =>
                                                                                        handleDeleteSupplier(String(sup.id_supplier))
                                                                                    }
                                                                                    disabled={showAddSupplier}
                                                                                >
                                                                                    Hapus
                                                                                </Button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                ))
                                                        )}
                                                        {supplierOptions.length > 0 &&
                                                            supplierOptions.filter((sup: any) =>
                                                                sup.namaSupplier
                                                                    .toLowerCase()
                                                                    .includes(supplierSearch.toLowerCase())
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

                                {/* Status Pengiriman */}
                                <div className="space-y-2">
                                    <Label htmlFor="statusPengiriman">
                                        Status Pengiriman
                                    </Label>
                                    <Select
                                        value={String(poFormData.statusPengiriman)}
                                        onValueChange={(value) =>
                                            setPoFormData({
                                                ...poFormData,
                                                statusPengiriman: value,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="border-border focus:border-primary/50 bg-white">
                                            <SelectValue placeholder="Pilih status pengiriman" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white max-h-[384px] overflow-y-auto relative">
                                            <div className="sticky top-0 z-20 bg-white px-2 py-1 border-b border-gray-100">
                                                {showAddStatusPengiriman ? (
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Input
                                                            placeholder="Status pengiriman baru"
                                                            value={newStatusPengiriman}
                                                            onChange={(e) => setNewStatusPengiriman(e.target.value)}
                                                            className="w-[140px]"
                                                            autoFocus
                                                        />
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={handleAddStatusPengiriman}
                                                            className="bg-primary text-white"
                                                        >
                                                            Simpan
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setShowAddStatusPengiriman(false);
                                                                setNewStatusPengiriman("");
                                                            }}
                                                        >
                                                            Batal
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Input
                                                            placeholder="Cari status pengiriman..."
                                                            value={statusPengirimanSearch}
                                                            onChange={(e) => setStatusPengirimanSearch(e.target.value)}
                                                            className="mb-2"
                                                            disabled={showAddStatusPengiriman}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="mb-2 w-full"
                                                            onClick={() => setShowAddStatusPengiriman(true)}
                                                            disabled={showAddStatusPengiriman}
                                                        >
                                                            + Tambahkan Status Pengiriman
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                            {showAddStatusPengiriman
                                                ? null
                                                : (
                                                    <>
                                                        {statusPengirimanOptions.length === 0 ? (
                                                            <SelectItem value="__loading" disabled>
                                                                Memuat...
                                                            </SelectItem>
                                                        ) : (
                                                            statusPengirimanOptions
                                                                .filter((opt: any) =>
                                                                    opt.status_pengiriman
                                                                        .toLowerCase()
                                                                        .includes(statusPengirimanSearch.toLowerCase())
                                                                )
                                                                .map((opt: any) => (
                                                                    <div
                                                                        key={opt.id_statusPengiriman}
                                                                        className="flex items-center gap-2 px-2 py-1 group hover:bg-gray-50"
                                                                    >
                                                                        {editStatusPengirimanId === String(opt.id_statusPengiriman) ? (
                                                                            <>
                                                                                <Input
                                                                                    value={editStatusPengirimanValue}
                                                                                    onChange={(e) =>
                                                                                        setEditStatusPengirimanValue(e.target.value)
                                                                                    }
                                                                                    className="w-[90px] h-7 text-xs"
                                                                                    disabled={showAddStatusPengiriman}
                                                                                />
                                                                                <Button
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    className="px-2 py-1 text-xs bg-primary text-white"
                                                                                    onClick={() =>
                                                                                        handleEditStatusPengiriman(String(opt.id_statusPengiriman))
                                                                                    }
                                                                                    disabled={showAddStatusPengiriman}
                                                                                >
                                                                                    Simpan
                                                                                </Button>
                                                                                <Button
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    className="px-2 py-1 text-xs"
                                                                                    onClick={() => {
                                                                                        setEditStatusPengirimanId(null);
                                                                                        setEditStatusPengirimanValue("");
                                                                                    }}
                                                                                    disabled={showAddStatusPengiriman}
                                                                                >
                                                                                    Batal
                                                                                </Button>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <SelectItem
                                                                                    key={opt.id_statusPengiriman}
                                                                                    value={String(opt.id_statusPengiriman)}
                                                                                    className="flex-1"
                                                                                    disabled={showAddStatusPengiriman}
                                                                                >
                                                                                    {opt.status_pengiriman}
                                                                                </SelectItem>
                                                                                <Button
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="text-xs text-blue-600 px-1 py-0.5"
                                                                                    onClick={() => {
                                                                                        setEditStatusPengirimanId(String(opt.id_statusPengiriman));
                                                                                        setEditStatusPengirimanValue(opt.status_pengiriman);
                                                                                    }}
                                                                                    disabled={showAddStatusPengiriman}
                                                                                >
                                                                                    Edit
                                                                                </Button>
                                                                                <Button
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    className="text-xs text-red-600 px-1 py-0.5"
                                                                                    onClick={() =>
                                                                                        handleDeleteStatusPengiriman(String(opt.id_statusPengiriman))
                                                                                    }
                                                                                    disabled={showAddStatusPengiriman}
                                                                                >
                                                                                    Hapus
                                                                                </Button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                ))
                                                        )}
                                                        {statusPengirimanOptions.length > 0 &&
                                                            statusPengirimanOptions.filter((opt: any) =>
                                                                opt.status_pengiriman
                                                                    .toLowerCase()
                                                                    .includes(statusPengirimanSearch.toLowerCase())
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

                                {/* Nama Pembeli (ganti Skema) */}
                                <div className="space-y-2">
                                    <Label htmlFor="namaPembeli">
                                        Nama Pembeli
                                    </Label>
                                    <Input
                                        id="namaPembeli"
                                        value={poFormData.namaPembeli}
                                        onChange={(e) =>
                                            setPoFormData({ ...poFormData, namaPembeli: e.target.value })
                                        }
                                        placeholder="Masukkan nama pembeli"
                                        required
                                        className="border-border focus:border-primary/50 bg-white"
                                    />
                                </div>
                            </div>


                            {/* Items Table - CLONED FROM INPUT (Styled) */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Detail Barang</h3>
                                <div className="border rounded-lg overflow-x-auto">
                                    <Table className="text-xs">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="py-2 h-8">NO. PR</TableHead>
                                                <TableHead className="py-2 h-8">NAMA BARANG</TableHead>
                                                <TableHead className="py-2 h-8">KUANTITAS</TableHead>
                                                <TableHead className="py-2 h-8">SATUAN</TableHead>
                                                <TableHead className="py-2 h-8">HARGA SATUAN</TableHead>
                                                <TableHead className="py-2 h-8">DISKON (%)</TableHead>
                                                <TableHead className="py-2 h-8">DISKON (RP)</TableHead>
                                                <TableHead className="py-2 h-8">SUB (SETELAH DISKON)</TableHead>
                                                <TableHead className="py-2 h-8">PPN (%)</TableHead>
                                                <TableHead className="py-2 h-8">PPN (RP)</TableHead>
                                                <TableHead className="py-2 h-8">TOTAL PER ITEM</TableHead>
                                                <TableHead className="py-2 h-8">KETERANGAN</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {poItems.map(poItem => (
                                                <React.Fragment key={poItem.prId}>
                                                    {poItem.items.map((item) => {
                                                        const harga = typeof item.hargaSatuan === "string" ? parseFloat(item.hargaSatuan.replace(/\./g, "").replace(",", ".")) : Number(item.hargaSatuan) || 0;
                                                        const qty = Number(item.jumlahPO) || 0;
                                                        const ppn = Number(item.ppnItem) || 0;
                                                        const itemSubtotal = harga * qty;

                                                        // Logic diskon (mirror calculateTotal)
                                                        const diskonKey = item.id + (item.id_POItem || "");
                                                        let diskonAmount = 0;

                                                        // Determine calculation method based on last change or existing data
                                                        const isPersen =
                                                            lastDiskonChanged[diskonKey] === "persen" ||
                                                            (!lastDiskonChanged[diskonKey] && item.diskonPersen && item.diskonPersen.includes("%"));

                                                        if (isPersen) {
                                                            let currentAmount = itemSubtotal;
                                                            const diskonPersenArr = (item.diskonPersen || "")
                                                                .split("+")
                                                                .map((d) => d.trim())
                                                                .filter((d) => d.endsWith("%"))
                                                                .map((d) => parseFloat(d.replace("%", "").replace(",", ".")))
                                                                .filter((v) => !isNaN(v));

                                                            diskonPersenArr.forEach(p => {
                                                                const amt = currentAmount * (p / 100);
                                                                diskonAmount += amt;
                                                                currentAmount -= amt;
                                                            });
                                                        } else {
                                                            diskonAmount = parseFloat(String(item.diskonNominal || "0").replace(",", ".")) || 0;
                                                        }

                                                        const afterDiskon = Math.max(0, itemSubtotal - diskonAmount);
                                                        let ppnAmount = afterDiskon * (ppn / 100);
                                                        let subtotalItem = afterDiskon;
                                                        let total = 0;

                                                        if (ppnIncluded) {
                                                            subtotalItem = afterDiskon;
                                                            total = afterDiskon; // PPN is inside
                                                        } else {
                                                            subtotalItem = afterDiskon;
                                                            total = afterDiskon + ppnAmount;
                                                        }

                                                        const totalPerItem = subtotalItem + (ppnIncluded ? 0 : ppnAmount);

                                                        // Helper to clean and format percentage for display
                                                        const formatPersenDisplay = (val: string) => {
                                                            if (!val) return "";
                                                            return val.replace(/(\d+(\.\d+)?)/g, (match) => {
                                                                const n = parseFloat(match);
                                                                return n % 1 === 0 ? n.toFixed(0) : n.toFixed(2).replace(/\.?0+$/, "");
                                                            });
                                                        };

                                                        return (
                                                            <TableRow key={item.id}>
                                                                <TableCell className="uppercase p-1 text-xs">{poItem.noPR}</TableCell>
                                                                <TableCell className="uppercase p-1 text-xs">{item.namaBarang}</TableCell>
                                                                <TableCell className="p-1">
                                                                    <Input
                                                                        type="number"
                                                                        value={Number(item.jumlahPO) % 1 === 0 ? parseInt(String(item.jumlahPO)) : item.jumlahPO}
                                                                        max={item.jumlahAsli}
                                                                        onChange={(e) => handleQtyChange(poItem.prId, item.id, e.target.value)}
                                                                        className="w-16 h-7 text-xs px-2"
                                                                    />
                                                                    <span className="text-[10px] text-muted-foreground ml-2">Max: {item.jumlahAsli}</span>
                                                                </TableCell>
                                                                <TableCell className="uppercase p-1 text-xs">{item.satuanLabel || item.id_satuan}</TableCell>
                                                                <TableCell className="p-1">
                                                                    <Input
                                                                        type="text"
                                                                        inputMode="decimal"
                                                                        value={item.hargaSatuan ? `Rp. ${parseFloat(String(item.hargaSatuan).replace(/\./g, "").replace(",", ".")).toLocaleString("id-ID")}` : ""}
                                                                        onChange={(e) => handleHargaSatuanChange(poItem.prId, item.id, e.target.value)}
                                                                        className="w-24 h-7 text-xs text-right px-2"
                                                                        placeholder="Rp. 0"
                                                                        autoComplete="off"
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="p-1">
                                                                    <Input
                                                                        value={formatPersenDisplay(item.diskonPersen || "")}
                                                                        onChange={(e) => handleDiskonPersenChange(poItem.prId, item.id, e.target.value)}
                                                                        className="w-16 h-7 text-xs text-right px-2"
                                                                        placeholder="10%+5%"
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="p-1">
                                                                    <Input
                                                                        value={item.diskonNominal ? `Rp. ${Number(item.diskonNominal).toLocaleString("id-ID")}` : ""}
                                                                        onChange={(e) => {
                                                                            const raw = e.target.value.replace(/[^0-9]/g, "");
                                                                            handleDiskonNominalChange(poItem.prId, item.id, raw);
                                                                        }}
                                                                        className="w-20 h-7 text-xs text-right px-2"
                                                                        placeholder="Rp. 0"
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="p-1 text-xs px-2 text-right">
                                                                    Rp. {afterDiskon.toLocaleString("id-ID")}
                                                                </TableCell>
                                                                <TableCell className="p-1">
                                                                    <Input
                                                                        type="text"
                                                                        value={item.ppnItem || ""}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value.replace(/[^0-9.]/g, "");
                                                                            handlePPNItemChange(poItem.prId, item.id, val);
                                                                        }}
                                                                        className="w-12 h-7 text-xs text-right px-2"
                                                                        placeholder="0"
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="p-1 text-xs px-2 text-right">
                                                                    Rp. {ppnAmount.toLocaleString("id-ID")}
                                                                </TableCell>
                                                                <TableCell className="p-1 text-xs px-2 text-right">
                                                                    Rp. {totalPerItem.toLocaleString("id-ID")}
                                                                </TableCell>
                                                                <TableCell className="p-1 text-xs">
                                                                    <div className="text-muted-foreground max-w-xs truncate uppercase" title={item.keterangan}>
                                                                        {item.keterangan}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    })}
                                                </React.Fragment>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4">
                                <Checkbox id="ppn-included" checked={ppnIncluded} onCheckedChange={(c) => setPpnIncluded(!!c)} />
                                <Label htmlFor="ppn-included">Harga Sudah Termasuk PPN</Label>
                            </div>

                            {/* Summary */}
                            <div className="mt-4 border p-4 rounded-lg">
                                <h3 className="font-semibold mb-2">Ringkasan</h3>
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>Rp. {discountBreakdown.reduce((acc, curr) => acc + curr.subtotal, 0).toLocaleString("id-ID") || calculateTotal().subtotal.toLocaleString("id-ID")}</span>
                                </div>
                                <div className="flex justify-between text-red-500">
                                    <span>Diskon:</span>
                                    <span>- Rp. {calculateTotal().totalDiskon.toLocaleString("id-ID")}</span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                    <span>PPN:</span>
                                    <span>+ Rp. {calculateTotal().totalPPN.toLocaleString("id-ID")}</span>
                                </div>
                                <hr className="my-2" />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total:</span>
                                    <span>Rp. {calculateTotal().totalPayment.toLocaleString("id-ID")}</span>
                                </div>
                            </div>

                            <Button onClick={handleUpdatePO} className="w-full bg-primary text-white mt-4">Simpan Perubahan</Button>

                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
