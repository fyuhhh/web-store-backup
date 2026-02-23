"use client";

import { MainLayout } from "@/components/layout/main-layout";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronRight, Package, Calendar, FileText, ShoppingCart, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import 'dayjs/locale/id';
import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";

export default function PesananAndaPage() {
    const router = useRouter();
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userDivisiId, setUserDivisiId] = useState<string | number | null>(null);
    const [userSkemaId, setUserSkemaId] = useState<string | null>(null); // New state for Schema
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const initUser = async () => {
            // 1. Get User Division & Schema from localStorage
            const userRaw = localStorage.getItem("userData") || localStorage.getItem("user");
            let userId = "";
            let initialDivisiId = "";
            let initialSkemaId = "";

            if (userRaw) {
                try {
                    const user = JSON.parse(userRaw);
                    userId = user.id || user.id_user;
                    if (user.id_divisi) initialDivisiId = String(user.id_divisi);
                    if (user.id_skema) initialSkemaId = String(user.id_skema);
                } catch (e) {
                    console.error("Failed to parse user data", e);
                }
            }

            // Set initial state from localStorage
            if (initialDivisiId) setUserDivisiId(initialDivisiId);
            if (initialSkemaId) setUserSkemaId(initialSkemaId);

            // 2. Fetch Fresh Data (Authoritative)
            if (userId) {
                try {
                    const uRes = await fetch(`${API_BASE_URL}/api/user/${userId}`);
                    const uData = await uRes.json();
                    if (uData) {
                        if (uData.id_divisi) setUserDivisiId(String(uData.id_divisi));
                        if (uData.id_skema) setUserSkemaId(String(uData.id_skema));
                    }
                } catch (err) {
                    console.error("Failed to refresh user data:", err);
                }
            }
        };

        const fetchData = async () => {
            try {
                const [prRes, prItemRes, divisiRes, satuanRes] = await Promise.all([
                    fetch(API_BASE_URL + "/api/pr").then((r) => r.json()),
                    fetch(API_BASE_URL + "/api/pr-item").then((r) => r.json()),
                    fetch(API_BASE_URL + "/api/divisi").then((r) => r.json()),
                    fetch(API_BASE_URL + "/api/satuan").then((r) => r.json()),
                ]);

                // Create Helper Maps
                const divisiMap = Object.fromEntries(
                    divisiRes.map((d: any) => [d.id_divisi, d.divisi])
                );
                const satuanMap = Object.fromEntries(
                    satuanRes.map((s: any) => [s.id_satuan, s.satuan])
                );

                // Process Data
                let processedItems: any[] = [];

                if (Array.isArray(prRes) && Array.isArray(prItemRes)) {
                    // Sort PRs by date descending first
                    // Helper to parse PR number
                    const parsePRNumber = (prNo: string) => {
                        if (!prNo) return { year: 0, month: 0, seq: 0 };

                        const romanMap: { [key: string]: number } = {
                            'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6,
                            'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12
                        };

                        // Try to find year (2 digits) and month (roman)
                        // Regex: \/(\d{2})\/([IVX]+)(?:\/|$)/
                        const matchMid = prNo.match(/\/(\d{2})\/([IVX]+)(?:\/|$)/);
                        let year = 0;
                        let month = 0;

                        if (matchMid) {
                            year = parseInt(matchMid[1], 10);
                            month = romanMap[matchMid[2]] || 0;
                        }

                        // Sequence: Last numeric part
                        const matchSeq = prNo.match(/(\d+)(?!.*\d)/);
                        let seq = matchSeq ? parseInt(matchSeq[1], 10) : 0;

                        return { year, month, seq };
                    };

                    // Sort PRs by PR Number ASCENDING (Smallest to Largest)
                    prRes.sort((a: any, b: any) => {
                        const pA = parsePRNumber(a.noPR);
                        const pB = parsePRNumber(b.noPR);

                        if (pA.year !== pB.year) return pA.year - pB.year; // Ascending Year
                        if (pA.month !== pB.month) return pA.month - pB.month; // Ascending Month
                        return pA.seq - pB.seq; // Ascending Sequence
                    });

                    prRes.forEach((pr: any) => {
                        // Get items for this PR
                        const currentPrItems = prItemRes
                            .filter((item: any) => item.id_PR === pr.id_PR)
                            .sort((a: any, b: any) => a.id_PRItem - b.id_PRItem);

                        if (currentPrItems.length > 0) {
                            currentPrItems.forEach((item: any) => {
                                processedItems.push({
                                    id_PR: pr.id_PR,
                                    noPR: pr.noPR,
                                    noMR: pr.noMR || pr.no_mr || "-", // Map No. MR
                                    tanggalPR: pr.tanggalPR,
                                    id_divisi: pr.id_divisi,
                                    id_skema: pr.id_skema, // Added id_skema
                                    divisiLabel: divisiMap[pr.id_divisi] || "-",

                                    // Item Details
                                    id_PRItem: item.id_PRItem,
                                    namaBarang: item.namaBarang,
                                    jumlah: item.originalJumlah || item.jumlah,
                                    satuanLabel: satuanMap[item.id_satuan] || "-",
                                    keterangan: item.keterangan || "-"
                                });
                            });
                        }
                    });
                }

                // Reverse so newest PR is on top by default
                processedItems.reverse();
                setItems(processedItems);
                
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        // Execute logic
        initUser();
        fetchData();
    }, []);

    // 1. First extract items belonging strictly to the user's division and schema
    const divisionItems = items.filter(item => {
        const matchesDivisi = userDivisiId ? String(item.id_divisi) === String(userDivisiId) : false;
        const matchesSkema = userSkemaId ? String(item.id_skema) === String(userSkemaId) : true;
        return matchesDivisi && matchesSkema;
    });

    // 2. Calculate dynamic metrics based on division data (ignoring search)
    const calculatedTotalPesanan = new Set(divisionItems.map(i => i.noPR)).size;
    const calculatedTotalBarang = divisionItems.length;

    // 3. Filter items based on searchTerm for the table view
    const filteredItems = divisionItems.filter(item => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        return (
            item.noPR.toLowerCase().includes(searchLower) ||
            item.namaBarang.toLowerCase().includes(searchLower) ||
            item.keterangan.toLowerCase().includes(searchLower) ||
            (item.noMR && item.noMR.toLowerCase().includes(searchLower))
        );
    });

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        show: { 
            opacity: 1, 
            y: 0,
            transition: {
                type: "spring",
                stiffness: 80,
                damping: 15,
                duration: 0.6
            }
        }
    };

    return (
        <MainLayout>
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10 px-4 sm:px-6"
            >
                
                {/* Hero Header Section */}
                <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl isolate">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[400px] h-[400px] bg-white opacity-5 blur-3xl rounded-full"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[300px] h-[300px] bg-blue-400 opacity-20 blur-3xl rounded-full"></div>
                    
                    <div className="relative z-10 px-8 py-10 md:py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="max-w-2xl">
                            <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-4 px-3 py-1 shadow-sm backdrop-blur-sm">
                                <Package className="w-3.5 h-3.5 mr-1.5" />
                                Monitoring Divisi
                            </Badge>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                                Status Permintaan Barang
                            </h1>
                            <p className="text-blue-100 text-base md:text-lg opacity-90 leading-relaxed font-light">
                                Pantau dan telusuri seluruh rekam jejak pengajuan barang divisi Anda dengan mudah secara real-time.
                            </p>
                        </div>
                        
                        {/* Quick Stats inside Header */}
                        <div className="flex gap-4 shrink-0 mt-4 md:mt-0">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex flex-col min-w-[130px]">
                                <span className="text-blue-100 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5" /> Total Pesanan
                                </span>
                                <span className="text-3xl font-bold tabular-nums">
                                    {isLoading ? '-' : calculatedTotalPesanan}
                                </span>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex flex-col min-w-[130px]">
                                <span className="text-blue-100 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <Package className="w-3.5 h-3.5" /> Total Barang
                                </span>
                                <span className="text-3xl font-bold tabular-nums">
                                    {isLoading ? '-' : calculatedTotalBarang}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Table Card */}
                <motion.div variants={itemVariants}>
                    <Card className="shadow-lg border-0 bg-white shadow-slate-200/50 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-100 py-6 px-6 md:px-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    Daftar Rincian
                                </CardTitle>
                                <CardDescription className="text-slate-500">
                                    Pilih salah satu baris untuk melihat detail status pembelian atau penerimaan.
                                </CardDescription>
                            </div>
                            
                            {/* Upgraded Search Bar */}
                            <div className="relative w-full md:w-[350px]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 peer-focus:text-blue-500 transition-colors" />
                                <Input
                                    placeholder="Ketik PR, MR, atau nama barang..."
                                    className="pl-11 pr-4 py-6 bg-slate-50/50 border-slate-200 focus:bg-white rounded-full transition-all shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm peer"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                     <button 
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-medium text-lg leading-none"
                                    >×</button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-20 text-slate-400 space-y-4">
                                <div className="relative">
                                    <div className="w-12 h-12 border-4 border-blue-100 rounded-full"></div>
                                    <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                                </div>
                                <p className="font-medium animate-pulse">Menyiapkan data Anda...</p>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-24 text-center">
                                <div className="bg-blue-50/50 p-6 rounded-full mb-4 shadow-inner">
                                    <ShoppingCart className="w-12 h-12 text-blue-200" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Ops, tidak ada data ditemukan!</h3>
                                <p className="text-slate-500 max-w-sm">
                                    {searchTerm 
                                        ? `Coba gunakan kata kunci pencarian lain, hasil untuk "${searchTerm}" kosong.` 
                                        : "Sepertinya Anda belum memiliki riwayat pengajuan pemesanan apa pun di divisi ini."}
                                </p>
                                {searchTerm && (
                                     <Button 
                                        variant="outline" 
                                        className="mt-6 rounded-full"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        Bersihkan Pencarian
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="relative w-full overflow-x-auto min-h-[400px]">
                                <Table>
                                    <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="font-semibold text-slate-700 w-[240px] pl-8">Referensi</TableHead>
                                            <TableHead className="font-semibold text-slate-700 min-w-[300px]">Identitas Barang</TableHead>
                                            <TableHead className="font-semibold text-slate-700 w-[180px]">Volume</TableHead>
                                            <TableHead className="font-semibold text-slate-700 min-w-[200px]">Catatan</TableHead>
                                            <TableHead className="text-right pr-8 w-[100px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredItems.map((item, index) => (
                                            <TableRow
                                                key={`${item.id_PR}-${item.id_PRItem}-${index}`}
                                                className="group hover:bg-blue-50/40 transition-all duration-200 border-b border-slate-100 cursor-pointer"
                                                onClick={() => router.push(`/divisi/pesanan-anda/${encodeURIComponent(item.noPR)}`)}
                                            >
                                                {/* Ref: PR & MR Combined */}
                                                <TableCell className="pl-8 align-top py-5">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="font-bold text-blue-700 bg-blue-50 w-fit px-2 py-0.5 rounded text-sm">
                                                            {item.noPR}
                                                        </span>
                                                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                                            <span className="w-4 h-px bg-slate-300 inline-block"></span>
                                                            {item.noMR && item.noMR !== "-" ? `MR: ${item.noMR}` : 'Tanpa MR'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                
                                                {/* Details: Name & Date Combined */}
                                                <TableCell className="align-top py-5">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="font-semibold text-slate-800 text-base leading-snug">
                                                           {item.namaBarang}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                            {item.tanggalPR ? dayjs(item.tanggalPR).locale('id').format("D MMMM YYYY") : "-"}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                
                                                {/* Combined Quantity & Satuan Badge */}
                                                <TableCell className="align-top py-5">
                                                    <Badge variant="secondary" className="bg-slate-100/80 text-slate-700 hover:bg-slate-200 border-none font-medium text-sm px-3 py-1 shadow-sm mt-1">
                                                        <span className="font-bold mr-1">{Number(item.jumlah)}</span> 
                                                        {item.satuanLabel}
                                                    </Badge>
                                                </TableCell>
                                                
                                                {/* Keterangan */}
                                                <TableCell className="text-slate-500 text-sm align-top py-5 max-w-[200px]">
                                                    {item.keterangan && item.keterangan !== "-" ? (
                                                        <div className="bg-slate-50 border border-slate-100 rounded-md p-2.5 italic truncate font-medium mt-0.5" title={item.keterangan}>
                                                            {item.keterangan}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 italic block mt-2.5">—</span>
                                                    )}
                                                </TableCell>

                                                {/* Action Arrow */}
                                                <TableCell className="pr-8 align-middle text-right">
                                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center ml-auto group-hover:border-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:scale-110">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
                </motion.div>
            </motion.div>
        </MainLayout>
    );
}
