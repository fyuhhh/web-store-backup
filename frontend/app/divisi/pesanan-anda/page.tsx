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
import { Search, ChevronRight, Package, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import 'dayjs/locale/id';
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

    // Filter items based on userDivisiId, userSkemaId, and searchTerm
    const filteredItems = items.filter(item => {
        // 1. Filter by Division
        const matchesDivisi = userDivisiId ? String(item.id_divisi) === String(userDivisiId) : false;

        // 2. Filter by Schema (if user has one)
        const matchesSkema = userSkemaId ? String(item.id_skema) === String(userSkemaId) : true;

        if (!matchesDivisi || !matchesSkema) return false;

        const searchLower = searchTerm.toLowerCase();
        return (
            item.noPR.toLowerCase().includes(searchLower) ||
            item.namaBarang.toLowerCase().includes(searchLower) ||
            item.keterangan.toLowerCase().includes(searchLower)
        );
    });

    return (
        <MainLayout>
            <div className="flex flex-col gap-6 w-full max-w-[98%] mx-auto pb-10 px-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Pesanan Anda</h1>
                        <p className="text-slate-500 mt-1">Daftar semua permintaan barang yang diajukan oleh divisi Anda.</p>
                    </div>
                </div>

                <Card className="shadow-lg border-slate-200 bg-white">
                    <CardHeader className="bg-slate-100 border-b border-slate-200 py-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-blue-600" />
                                    Daftar Permintaan Barang
                                </CardTitle>
                                <CardDescription>
                                    Memantau status dan detail item permintaan divisi Anda.
                                </CardDescription>
                            </div>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Cari PR, Barang, atau Keterangan..."
                                    className="pl-9 bg-white border-slate-200 focus:bg-white transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                <p>Sedang memuat data...</p>
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <div className="bg-slate-50 p-4 rounded-full mb-3">
                                    <Search className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900">Tidak ada data ditemukan</h3>
                                <p className="text-slate-500 max-w-sm mt-1">
                                    {searchTerm ? `Tidak ada hasil pencarian untuk "${searchTerm}"` : "Belum ada permintaan barang yang dibuat oleh divisi Anda."}
                                </p>
                            </div>
                        ) : (
                            <div className="relative w-full overflow-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead className="font-semibold text-slate-700 w-[200px] pl-6">No. PR</TableHead>
                                            <TableHead className="font-semibold text-slate-700 w-[150px]">Tanggal</TableHead>
                                            <TableHead className="font-semibold text-slate-700 min-w-[250px]">Daftar Barang</TableHead>
                                            <TableHead className="font-semibold text-slate-700 w-[100px] text-center">Kuantitas</TableHead>
                                            <TableHead className="font-semibold text-slate-700 w-[120px]">Satuan</TableHead>
                                            <TableHead className="font-semibold text-slate-700 w-[200px]">Keterangan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredItems.map((item, index) => (
                                            <TableRow
                                                key={`${item.id_PR}-${item.id_PRItem}-${index}`}
                                                className="group hover:bg-slate-50/80 transition-colors border-b border-slate-100 cursor-pointer"
                                                onClick={() => router.push(`/divisi/pesanan-anda/${encodeURIComponent(item.noPR)}`)}
                                            >
                                                <TableCell className="font-medium text-slate-900 pl-6 align-top py-4">
                                                    <div className="flex items-center gap-1 text-blue-600 group-hover:text-blue-700 font-semibold transition-colors">
                                                        {item.noPR}
                                                        <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-500" />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-slate-500 align-top py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                        {item.tanggalPR ? dayjs(item.tanggalPR).locale('id').format("D MMM YYYY") : "-"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="align-top py-4">
                                                    <span className="font-medium text-slate-800 block text-base">{item.namaBarang}</span>
                                                </TableCell>
                                                <TableCell className="text-center font-bold text-slate-700 align-top py-4">
                                                    {Number(item.jumlah)}
                                                </TableCell>
                                                <TableCell className="text-slate-600 align-top py-4">
                                                    <Badge variant="secondary" className="font-normal bg-slate-100 text-slate-600 border-slate-200">
                                                        {item.satuanLabel}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm align-top py-4 italic max-w-[200px] truncate" title={item.keterangan}>
                                                    {item.keterangan}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
