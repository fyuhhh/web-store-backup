"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    User,
    Shield,
    Building2,
    Database,
    Calendar,
    Activity,
    ArrowLeft,
    FileText,
    ShoppingCart,
    Package,
    Truck,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle
} from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { API_BASE_URL } from "@/lib/config";

export default function MonitoringAkunPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id;

    const [user, setUser] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        pr: 0,
        po: 0,
        btb: 0,
        bkb: 0
    });

    useEffect(() => {
        if (!userId) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch Master Data
                const [
                    userRes,
                    peranRes,
                    divisiRes,
                    skemaRes,
                    prRes,
                    poRes,
                    btbRes,
                    bkbRes,
                    supplierRes
                ] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/user`).then(r => r.json()),
                    fetch(API_BASE_URL + "/api/peran").then(r => r.json()),
                    fetch(API_BASE_URL + "/api/divisi").then(r => r.json()),
                    fetch(API_BASE_URL + "/api/skema").then(r => r.json()),
                    fetch(API_BASE_URL + "/api/pr").then(r => r.json()),
                    fetch(API_BASE_URL + "/api/po").then(r => r.json()),
                    fetch(API_BASE_URL + "/api/btb").then(r => r.json()),
                    fetch(API_BASE_URL + "/api/bkb").then(r => r.json()),
                    fetch(API_BASE_URL + "/api/supplier").then(r => r.json()),
                ]);

                // Find Target User
                const foundUser = Array.isArray(userRes)
                    ? userRes.find((u: any) => u.id_user === Number(userId))
                    : null;

                if (!foundUser) {
                    throw new Error("User not found");
                }

                // Enrich User Data
                const role = Array.isArray(peranRes) ? peranRes.find((p: any) => p.id_peran === foundUser.id_peran) : null;
                const divisi = Array.isArray(divisiRes) ? divisiRes.find((d: any) => d.id_divisi === foundUser.id_divisi) : null;
                const skema = Array.isArray(skemaRes) ? skemaRes.find((s: any) => s.id_skema === foundUser.id_skema) : null;

                setUser({
                    ...foundUser,
                    roleName: role?.peran || "-",
                    divisiName: divisi?.divisi || "-",
                    skemaName: skema?.skema || "-"
                });

                // ------------------------------------------
                // Aggregate Activity
                // ------------------------------------------
                const activityList: any[] = [];
                const numericId = Number(userId);

                // 1. PR Activities (Created By)
                if (Array.isArray(prRes)) {
                    prRes.forEach((pr: any) => {
                        if (Number(pr.dibuatOleh) === numericId) {
                            activityList.push({
                                type: "PR",
                                date: pr.tanggalPR,
                                id: pr.noPR,
                                desc: `Membuat PR untuk ${pr.nama_divisi || "Divisi"}`,
                                status: pr.status,
                                rawDate: new Date(pr.tanggalPR)
                            });
                        }
                    });
                }

                // 2. PO Activities (Ordered By)
                // Note: PO usually has 'orderedBy' field linking to user
                if (Array.isArray(poRes)) {
                    poRes.forEach((po: any) => {
                        if (Number(po.orderedBy) === numericId) {
                            const supplier = Array.isArray(supplierRes) ? supplierRes.find((s: any) => s.id_supplier === po.id_supplier) : null;
                            activityList.push({
                                type: "PO",
                                date: po.tanggalPO,
                                id: po.noPO,
                                desc: `Membuat PO ke ${supplier?.namaSupplier || "Supplier"}`,
                                status: po.statusPengiriman, // Use statusPengiriman or similar
                                rawDate: new Date(po.tanggalPO)
                            });
                        }
                    });
                }

                // 3. BTB Activities (Received By / Diterima Oleh)
                if (Array.isArray(btbRes)) {
                    btbRes.forEach((btb: any) => {
                        if (Number(btb.id_user) === numericId || btb.diterima_oleh?.toLowerCase() === foundUser.nama_pengguna?.toLowerCase()) {
                            activityList.push({
                                type: "BTB",
                                date: btb.tanggal_btb,
                                id: btb.no_btb,
                                desc: `Menerima Barang (BTB)`,
                                status: "Selesai",
                                rawDate: new Date(btb.tanggal_btb)
                            });
                        }
                    });
                }

                // 4. BKB Activities (Issued By / Dikeluarkan Oleh)
                if (Array.isArray(bkbRes)) {
                    bkbRes.forEach((bkb: any) => {
                        // Check 'dikeluarkanOleh' or 'dimintaOleh' if needed. Assuming 'dikeluarkanOleh' for maintenance/store
                        // The API might return id_user or a string. 
                        // We'll check against id_user if it exists, or loose match on name if strictly needed (but ID is safer)
                        if (Number(bkb.id_user) === numericId) {
                            activityList.push({
                                type: "BKB",
                                date: bkb.tanggal_bkb,
                                id: bkb.no_bkb,
                                desc: `Mengeluarkan Barang (BKB)`,
                                status: "Selesai",
                                rawDate: new Date(bkb.tanggal_bkb)
                            });
                        }
                    });
                }

                // Sort by Date Descending
                activityList.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

                setActivities(activityList);
                setStats({
                    pr: activityList.filter(a => a.type === "PR").length,
                    po: activityList.filter(a => a.type === "PO").length,
                    btb: activityList.filter(a => a.type === "BTB").length,
                    bkb: activityList.filter(a => a.type === "BKB").length,
                });

                // Populate All Users for Admin View
                if (String(userId) === "141" && Array.isArray(userRes)) {
                    const enrichedUsers = userRes.map((u: any) => {
                        const uRole = Array.isArray(peranRes) ? peranRes.find((p: any) => p.id_peran === u.id_peran) : null;
                        const uDivisi = Array.isArray(divisiRes) ? divisiRes.find((d: any) => d.id_divisi === u.id_divisi) : null;
                        const uSkema = Array.isArray(skemaRes) ? skemaRes.find((s: any) => s.id_skema === u.id_skema) : null;
                        return {
                            ...u,
                            roleName: uRole?.peran || "-",
                            divisiName: uDivisi?.divisi || "-",
                            skemaName: uSkema?.skema || "-"
                        };
                    });
                    setAllUsers(enrichedUsers);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </MainLayout>
        );
    }

    // Fallback if not found
    if (!user) {
        return (
            <MainLayout>
                <div className="p-8 text-center text-slate-500">User tidak ditemukan.</div>
            </MainLayout>
        );
    }

    // --- SPECIAL VIEW FOR USER 141 (MAINTENANCE) ---
    // Refactor: We need `allUsers` state to display the list for ID 141.
    // I will add `allUsers` state and populate it in the useEffect.

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="h-10 w-10">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Monitoring Akun</h1>
                        <p className="text-slate-500">Detail profil dan aktivitas pengguna dalam sistem.</p>
                    </div>
                </div>

                {String(userId) === "141" ? (
                    /* --- ADMIN VIEW (ALL USERS TABLE) --- */
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-600" />
                                Daftar Semua User (Akses Admin)
                            </CardTitle>
                            <CardDescription>
                                Informasi login dan kredensial pengguna.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No</TableHead>
                                        <TableHead>Username</TableHead>
                                        <TableHead>Password</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Divisi</TableHead>
                                        <TableHead>Skema</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allUsers.length > 0 ? (
                                        allUsers.map((u, i) => (
                                            <TableRow key={u.id_user}>
                                                <TableCell>{i + 1}</TableCell>
                                                <TableCell className="font-medium">{u.nama_pengguna}</TableCell>
                                                <TableCell className="font-mono text-xs bg-slate-50 p-2 rounded border border-slate-200">
                                                    {u.plain_password || "******"}
                                                </TableCell>
                                                <TableCell>{u.roleName}</TableCell>
                                                <TableCell>{u.divisiName}</TableCell>
                                                <TableCell>{u.skemaName}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-4">Memuat data user...</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ) : (
                    /* --- STANDARD USER VIEW (PROFILE & ACTIVITY) --- */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Profile & Stats */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Profile Card */}
                            <Card className="border-t-4 border-t-blue-600 shadow-sm">
                                <CardHeader className="text-center pb-2">
                                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <User className="w-10 h-10 text-blue-600" />
                                    </div>
                                    <CardTitle className="text-xl">{user.nama_pengguna}</CardTitle>
                                    <CardDescription className="flex items-center justify-center gap-1">
                                        <Badge variant="secondary" className="mt-2">{user.roleName}</Badge>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                        <span className="text-sm text-slate-500 flex items-center gap-2">
                                            <Building2 className="w-4 h-4" /> Divisi
                                        </span>
                                        <span className="text-sm font-medium text-slate-900">{user.divisiName}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                        <span className="text-sm text-slate-500 flex items-center gap-2">
                                            <Database className="w-4 h-4" /> Skema
                                        </span>
                                        <span className="text-sm font-medium text-slate-900">{user.skemaName}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                        <span className="text-sm text-slate-500 flex items-center gap-2">
                                            <Shield className="w-4 h-4" /> Password
                                        </span>
                                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">
                                            *******
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm text-slate-500 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" /> Bergabung
                                        </span>
                                        <span className="text-sm font-medium text-slate-900">
                                            {new Date(user.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Stats Card */}
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-blue-600" /> Ringkasan Aktivitas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-blue-700">{stats.pr}</div>
                                        <div className="text-xs text-blue-600 font-medium mt-1">Total PR</div>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-emerald-700">{stats.po}</div>
                                        <div className="text-xs text-emerald-600 font-medium mt-1">Total PO</div>
                                    </div>
                                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-purple-700">{stats.btb}</div>
                                        <div className="text-xs text-purple-600 font-medium mt-1">Total BTB</div>
                                    </div>
                                    <div className="p-4 bg-orange-50 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-orange-700">{stats.bkb}</div>
                                        <div className="text-xs text-orange-600 font-medium mt-1">Total BKB</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Activity Feed */}
                        <div className="lg:col-span-2">
                            <Card className="h-full shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-slate-600" />
                                        Riwayat Aktivitas
                                    </CardTitle>
                                    <CardDescription>
                                        Daftar transaksi yang dilakukan oleh pengguna ini.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {activities.length === 0 ? (
                                        <div className="text-center py-12 text-slate-400">
                                            <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>Belum ada aktivitas tercatat.</p>
                                        </div>
                                    ) : (
                                        <div className="relative border-l border-slate-200 ml-3 space-y-8 pl-8 py-2">
                                            {activities.map((act, idx) => (
                                                <div key={idx} className="relative">
                                                    {/* Timeline Dot */}
                                                    <div className={`absolute -left-[41px] top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white 
                                                        ${act.type === 'PR' ? 'border-blue-500 text-blue-500' :
                                                            act.type === 'PO' ? 'border-emerald-500 text-emerald-500' :
                                                                act.type === 'BTB' ? 'border-purple-500 text-purple-500' :
                                                                    'border-orange-500 text-orange-500'
                                                        }`}>
                                                        {act.type === 'PR' && <FileText className="w-3 h-3" />}
                                                        {act.type === 'PO' && <ShoppingCart className="w-3 h-3" />}
                                                        {act.type === 'BTB' && <Package className="w-3 h-3" />}
                                                        {act.type === 'BKB' && <Truck className="w-3 h-3" />}
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className={`
                                                                ${act.type === 'PR' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                    act.type === 'PO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                        act.type === 'BTB' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                            'bg-orange-50 text-orange-700 border-orange-200'
                                                                }
                                                            `}>
                                                                {act.type} • {act.id}
                                                            </Badge>
                                                            <span className="text-xs text-slate-400">
                                                                {act.rawDate.toLocaleString("id-ID", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        {act.status && (
                                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                                                {act.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-700 font-medium">
                                                        {act.desc}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
