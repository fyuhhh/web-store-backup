"use client";

import { MainLayout } from "@/components/layout/main-layout";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2, Clock, Package, ShoppingCart, FileText, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function DetailPesananPage() {
    const params = useParams();
    const router = useRouter();
    const noPR = decodeURIComponent(typeof params.noPR === "string" ? params.noPR : "");

    const [isLoading, setIsLoading] = useState(true);
    const [prData, setPrData] = useState<any>(null);

    // Separate separate data lists
    const [prTable, setPrTable] = useState<any[]>([]);
    const [poTable, setPoTable] = useState<any[]>([]);
    const [btbTable, setBtbTable] = useState<any[]>([]);
    const [bkbTable, setBkbTable] = useState<any[]>([]);

    const [trackingStatus, setTrackingStatus] = useState({
        PR: false,
        PO: false,
        BTB: false,
        BKB: false
    });

    const [progressWidth, setProgressWidth] = useState("0%");
    const [isAnimationDone, setIsAnimationDone] = useState(false);

    useEffect(() => {
        const runAnimation = async () => {
            // Reset state
            setProgressWidth("0%");
            setIsAnimationDone(false);

            // Initial delay before starting
            await new Promise(r => setTimeout(r, 100));

            // Determine final target width
            const targetWidth = trackingStatus.BKB ? "100%" :
                trackingStatus.BTB ? "66%" :
                    trackingStatus.PO ? "33%" : "0%";

            // Trigger animation
            setProgressWidth(targetWidth);

            // Wait for animation execution (match CSS duration)
            await new Promise(r => setTimeout(r, 1500));

            // Animation complete
            setIsAnimationDone(true);
        };

        if (!isLoading) {
            runAnimation();
        }
    }, [trackingStatus, isLoading]);

    useEffect(() => {
        if (!noPR) return;

        const fetchData = async () => {
            try {
                // Fetch all necessary data
                // Note: In a real app, this should be an optimized aggregate query
                const [
                    prRes, prItemRes, poRes, poItemRes, btbRes, btbItemRes, bkbRes, bkbItemRes,
                    supplierRes, divisiRes, userRes, satuanRes, skemaRes, statusPengirimanRes, statusPermintaanRes
                ] = await Promise.all([
                    fetch("http://192.168.10.10:5000/api/pr").then(r => r.json()),
                    fetch("http://192.168.10.10:5000/api/pr-item").then(r => r.json()),
                    fetch("http://192.168.10.10:5000/api/po").then(r => r.json()),
                    fetch("http://192.168.10.10:5000/api/po-item").then(r => r.json()),
                    fetch("http://192.168.10.10:5000/api/btb").then(r => r.json()),
                    fetch("http://192.168.10.10:5000/api/btb-item").then(r => r.json()),
                    fetch("http://192.168.10.10:5000/api/bkb").then(r => r.json()),
                    fetch("http://192.168.10.10:5000/api/bkb-item").then(r => r.json()),
                    fetch("http://192.168.10.10:5000/api/supplier").then(r => r.json()),
                    fetch("http://192.168.10.10:5000/api/divisi").then(r => r.json()),
                    fetch("http://192.168.10.10:5000/api/user").then(r => r.json()),
                    fetch("http://192.168.10.10:5000/api/satuan").then(r => r.json()),
                    fetch("http://192.168.10.10:5000/api/skema").then(r => r.json()),
                    fetch("http://192.168.10.10:5000/api/status-pengiriman").then(r => r.json()),
                    fetch("http://192.168.10.10:5000/api/status-permintaan").then(r => r.json()),
                ]);

                if (!Array.isArray(prRes)) throw new Error("Invalid PR data");

                // Helper Maps (Ensure keys are strings for safe lookup)
                const supplierMap = Object.fromEntries(supplierRes.map((s: any) => [String(s.id_supplier), s.namaSupplier]));
                // Fix: Backend returns 'divisi' field, not 'nama_divisi'
                const divisiMap = Object.fromEntries(divisiRes.map((d: any) => [String(d.id_divisi), d.divisi]));
                const userMap = Object.fromEntries(userRes.map((u: any) => [String(u.id_user), u.nama_pengguna]));
                const satuanMap = Object.fromEntries(satuanRes.map((s: any) => [String(s.id_satuan), s.satuan]));
                const skemaMap = Object.fromEntries(skemaRes.map((s: any) => [String(s.id_skema), s.skema]));
                const statusPengirimanMap = Object.fromEntries(statusPengirimanRes.map((s: any) => [String(s.id_statusPengiriman), s.status_pengiriman]));
                const statusPermintaanMap = Object.fromEntries(statusPermintaanRes.map((s: any) => [String(s.id_statusPermintaan), s.status_permintaan]));

                const poMap = Object.fromEntries(poRes.map((p: any) => [p.id_PO, p]));
                const btbMap = Object.fromEntries(btbRes.map((b: any) => [b.id_btb, b]));
                const bkbMap = Object.fromEntries(bkbRes.map((b: any) => [b.id_bkb, b]));

                // 1. Find the PR
                const foundPR = prRes.find((p: any) => p.noPR === noPR);
                if (!foundPR) {
                    setPrData(null);
                    setIsLoading(false);
                    return;
                }
                // Enrich PR with Divisi Name
                foundPR.nama_divisi = divisiMap[String(foundPR.id_divisi)] || foundPR.id_divisi;
                setPrData(foundPR);

                // 2. PR Items Table
                const relatedPrItems = Array.isArray(prItemRes)
                    ? prItemRes.filter((item: any) => item.id_PR === foundPR.id_PR)
                    : [];

                const prTableData = relatedPrItems.map((item: any) => ({
                    ...item,
                    noPR: foundPR.noPR,
                    tanggal: foundPR.tanggalPR,
                    divisi: foundPR.nama_divisi,
                    // Fix: Check multiple casing options for originalJumlah regarding backend response
                    jumlah: item.originalJumlah || item.originaljumlah || item.jumlah || 0,
                    satuanLabel: satuanMap[String(item.id_satuan)] || item.satuan || "-"
                }));
                setPrTable(prTableData);

                // 3. Find Linked PO Items (Flattened for detail view)
                const relatedPoItems = Array.isArray(poItemRes)
                    ? poItemRes.filter((pi: any) =>
                        relatedPrItems.some((pri: any) => pri.id_PRItem === pi.id_PRItem)
                    )
                    : [];

                const poTableData = relatedPoItems.map((pi: any) => {
                    const po = poMap[pi.id_PO];
                    if (!po) return null;

                    // Find related PR Item for correct Name and fallback data
                    const prItem = relatedPrItems.find((pri: any) => pri.id_PRItem === pi.id_PRItem);
                    const namaBarang = prItem?.namaBarang || "-";

                    // Robust Satuan Lookup: PO Item -> PR Item -> Raw Value
                    // Ensure keys are strings for map lookup
                    const poSatuanId = String(pi.id_satuan || "");
                    const prSatuanId = String(prItem?.id_satuan || "");
                    const satuanLabel = satuanMap[poSatuanId] || satuanMap[prSatuanId] || pi.satuan || "-";

                    // Robust Status Lookup
                    const statusPengirimanId = String(po.id_statusPengiriman || "");
                    const statusPermintaanId = String(po.id_statusPermintaan || "");

                    return {
                        ...po,
                        ...pi,
                        namaBarang,
                        supplierName: supplierMap[po.id_supplier] || po.supplier || "-",
                        orderedByName: userMap[po.orderedBy] || po.orderedBy || "-",
                        skemaLabel: skemaMap[po.id_skema] || po.id_skema || "-",
                        satuanLabel: satuanLabel,
                        statusPengiriman: statusPengirimanMap[statusPengirimanId] || po.statusPengiriman || "-",
                        statusPermintaan: statusPermintaanMap[statusPermintaanId] || po.statusPermintaan || "-",

                        // Mapping specific numeric fields (Handle 0 vs null)
                        qtyPO: pi.jumlah || pi.jumlahAsli || pi.jumlahPO || 0,
                        keterangan: pi.keterangan || prItem?.keterangan || "-",
                        hargaSatuan: Number(pi.hargaSatuan) || 0,
                        diskonPersen: pi.diskonPersen !== null && pi.diskonPersen !== undefined ? Number(pi.diskonPersen) : 0,
                        diskonRupiah: pi.diskonRupiah !== null && pi.diskonRupiah !== undefined ? Number(pi.diskonRupiah) : 0,
                        ppnPersen: pi.ppnPersen !== null && pi.ppnPersen !== undefined ? Number(pi.ppnPersen) : 0,
                        ppnRupiah: pi.ppnRupiah !== null && pi.ppnRupiah !== undefined ? Number(pi.ppnRupiah) : 0,
                        totalPerItem: Number(pi.totalPerItem) || 0,
                        grandTotal: Number(po.totalPembayaran) || 0,
                        namaPembeli: pi.namaPembeli || "-",
                        estimasiTerima: po.estimasiTanggalTerima,
                    };
                }).filter(Boolean);
                setPoTable(poTableData);

                // 4. Find Linked BTB Items
                const relatedBtbItems = Array.isArray(btbItemRes)
                    ? btbItemRes.filter((bi: any) =>
                        relatedPoItems.some((poi: any) => poi.id_POItem === bi.id_POItem)
                    )
                    : [];

                const btbTableData = relatedBtbItems.map((bi: any) => {
                    const btb = btbMap[bi.id_btb];
                    if (!btb) return null;
                    return {
                        ...bi,
                        noBTB: btb.no_btb,
                        tanggal: btb.tanggal_btb,
                        supplierName: supplierMap[btb.id_supplier] || btb.nama_supplier || "-",
                        diterimaOlehName: userMap[btb.id_user] || btb.diterima_oleh || "-",
                        satuanLabel: satuanMap[bi.id_satuan] || bi.satuanLabel || "-"
                    };
                }).filter(Boolean);
                setBtbTable(btbTableData);

                // 5. Find Linked BKB Items
                // Note: Schema usually links BKB Item to BTB Item or BTB directly. 
                // Checking bkb_item schema from context: `id_btb_item` usually exists.
                const relatedBkbItems = Array.isArray(bkbItemRes)
                    ? bkbItemRes.filter((bki: any) =>
                        relatedBtbItems.some((btbi: any) => btbi.id_btb_item === bki.id_btb_item)
                    )
                    : [];

                const bkbTableData = relatedBkbItems.map((bki: any) => {
                    const bkb = bkbMap[bki.id_bkb];
                    if (!bkb) return null;
                    return {
                        ...bki,
                        noBKB: bkb.no_bkb,
                        tanggal: bkb.tanggal_bkb,
                        dikeluarkanOlehName: userMap[bkb.dikeluarkan_oleh] || "-",
                        diterimaOlehName: bkb.diterima_oleh || "-",
                        divisiName: bkb.divisi || "-", // BKB has divisi field usually
                        satuanLabel: satuanMap[bki.id_satuan] || bki.satuanLabel || "-"
                    };
                }).filter(Boolean);
                setBkbTable(bkbTableData);

                // Update Status Tracking Flags
                setTrackingStatus({
                    PR: true,
                    PO: poTableData.length > 0,
                    BTB: btbTableData.length > 0,
                    BKB: bkbTableData.length > 0
                });

            } catch (err) {
                console.error("Error fetching detail data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [noPR]);

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-screen">
                    <p className="text-muted-foreground animate-pulse">Memuat detail pesanan...</p>
                </div>
            </MainLayout>
        );
    }

    if (!prData) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                    <h1 className="text-2xl font-bold">Pesanan Tidak Ditemukan</h1>
                    <p className="text-muted-foreground">Nomor PR "{noPR}" tidak ditemukan dalam sistem.</p>
                    <Button onClick={() => router.back()}>Kembali</Button>
                </div>
            </MainLayout>
        );
    }

    // Stepper definition
    const steps = [
        { id: "PR", label: "Permintaan (PR)", icon: FileText, active: trackingStatus.PR },
        { id: "PO", label: "Pemesanan (PO)", icon: ShoppingCart, active: trackingStatus.PO },
        { id: "BTB", label: "Penerimaan (BTB)", icon: Package, active: trackingStatus.BTB },
        { id: "BKB", label: "Pengeluaran (BKB)", icon: Truck, active: trackingStatus.BKB },
    ];

    return (
        <MainLayout>
            <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
                {/* Header Navigation */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Detail Pesanan</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-medium text-slate-500">Lacak status PR:</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                {noPR}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tracking Stepper Card */}
                <Card className="border-none shadow-lg bg-gradient-to-br from-white to-slate-50 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20"></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Status Terkini</CardTitle>
                        <CardDescription>
                            Posisi terakhir barang dalam alur
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 pb-8">
                        <div className="relative flex items-center justify-between w-full max-w-3xl mx-auto">
                            {/* Connection Lines Background */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 rounded-full z-0"></div>

                            {/* Connection Lines Active Progress */}
                            <div
                                className="absolute top-1/2 left-0 h-1 bg-blue-500 -translate-y-1/2 rounded-full z-0 transition-all duration-[1500ms] ease-in-out"
                                style={{
                                    width: progressWidth
                                }}
                            ></div>

                            {/* Steps */}
                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                // Find the last active step index
                                const latestActiveIndex = steps.map(s => s.active).lastIndexOf(true);
                                const isLatestActive = index === latestActiveIndex;

                                let statusText = "";
                                if (isLatestActive) {
                                    if (step.id === "PR") statusText = "Telah Dibuatkan PR";
                                    else if (step.id === "PO") statusText = "Telah Diorder";
                                    else if (step.id === "BTB") statusText = "Telah Diterima";
                                    else if (step.id === "BKB") statusText = "Telah Keluar dari Store";
                                }

                                return (
                                    <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                                        <div
                                            className={cn(
                                                "flex items-center justify-center w-12 h-12 rounded-full border-4 transition-all duration-500",
                                                step.active
                                                    ? "bg-blue-600 border-blue-100 text-white shadow-lg shadow-blue-500/30 scale-110"
                                                    : "bg-white border-slate-200 text-slate-400"
                                            )}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="absolute top-14 w-40 text-center flex flex-col items-center">
                                            <p className={cn(
                                                "text-sm font-semibold transition-colors duration-300",
                                                step.active ? "text-blue-700" : "text-slate-500"
                                            )}>
                                                {step.label}
                                            </p>

                                            {isLatestActive && isAnimationDone && (
                                                <div className="mt-1 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-500 ease-out fill-mode-both">
                                                    <span className="text-[11px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full shadow-md shadow-blue-200 block w-fit whitespace-nowrap">
                                                        {statusText}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Spacer for labels */}
                        <div className="h-16"></div>
                    </CardContent>
                </Card>

                {/* 1. Details Tables - PR (Permintaan) */}
                <Card className="border-none shadow-md bg-white overflow-hidden ring-1 ring-slate-900/5 transition-all hover:shadow-lg">
                    <CardHeader className="bg-slate-50/80 border-b pb-4 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-100/50 rounded-xl text-blue-600 shadow-sm ring-1 ring-blue-100">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold tracking-tight text-slate-800">Rincian Permintaan (PR)</CardTitle>
                                <CardDescription className="text-slate-500">Detail item yang diajukan dalam PR ini</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow>
                                        <TableHead className="w-[150px] text-left font-semibold text-slate-700">No. PR</TableHead>
                                        <TableHead className="w-[120px] text-left font-semibold text-slate-700">Tanggal PR</TableHead>
                                        <TableHead className="min-w-[200px] text-left font-semibold text-slate-700">Daftar Barang</TableHead>
                                        <TableHead className="w-[100px] text-left font-semibold text-slate-700">Kuantitas</TableHead>
                                        <TableHead className="w-[100px] text-left font-semibold text-slate-700">Satuan</TableHead>
                                        <TableHead className="min-w-[200px] text-left font-semibold text-slate-700">Keterangan</TableHead>
                                        <TableHead className="w-[150px] text-left font-semibold text-slate-700">Divisi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {prTable.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <FileText className="h-8 w-8 text-slate-300" />
                                                    <p>Tidak ada data PR</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        prTable.map((row, i) => (
                                            <TableRow key={i} className="hover:bg-blue-50/30 transition-colors">
                                                <TableCell className="font-bold text-slate-900">{row.noPR}</TableCell>
                                                <TableCell className="text-left font-normal text-slate-600">{dayjs(row.tanggal).format("DD-MM-YYYY")}</TableCell>
                                                <TableCell className="font-medium text-slate-800">{row.namaBarang}</TableCell>
                                                <TableCell className="text-left font-medium text-slate-900">{Number(row.jumlah)}</TableCell>
                                                <TableCell className="text-left font-normal text-slate-600">{row.satuanLabel}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={row.keterangan || "-"}>{row.keterangan || "-"}</TableCell>
                                                <TableCell><Badge variant="secondary" className="font-medium bg-slate-100 text-slate-700 hover:bg-slate-200">{row.divisi}</Badge></TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Details Tables - PO (Pemesanan) */}
                {trackingStatus.PO && (
                    <Card className="border-none shadow-md bg-white overflow-hidden ring-1 ring-slate-900/5 transition-all hover:shadow-lg">
                        <CardHeader className="bg-orange-50/50 border-b pb-4 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-orange-100/50 rounded-xl text-orange-600 shadow-sm ring-1 ring-orange-100">
                                    <ShoppingCart className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold tracking-tight text-slate-800">Rincian Pemesanan (PO)</CardTitle>
                                    <CardDescription className="text-slate-500">Dokumen PO yang dibuat berdasarkan PR ini</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow>
                                            <TableHead className="min-w-[140px] text-left font-semibold text-slate-700">No. PO</TableHead>
                                            <TableHead className="min-w-[110px] text-left font-semibold text-slate-700">Tanggal PO</TableHead>
                                            <TableHead className="min-w-[150px] text-left font-semibold text-slate-700">Supplier</TableHead>
                                            <TableHead className="min-w-[180px] text-left font-semibold text-slate-700">Daftar Barang</TableHead>
                                            <TableHead className="min-w-[100px] text-left font-semibold text-slate-700">Quantity PO</TableHead>
                                            <TableHead className="min-w-[80px] text-left font-semibold text-slate-700">Satuan</TableHead>
                                            <TableHead className="min-w-[150px] text-left font-semibold text-slate-700">Keterangan</TableHead>
                                            <TableHead className="min-w-[120px] text-left font-semibold text-slate-700">Harga Satuan</TableHead>
                                            <TableHead className="min-w-[100px] text-left font-semibold text-slate-700">Diskon (%)</TableHead>
                                            <TableHead className="min-w-[120px] text-left font-semibold text-slate-700">Diskon (Rp)</TableHead>
                                            <TableHead className="min-w-[100px] text-left font-semibold text-slate-700">PPN (%)</TableHead>
                                            <TableHead className="min-w-[120px] text-left font-semibold text-slate-700">PPN (Rp)</TableHead>
                                            <TableHead className="min-w-[130px] text-left font-bold text-slate-800">Total</TableHead>
                                            <TableHead className="min-w-[140px] text-left font-bold bg-slate-50/80 text-slate-900">Grand Total</TableHead>
                                            <TableHead className="min-w-[120px] text-left font-semibold text-slate-700">Ordered By</TableHead>
                                            <TableHead className="min-w-[120px] text-left font-semibold text-slate-700">Nama Pembeli</TableHead>
                                            <TableHead className="min-w-[120px] text-left font-semibold text-slate-700">Estimasi Diterima</TableHead>
                                            <TableHead className="min-w-[140px] text-left font-semibold text-slate-700">Status Pengiriman</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {poTable.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={18} className="text-center py-12 text-muted-foreground">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <ShoppingCart className="h-8 w-8 text-slate-300" />
                                                        <p>Tidak ada data PO</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            poTable.map((row, i) => (
                                                <TableRow key={i} className="hover:bg-orange-50/30 transition-colors">
                                                    <TableCell className="font-bold text-slate-900">{row.noPO}</TableCell>
                                                    <TableCell className="text-left font-normal text-slate-600">{dayjs(row.tanggalPO).format("DD-MM-YYYY")}</TableCell>
                                                    <TableCell className="font-normal text-slate-700">{row.supplierName}</TableCell>
                                                    <TableCell className="font-medium text-slate-800">{row.namaBarang}</TableCell>
                                                    <TableCell className="text-left font-medium text-slate-900">{Number(row.qtyPO)}</TableCell>
                                                    <TableCell className="text-left font-normal text-slate-600">{row.satuanLabel}</TableCell>
                                                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={row.keterangan}>{row.keterangan}</TableCell>
                                                    <TableCell className="text-left font-normal text-slate-700">{row.hargaSatuan !== undefined ? `Rp ${Number(row.hargaSatuan).toLocaleString('id-ID')}` : "-"}</TableCell>
                                                    <TableCell className="text-left font-normal text-slate-600">{row.diskonPersen !== undefined ? `${row.diskonPersen}%` : "-"}</TableCell>
                                                    <TableCell className="text-left font-normal text-slate-600">{row.diskonRupiah !== undefined ? `Rp ${Number(row.diskonRupiah).toLocaleString('id-ID')}` : "-"}</TableCell>
                                                    <TableCell className="text-left font-normal text-slate-600">{row.ppnPersen !== undefined ? `${row.ppnPersen}%` : "-"}</TableCell>
                                                    <TableCell className="text-left font-normal text-slate-600">{row.ppnRupiah !== undefined ? `Rp ${Number(row.ppnRupiah).toLocaleString('id-ID')}` : "-"}</TableCell>
                                                    <TableCell className="text-left font-semibold text-blue-700">{row.totalPerItem !== undefined ? `Rp ${Number(row.totalPerItem).toLocaleString('id-ID')}` : "-"}</TableCell>
                                                    <TableCell className="text-left font-bold bg-slate-50/50 text-slate-900">{row.grandTotal !== undefined ? `Rp ${Number(row.grandTotal).toLocaleString('id-ID')}` : "-"}</TableCell>
                                                    <TableCell className="text-muted-foreground font-normal">{row.orderedByName}</TableCell>
                                                    <TableCell className="text-muted-foreground font-normal">{row.namaPembeli}</TableCell>
                                                    <TableCell className="text-left font-normal text-slate-600">{row.estimasiTerima ? dayjs(row.estimasiTerima).format("DD-MM-YYYY") : "-"}</TableCell>
                                                    <TableCell className="text-left">
                                                        {row.statusPengiriman && row.statusPengiriman !== "-" ? (
                                                            <Badge variant="outline" className={cn(
                                                                "whitespace-nowrap font-medium px-2.5 py-0.5 rounded-full border",
                                                                row.statusPengiriman.toLowerCase().includes("terima")
                                                                    ? "border-green-200 text-green-700 bg-green-50 shadow-sm"
                                                                    : row.statusPengiriman.toLowerCase().includes("proses") || row.statusPengiriman.toLowerCase().includes("kirim")
                                                                        ? "border-blue-200 text-blue-700 bg-blue-50 shadow-sm"
                                                                        : "border-slate-200 text-slate-600 bg-slate-50"
                                                            )}>
                                                                {row.statusPengiriman}
                                                            </Badge>
                                                        ) : <span className="text-muted-foreground text-sm">-</span>}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 3. Details Tables - BTB (Penerimaan) */}
                {trackingStatus.BTB && (
                    <Card className="border-none shadow-md bg-white overflow-hidden ring-1 ring-slate-900/5 transition-all hover:shadow-lg">
                        <CardHeader className="bg-blue-50/50 border-b pb-4 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-100/50 rounded-xl text-blue-600 shadow-sm ring-1 ring-blue-100">
                                    <Package className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold tracking-tight text-slate-800">Rincian Penerimaan (BTB)</CardTitle>
                                    <CardDescription className="text-slate-500">Barang yang telah diterima gudang (BTB)</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow>
                                            <TableHead className="w-[150px] text-left font-semibold text-slate-700">No. BTB</TableHead>
                                            <TableHead className="w-[120px] text-left font-semibold text-slate-700">Tanggal BTB</TableHead>
                                            <TableHead className="min-w-[200px] text-left font-semibold text-slate-700">Nama Supplier</TableHead>
                                            <TableHead className="min-w-[200px] text-left font-semibold text-slate-700">Nama Barang</TableHead>
                                            <TableHead className="w-[100px] text-left font-semibold text-slate-700">Qty Awal</TableHead>
                                            <TableHead className="w-[100px] text-left font-semibold text-slate-700">Satuan</TableHead>
                                            <TableHead className="min-w-[150px] text-left font-semibold text-slate-700">Keterangan</TableHead>
                                            <TableHead className="w-[120px] text-left font-semibold text-slate-700">Biaya</TableHead>
                                            <TableHead className="w-[150px] text-left font-semibold text-slate-700">Diterima Oleh</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {btbTable.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <Package className="h-8 w-8 text-slate-300" />
                                                        <p>Tidak ada data BTB</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            btbTable.map((row, i) => (
                                                <TableRow key={i} className="hover:bg-blue-50/30 transition-colors">
                                                    <TableCell className="font-bold text-slate-900">{row.noBTB}</TableCell>
                                                    <TableCell className="text-left font-normal text-slate-600">{dayjs(row.tanggal).format("DD-MM-YYYY")}</TableCell>
                                                    <TableCell className="font-normal text-slate-700">{row.supplierName}</TableCell>
                                                    <TableCell className="font-medium text-slate-800">{row.nama_barang}</TableCell>
                                                    <TableCell className="text-left font-medium text-slate-900">{Number(row.jumlah_diterima)}</TableCell>
                                                    <TableCell className="text-left font-normal text-slate-600">{row.satuanLabel}</TableCell>
                                                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={row.keterangan}>{row.keterangan || "-"}</TableCell>
                                                    <TableCell className="text-left font-normal text-slate-700">{row.biaya ? `Rp ${Number(row.biaya).toLocaleString('id-ID')}` : "-"}</TableCell>
                                                    <TableCell className="text-muted-foreground font-normal">{row.diterimaOlehName}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 4. Details Tables - BKB (Pengeluaran) */}
                {trackingStatus.BKB && (
                    <Card className="border-none shadow-md bg-white overflow-hidden ring-1 ring-slate-900/5 transition-all hover:shadow-lg">
                        <CardHeader className="bg-green-50/50 border-b pb-4 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-green-100/50 rounded-xl text-green-600 shadow-sm ring-1 ring-green-100">
                                    <Truck className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold tracking-tight text-slate-800">Rincian Pengeluaran (BKB)</CardTitle>
                                    <CardDescription className="text-slate-500">Barang yang telah dikeluarkan (BKB)</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow>
                                            <TableHead className="w-[150px] text-left font-semibold text-slate-700">No. BKB</TableHead>
                                            <TableHead className="w-[120px] text-left font-semibold text-slate-700">Tanggal BKB</TableHead>
                                            <TableHead className="min-w-[200px] text-left font-semibold text-slate-700">Nama Barang</TableHead>
                                            <TableHead className="w-[100px] text-left font-semibold text-slate-700">Quantity</TableHead>
                                            <TableHead className="w-[100px] text-left font-semibold text-slate-700">Satuan</TableHead>
                                            <TableHead className="min-w-[150px] text-left font-semibold text-slate-700">Keterangan</TableHead>
                                            <TableHead className="w-[150px] text-left font-semibold text-slate-700">Dikeluarkan Oleh</TableHead>
                                            <TableHead className="w-[150px] text-left font-semibold text-slate-700">Diterima Oleh</TableHead>
                                            <TableHead className="w-[150px] text-left font-semibold text-slate-700">Divisi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bkbTable.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <Truck className="h-8 w-8 text-slate-300" />
                                                        <p>Tidak ada data BKB</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            bkbTable.map((row, i) => (
                                                <TableRow key={i} className="hover:bg-green-50/30 transition-colors">
                                                    <TableCell className="font-bold text-slate-900">{row.noBKB}</TableCell>
                                                    <TableCell className="text-left font-normal text-slate-600">{dayjs(row.tanggalBKB).format("DD-MM-YYYY")}</TableCell>
                                                    <TableCell className="font-medium text-slate-800">{row.nama_barang}</TableCell>
                                                    <TableCell className="text-left font-medium text-slate-900">{Number(row.jumlah_keluar)}</TableCell>
                                                    <TableCell className="text-left font-normal text-slate-600">{row.satuanLabel}</TableCell>
                                                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={row.keterangan}>{row.keterangan || "-"}</TableCell>
                                                    <TableCell className="text-muted-foreground font-normal">{row.dikeluarkanOlehName}</TableCell>
                                                    <TableCell className="text-muted-foreground font-normal">{row.diterimaOlehName}</TableCell>
                                                    <TableCell><Badge variant="outline" className="font-medium bg-slate-50 text-slate-600 border-slate-200">{row.divisiName}</Badge></TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainLayout>
    );
}
