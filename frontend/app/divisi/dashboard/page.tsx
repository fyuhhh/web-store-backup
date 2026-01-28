"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, CheckCircle2, Clock, ArrowRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";

export default function DivisiDashboardPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false); // Animation trigger state
    const [stats, setStats] = useState({ total: 0, selesai: 0, proses: 0 });
    const [recentParams, setRecentParams] = useState<any[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [userName, setUserName] = useState("");
    const [userDivisiId, setUserDivisiId] = useState<string | null>(null);
    const [userDivisiName, setUserDivisiName] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");

    // --- ANIMATION STATES ---
    const [displayTotal, setDisplayTotal] = useState(0);
    const [displayProses, setDisplayProses] = useState(0);
    const [displaySelesai, setDisplaySelesai] = useState(0);

    // Helper easing
    function easeOutExpo(x: number) {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }

    // Animate Total
    useEffect(() => {
        let raf: number;
        let start: number | null = null;
        let from = 0;
        let to = stats.total;
        let duration = 1000; // 1s duration

        function animate(ts: number) {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const value = Math.floor(from + (to - from) * easeOutExpo(progress));
            setDisplayTotal(value);
            if (progress < 1) {
                raf = requestAnimationFrame(animate);
            } else {
                setDisplayTotal(to);
            }
        }
        setDisplayTotal(0);
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [stats.total]);

    // Animate Proses
    useEffect(() => {
        let raf: number;
        let start: number | null = null;
        let from = 0;
        let to = stats.proses;
        let duration = 1000;

        function animate(ts: number) {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const value = Math.floor(from + (to - from) * easeOutExpo(progress));
            setDisplayProses(value);
            if (progress < 1) {
                raf = requestAnimationFrame(animate);
            } else {
                setDisplayProses(to);
            }
        }
        setDisplayProses(0);
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [stats.proses]);

    // Animate Selesai
    useEffect(() => {
        let raf: number;
        let start: number | null = null;
        let from = 0;
        let to = stats.selesai;
        let duration = 1000;

        function animate(ts: number) {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const value = Math.floor(from + (to - from) * easeOutExpo(progress));
            setDisplaySelesai(value);
            if (progress < 1) {
                raf = requestAnimationFrame(animate);
            } else {
                setDisplaySelesai(to);
            }
        }
        setDisplaySelesai(0);
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [stats.selesai]);

    // Clock Effect
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Data Fetching Effect
    useEffect(() => {
        setIsMounted(true); // Trigger animation on mount
        const load = async () => {
            try {
                const storedUser = localStorage.getItem("userData") || localStorage.getItem("user");
                let myDivisiId = "";
                let mySkemaId = ""; // New: Schema ID
                let debugSource = "None";

                if (storedUser) {
                    try {
                        const u = JSON.parse(storedUser);
                        myDivisiId = String(u.id_divisi || "");
                        mySkemaId = String(u.id_skema || ""); // Get from LS
                        setUserName(u.nama_pengguna || u.username || "User");
                        debugSource = "LocalStorage";

                        // FETCH CHECKS - Authoritative
                        const userId = u.id || u.id_user;
                        if (userId) {
                            try {
                                const uRes = await fetch(`${API_BASE_URL}/api/user/${userId}`);
                                const uData = await uRes.json();
                                if (uData) {
                                    if (uData.id_divisi) {
                                        myDivisiId = String(uData.id_divisi);
                                        setUserDivisiId(myDivisiId);
                                    }
                                    if (uData.id_skema) {
                                        mySkemaId = String(uData.id_skema); // Get from API
                                    }
                                    debugSource = "Backend API";
                                }
                            } catch (err) {
                                console.error("Failed to fetch fresh user:", err);
                            }
                        }
                    } catch (e) {
                        console.error("Error parsing user data", e);
                    }
                }

                console.log("Dashboard Divisi Filter - Source:", debugSource, "DivisiID:", myDivisiId, "SkemaID:", mySkemaId);

                // DATA FETCHING
                const [
                    prRes, prItemRes,
                    poItemRes,
                    btbItemRes,
                    bkbItemRes,
                    divisiRes
                ] = await Promise.all([
                    fetch(API_BASE_URL + "/api/pr").then(r => r.json()),
                    fetch(API_BASE_URL + "/api/pr-item").then(r => r.json()),
                    fetch(API_BASE_URL + "/api/po-item").then(r => r.json()),
                    fetch(API_BASE_URL + "/api/btb-item").then(r => r.json()),
                    fetch(API_BASE_URL + "/api/bkb-item").then(r => r.json()),
                    fetch(API_BASE_URL + "/api/divisi").then(r => r.json())
                ]);

                // Get Division Name
                if (Array.isArray(divisiRes) && myDivisiId) {
                    const div = divisiRes.find((d: any) => String(d.id_divisi) === myDivisiId);
                    if (div) setUserDivisiName(div.divisi);
                }

                // Filter PRs by Division AND Schema (if present) - STRICT
                const myPrs = Array.isArray(prRes)
                    ? (myDivisiId
                        ? prRes.filter((p: any) => {
                            const divisionMatch = String(p.id_divisi) === myDivisiId;
                            // Jika user punya skema, HARUS match skema. Jika tidak, abaikan filter skema.
                            const schemaMatch = mySkemaId ? String(p.id_skema) === mySkemaId : true;
                            return divisionMatch && schemaMatch;
                        })
                        : [])
                    : [];

                // Helper Map: Fulfilled Quantity by PR Item (via BKB)
                const fulfilledQtyByPrItem: Record<string, number> = {};

                if (Array.isArray(bkbItemRes)) {
                    bkbItemRes.forEach((bkbi: any) => {
                        // BKB Item -> BTB Item
                        const btbi = Array.isArray(btbItemRes) ? btbItemRes.find((x: any) => x.id_btb_item === bkbi.id_btb_item) : null;
                        if (!btbi) return;

                        // BTB Item -> PO Item
                        const poi = Array.isArray(poItemRes) ? poItemRes.find((x: any) => x.id_POItem === btbi.id_POItem) : null;
                        if (!poi) return;

                        // PO Item -> PR Item
                        if (poi.id_PRItem) {
                            fulfilledQtyByPrItem[String(poi.id_PRItem)] = (fulfilledQtyByPrItem[String(poi.id_PRItem)] || 0) + Number(bkbi.jumlah_keluar || 0);
                        }
                    });
                }

                let completedCount = 0;

                const richPrs = myPrs.map((pr: any) => {
                    const items = Array.isArray(prItemRes)
                        ? prItemRes.filter((pi: any) => pi.id_PR === pr.id_PR)
                        : [];

                    if (items.length === 0) return { ...pr, isComplete: false, itemCount: 0 };

                    const isComplete = items.every((item: any) => {
                        const needed = Number(item.originalJumlah || item.jumlah || 0);
                        const fulfilled = fulfilledQtyByPrItem[String(item.id_PRItem)] || 0;
                        return fulfilled >= needed && needed > 0;
                    });

                    if (isComplete) completedCount++;

                    return {
                        ...pr,
                        isComplete,
                        itemCount: items.length,
                        firstItemName: items.length > 0 ? items[0].namaBarang : "-"
                    };
                });

                // Sort by Date Descending
                const sorted = richPrs.sort((a: any, b: any) => new Date(b.tanggalPR).getTime() - new Date(a.tanggalPR).getTime());

                setStats({
                    total: myPrs.length,
                    selesai: completedCount,
                    proses: myPrs.length - completedCount
                });
                setRecentParams(sorted.slice(0, 8)); // Top 8

            } catch (e) {
                console.error("Dashboard load error:", e);
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, []);

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                    <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-muted-foreground text-sm">Memuat dashboard...</p>
                    </div>
                </div>
            </MainLayout>
        )
    }

    const filteredRecent = recentParams.filter(pr =>
        pr.noPR.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pr.isComplete ? "selesai" : "proses").includes(searchTerm.toLowerCase())
    );

    return (
        <MainLayout>
            <div className={`flex flex-col gap-4 max-w-7xl mx-auto pb-6 px-4 sm:px-6 h-full transition-all duration-700 ease-out ${isMounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"}`}>

                {/* Hero Section with Clock */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white shadow-xl shrink-0">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10">
                        {/* Decorative Patterns */}
                        <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500 blur-3xl"></div>
                        <div className="absolute bottom-[-50%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500 blur-3xl"></div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center justify-center py-10 text-center">
                        <Badge variant="outline" className="mb-3 text-blue-200 border-blue-400/30 bg-blue-900/30 px-4 py-1">
                            {userDivisiName ? `Divisi ${userDivisiName}` : 'Dashboard Monitoring'}
                        </Badge>
                        <h1 className="text-6xl font-bold tracking-tighter tabular-nums mb-1">
                            {dayjs(currentTime).format("HH:mm")}
                            <span className="text-3xl text-blue-300 ml-2 animate-pulse">:</span>
                            <span className="text-3xl text-blue-300 tabular-nums">
                                {dayjs(currentTime).format("ss")}
                            </span>
                        </h1>
                        <p className="text-lg text-blue-100 font-medium">
                            {dayjs(currentTime).locale("id").format("dddd, D MMMM YYYY")}
                        </p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3 shrink-0">
                    <Card className="group relative overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FileText className="h-20 w-20 text-blue-600" />
                        </div>
                        <CardHeader className="pb-1 pt-4 px-4">
                            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Pesanan</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-slate-800 tabular-nums">
                                    {displayTotal}
                                </span>
                                <span className="text-xs text-slate-500">Permintaan</span>
                            </div>
                            <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-full rounded-full"></div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group relative overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Clock className="h-20 w-20 text-orange-600" />
                        </div>
                        <CardHeader className="pb-1 pt-4 px-4">
                            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dalam Proses</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-slate-800 tabular-nums">
                                    {displayProses}
                                </span>
                                <span className="text-xs text-slate-500">Sedang Berjalan</span>
                            </div>
                            <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full" style={{ width: stats.total ? `${(stats.proses / stats.total) * 100}%` : '0%' }}></div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group relative overflow-hidden border-none shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CheckCircle2 className="h-20 w-20 text-green-600" />
                        </div>
                        <CardHeader className="pb-1 pt-4 px-4">
                            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Selesai</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-slate-800 tabular-nums">
                                    {displaySelesai}
                                </span>
                                <span className="text-xs text-slate-500">Terselesaikan</span>
                            </div>
                            <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: stats.total ? `${(stats.selesai / stats.total) * 100}%` : '0%' }}></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>


                {/* Recent Activity Table */}
                <Card className="shadow-md border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between bg-slate-100 border-b py-4">
                        <div className="flex flex-col gap-1">
                            <CardTitle className="text-lg font-bold text-slate-800">Aktivitas Terkini</CardTitle>
                            <CardDescription className="text-xs">Daftar permintaan barang terbaru dari divisi Anda</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari No. PR atau Status..."
                                    className="h-9 w-[250px] rounded-full border border-slate-200 bg-white pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="sm" onClick={() => router.push('/divisi/pesanan-anda')} className="rounded-full">
                                Lihat Semua <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>

                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">No. PR</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Jumlah Item</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRecent.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                            {searchTerm ? "Tidak ditemukan pesanan yang cocok." : "Belum ada aktivitas pesanan."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRecent.map((pr: any) => (
                                        <TableRow key={pr.id_PR} className="hover:bg-slate-50/80 cursor-pointer transition-colors" onClick={() => router.push(`/divisi/pesanan-anda/${encodeURIComponent(pr.noPR)}`)}>
                                            <TableCell className="font-medium text-blue-600">{pr.noPR}</TableCell>
                                            <TableCell>{dayjs(pr.tanggalPR).format("DD MMM YYYY")}</TableCell>
                                            <TableCell className="font-medium text-slate-700 max-w-[200px] truncate" title={pr.firstItemName}>
                                                {pr.firstItemName}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal bg-slate-100 text-slate-600">
                                                    {pr.itemCount} Barang
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    pr.isComplete
                                                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 shadow-none"
                                                        : "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 shadow-none"
                                                }>
                                                    {pr.isComplete ? "Selesai" : "Proses"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                                    <Search className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
