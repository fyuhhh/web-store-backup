"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, CheckCircle2, Clock, ArrowRight, Search, Sparkles, Activity, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function DivisiDashboardPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false); // Animation trigger state
    const [stats, setStats] = useState({ total: 0, selesai: 0, proses: 0 });
    const [recentParams, setRecentParams] = useState<any[]>([]);
    const [chartStatData, setChartStatData] = useState<any[]>([]);
    const [trendData, setTrendData] = useState<any[]>([]);
    
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
                
                // Chart Data generation
                const trendMap: Record<string, number> = {};
                for (let i = 5; i >= 0; i--) {
                    const monthStr = dayjs().subtract(i, 'month').format('MMM YY');
                    trendMap[monthStr] = 0;
                }
                richPrs.forEach((pr: any) => {
                    const monthStr = dayjs(pr.tanggalPR).format('MMM YY');
                    if (trendMap[monthStr] !== undefined) {
                        trendMap[monthStr]++;
                    }
                });

                const calculatedTrendData = Object.keys(trendMap).map(key => ({
                    name: key,
                    jumlah: trendMap[key]
                }));

                setTrendData(calculatedTrendData);
                
                const currentProsesCount = myPrs.length - completedCount;
                setChartStatData([
                    { name: 'Selesai', value: completedCount, color: '#10B981' },
                    { name: 'Dalam Proses', value: currentProsesCount, color: '#F97316' },
                ]);

                // Sort by Date Descending for Recent table
                const sorted = richPrs.sort((a: any, b: any) => new Date(b.tanggalPR).getTime() - new Date(a.tanggalPR).getTime());

                setStats({
                    total: myPrs.length,
                    selesai: completedCount,
                    proses: currentProsesCount
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

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 10) return "Selamat Pagi";
        if (hour < 15) return "Selamat Siang";
        if (hour < 18) return "Selamat Sore";
        return "Selamat Malam";
    };

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
            <div className={`flex flex-col gap-6 max-w-7xl mx-auto pb-8 px-4 sm:px-6 min-h-full transition-all duration-700 ease-out ${isMounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"}`}>

                {/* Hero Section with Clock */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-950 text-white shadow-xl shrink-0 mt-2">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                        {/* Decorative Patterns */}
                        <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-400 blur-[100px]"></div>
                        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-500 blur-[100px]"></div>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-10">
                        <div className="text-center md:text-left mb-6 md:mb-0">
                            <Badge variant="outline" className="mb-4 text-blue-200 border-blue-400/30 bg-blue-900/40 px-3 py-1 backdrop-blur-md">
                                <Sparkles className="w-3.5 h-3.5 mr-2 text-yellow-300" />
                                Divisi {userDivisiName || 'Monitoring'}
                            </Badge>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
                                {getGreeting()}, {userName.split(' ')[0] || 'User'}! 👋
                            </h1>
                            <p className="text-blue-100 text-sm md:text-base max-w-md leading-relaxed opacity-90">
                                Berikut adalah ringkasan aktivitas pengadaan dan permintaan barang dari divisi Anda hari ini.
                            </p>
                        </div>
                        
                        <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-inner min-w-[200px]">
                            <h2 className="text-5xl font-bold tracking-tighter tabular-nums mb-1 flex items-center justify-center">
                                {dayjs(currentTime).format("HH:mm")}
                                <span className="text-2xl text-blue-300 mx-1 flex flex-col justify-center gap-1.5 h-8 opacity-70 animate-pulse">
                                   <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                                   <div className="w-1.5 h-1.5 bg-current rounded-full"></div>
                                </span>
                                <span className="text-2xl text-blue-300 tabular-nums">
                                    {dayjs(currentTime).format("ss")}
                                </span>
                            </h2>
                            <p className="text-sm text-blue-100 font-medium">
                                {dayjs(currentTime).locale("id").format("dddd, D MMMM YYYY")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3 shrink-0">
                    <Card className="group relative overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
                        <div className="absolute -right-6 -top-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 group-hover:rotate-12 duration-500">
                            <FileText className="h-32 w-32 text-blue-600" />
                        </div>
                        <CardHeader className="pb-2 pt-5 px-5">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pesanan</CardTitle>
                                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <FileText className="h-5 w-5" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-5 pb-5">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-4xl font-black text-slate-800 tabular-nums tracking-tight">
                                    {displayTotal}
                                </span>
                            </div>
                            <div className="flex items-center text-xs font-medium text-slate-500 mt-3">
                                <span className="flex items-center text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full mr-2">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    All Time
                                </span>
                                Keseluruhan
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group relative overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
                        <div className="absolute -right-6 -top-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 group-hover:-rotate-12 duration-500">
                            <Clock className="h-32 w-32 text-orange-600" />
                        </div>
                        <CardHeader className="pb-2 pt-5 px-5">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dalam Proses</CardTitle>
                                <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                    <Clock className="h-5 w-5" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-5 pb-5">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-4xl font-black text-slate-800 tabular-nums tracking-tight">
                                    {displayProses}
                                </span>
                            </div>
                            <div className="flex items-center text-xs font-medium text-slate-500 mt-3">
                                <div className="flex-1 mr-3">
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 rounded-full" style={{ width: stats.total ? `${(stats.proses / stats.total) * 100}%` : '0%' }}></div>
                                    </div>
                                </div>
                                <span className="text-orange-600 font-semibold">{stats.total > 0 ? Math.round((stats.proses/stats.total)*100) : 0}%</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group relative overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
                        <div className="absolute -right-6 -top-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 group-hover:rotate-12 duration-500">
                            <CheckCircle2 className="h-32 w-32 text-emerald-600" />
                        </div>
                        <CardHeader className="pb-2 pt-5 px-5">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selesai</CardTitle>
                                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-5 pb-5">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-4xl font-black text-slate-800 tabular-nums tracking-tight">
                                    {displaySelesai}
                                </span>
                            </div>
                            <div className="flex items-center text-xs font-medium text-slate-500 mt-3">
                                <div className="flex-1 mr-3">
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: stats.total ? `${(stats.selesai / stats.total) * 100}%` : '0%' }}></div>
                                    </div>
                                </div>
                                <span className="text-emerald-600 font-semibold">{stats.total > 0 ? Math.round((stats.selesai/stats.total)*100) : 0}%</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Charts Section */}
                <div className="grid gap-4 md:grid-cols-3 shrink-0">
                    <Card className="md:col-span-1 shadow-sm border border-slate-200 bg-white">
                        <CardHeader className="pb-2 border-b bg-slate-50/50">
                            <CardTitle className="text-sm font-bold text-slate-800 flex items-center">
                                <PieChartIcon className="w-4 h-4 mr-2 text-blue-600"/>
                                Status Permintaan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 flex justify-center items-center h-[260px]">
                            {stats.total > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartStatData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={85}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {chartStatData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip 
                                            formatter={(value: any) => [`${value} Permintaan`, 'Jumlah']}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            itemStyle={{ color: '#0f172a', fontWeight: '500' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-slate-400">
                                    <PieChartIcon className="w-10 h-10 mb-2 opacity-20" />
                                    <span className="text-sm">Belum ada data</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2 shadow-sm border border-slate-200 bg-white">
                        <CardHeader className="pb-2 border-b bg-slate-50/50">
                            <CardTitle className="text-sm font-bold text-slate-800 flex items-center">
                                <Activity className="w-4 h-4 mr-2 text-blue-600"/>
                                Tren Permintaan (6 Bulan Terakhir)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 h-[260px]">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trendData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} />
                                    <RechartsTooltip 
                                        cursor={{ fill: '#F8FAFC' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
                                    />
                                    <Bar dataKey="jumlah" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} name="Total Permintaan" 
                                        animationDuration={1500}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity Table */}
                <Card className="shadow-sm border border-slate-200 bg-white overflow-hidden">
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50/80 border-b py-4 px-6 gap-4">
                        <div className="flex flex-col gap-1">
                            <CardTitle className="text-base font-bold text-slate-800 flex items-center">
                                <FileText className="w-4 h-4 mr-2 text-blue-600"/>
                                Aktivitas Terkini
                            </CardTitle>
                            <CardDescription className="text-xs">Daftar permintaan barang terbaru dari divisi Anda</CardDescription>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-none">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari PR/Status..."
                                    className="h-9 w-full sm:w-[220px] rounded-full border border-slate-200 bg-white pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="sm" onClick={() => router.push('/divisi/pesanan-anda')} className="rounded-full shadow-sm bg-white hover:bg-slate-50 border-slate-200">
                                Lihat Semua <ArrowRight className="ml-2 h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="w-[180px] font-semibold">No. PR</TableHead>
                                    <TableHead className="font-semibold">Tanggal</TableHead>
                                    <TableHead className="font-semibold">Item</TableHead>
                                    <TableHead className="font-semibold">Jumlah Item</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="text-right font-semibold">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRecent.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center">
                                                <Search className="w-8 h-8 text-slate-300 mb-3" />
                                                <p>{searchTerm ? "Tidak ditemukan pesanan yang cocok." : "Belum ada aktivitas pesanan."}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRecent.map((pr: any) => (
                                        <TableRow key={pr.id_PR} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => router.push(`/divisi/pesanan-anda/${encodeURIComponent(pr.noPR)}`)}>
                                            <TableCell className="font-medium text-blue-600">{pr.noPR}</TableCell>
                                            <TableCell className="text-slate-600">{dayjs(pr.tanggalPR).format("DD MMM YYYY")}</TableCell>
                                            <TableCell className="font-medium text-slate-700 max-w-[200px] truncate" title={pr.firstItemName}>
                                                {pr.firstItemName}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-medium bg-slate-100/80 text-slate-600 hover:bg-slate-200 border-none">
                                                    {pr.itemCount} Barang
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {pr.isComplete ? (
                                                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center w-fit gap-1.5 shadow-sm px-2.5 py-0.5 rounded-full font-medium">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 flex items-center w-fit gap-1.5 shadow-sm px-2.5 py-0.5 rounded-full font-medium">
                                                        <Clock className="w-3.5 h-3.5" /> Proses
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
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
