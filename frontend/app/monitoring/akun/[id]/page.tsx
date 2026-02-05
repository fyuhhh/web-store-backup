"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { socket } from "@/lib/socket";
import { ActiveUsersGrid } from "@/components/monitoring/ActiveUsersGrid";
import { LiveActivityFeed, ActivityLog } from "@/components/monitoring/LiveActivityFeed";
import { ActivityChart } from "@/components/monitoring/ActivityChart";
import { API_BASE_URL } from "@/lib/config";
import { MainLayout } from "@/components/layout/main-layout";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- OLD COMPONENTS IMPORTS (Keep for fallback/other users) ---
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    User,
    Shield,
    Building2,
    Database,
    Calendar,
    Activity,
    FileText,
    ShoppingCart,
    Package,
    Truck,
    Clock
} from "lucide-react";

export default function MonitoringAkunPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id;

    // --- REALTIME OR STATIC SWITCH ---
    const [isMonitorMode, setIsMonitorMode] = useState(false);

    // Auth Check for 141
    useEffect(() => {
        try {
            const stored = localStorage.getItem("userData");
            if (stored) {
                const u = JSON.parse(stored);
                // If the Logged In user is 141 AND they are viewing page /141
                if (String(u.id_user) === "141" && String(userId) === "141") {
                    setIsMonitorMode(true);
                }
            }
        } catch { }
    }, [userId]);

    // --------------------------------------------------------------------------------
    // MODE 1: REALTIME MONITORING DASHBOARD (Only for ID 141)
    // --------------------------------------------------------------------------------
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [statsData, setStatsData] = useState<any[]>([]);
    const [loadingMonitor, setLoadingMonitor] = useState(true);

    useEffect(() => {
        if (!isMonitorMode) return;

        // 1. Fetch Logs & Stats
        const initData = async () => {
            try {
                // Parallel fetch
                const [logsRes, statsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/monitoring/logs?limit=100`),
                    fetch(`${API_BASE_URL}/api/monitoring/stats`)
                ]);

                if (logsRes.ok) {
                    const data = await logsRes.json();
                    setLogs(data);
                }

                if (statsRes.ok) {
                    const sData = await statsRes.json();
                    setStatsData(sData);
                }
            } finally {
                setLoadingMonitor(false);
            }
        };
        initData();

        // 2. Socket
        if (!socket.connected) socket.connect();
        socket.emit("join_monitoring");

        socket.on("online_users_update", setOnlineUsers);
        socket.on("activity_log", (newLog) => {
            setLogs(p => [newLog, ...p].slice(0, 100));
            // Optional: Increment latest hour stat locally or refetch
        });
        socket.on("activity_new", (newLog) => setLogs(p => {
            if (p.find(l => l.id === newLog.id)) return p;
            return [newLog, ...p].slice(0, 100);
        }));

        return () => {
            socket.off("online_users_update");
            socket.off("activity_log");
            socket.off("activity_new");
        };
    }, [isMonitorMode]);


    // --------------------------------------------------------------------------------
    // MODE 2: STANDARD PROFILE VIEW (Preserved from old code)
    // --------------------------------------------------------------------------------
    const [user, setUser] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ pr: 0, po: 0, btb: 0, bkb: 0 });

    useEffect(() => {
        if (isMonitorMode) return; // Skip if monitor mode
        if (!userId) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch basic user data only for now to restore view
                const userRes = await fetch(`${API_BASE_URL}/api/user/${userId}`).then(r => r.json());
                if (!userRes) throw new Error("User not found");

                // We need roles/divisi names, etc.
                const [
                    peranRes,
                    divisiRes,
                    skemaRes,
                    prRes,
                    poRes,
                    btbRes,
                    bkbRes,
                    supplierRes,
                    logsRes
                ] = await Promise.all([
                    fetch(API_BASE_URL + "/api/peran").then(r => r.json()),
                    fetch(API_BASE_URL + "/api/divisi").then(r => r.json()),
                    fetch(API_BASE_URL + "/api/skema").then(r => r.json()),
                    fetch(API_BASE_URL + "/api/pr").then(r => r.json()),
                    fetch(API_BASE_URL + "/api/po").then(r => r.json()),
                    fetch(API_BASE_URL + "/api/btb").then(r => r.json()),
                    fetch(API_BASE_URL + "/api/bkb").then(r => r.json()),
                    fetch(API_BASE_URL + "/api/supplier").then(r => r.json()),
                    fetch(`${API_BASE_URL}/api/activity-logs?user_id=${userId}&limit=100`).then(r => r.json())
                ]);

                // Transform User
                const role = Array.isArray(peranRes) ? peranRes.find((p: any) => p.id_peran === userRes.id_peran) : null;
                const divisi = Array.isArray(divisiRes) ? divisiRes.find((d: any) => d.id_divisi === userRes.id_divisi) : null;
                const skema = Array.isArray(skemaRes) ? skemaRes.find((s: any) => s.id_skema === userRes.id_skema) : null;

                setUser({
                    ...userRes,
                    roleName: role?.peran || "-",
                    divisiName: divisi?.divisi || "-",
                    skemaName: skema?.skema || "-"
                });

                // Simple activity aggregation (Copied logic) - KEEP FOR STATS ONLY
                const numericId = Number(userId);
                let acts: any[] = [];

                // PR
                if (Array.isArray(prRes)) prRes.filter((x: any) => Number(x.dibuatOleh) === numericId).forEach((x: any) => acts.push({ type: 'PR', id: x.noPR, date: x.tanggalPR, desc: 'Membuat PR' }));
                // PO
                if (Array.isArray(poRes)) poRes.filter((x: any) => Number(x.orderedBy) === numericId).forEach((x: any) => acts.push({ type: 'PO', id: x.noPO, date: x.tanggalPO, desc: 'Membuat PO' }));

                acts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setActivities(acts);
                setStats({
                    pr: acts.filter(a => a.type === "PR").length,
                    po: acts.filter(a => a.type === "PO").length,
                    btb: 0,
                    bkb: 0
                });

                // Set Logs from API for the Feed
                if (Array.isArray(logsRes)) {
                    setLogs(logsRes);
                } else {
                    setLogs([]);
                }

            } catch (e) {
                console.error(e);
                setLogs([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId, isMonitorMode]);


    // --------------------------------------------------------------------------------
    // RENDER: MONITOR MODE
    // --------------------------------------------------------------------------------
    if (isMonitorMode) {
        return (
            <MainLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="outline" size="icon" onClick={() => router.back()} className="h-10 w-10">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                Pusat Monitoring (Live)
                            </h1>
                            <p className="text-muted-foreground">
                                Memantau aktivitas dan login pengguna secara real-time.
                            </p>
                        </div>
                    </div>

                    {/* ACTIVE USERS GRID */}
                    <section>
                        <ActiveUsersGrid users={onlineUsers} />
                    </section>

                    {/* LOG FEED & CHART */}
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 hidden lg:block">
                            <ActivityChart data={statsData} />
                        </div>

                        <div className="lg:col-span-1 h-full min-h-[500px]">
                            {loadingMonitor ? (
                                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>
                            ) : (
                                <LiveActivityFeed logs={logs} />
                            )}
                        </div>
                    </section>

                    {/* Mobile Feed */}
                    <div className="lg:hidden block">
                        <LiveActivityFeed logs={logs} />
                    </div>
                </div>
            </MainLayout>
        );
    }

    // --------------------------------------------------------------------------------
    // RENDER: STANDARD MODE (Fallback to old UI)
    // --------------------------------------------------------------------------------
    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </MainLayout>
        );
    }

    if (!user) return <MainLayout><div className="p-10 text-center">User tidak ditemukan</div></MainLayout>;

    // Reuse the old UI structure for normal profile view
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
                        <p className="text-slate-500">Detail profil dan aktivitas pengguna.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Standard Profile Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-t-4 border-t-blue-600 shadow-sm">
                            <CardHeader className="text-center pb-2">
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-10 h-10 text-blue-600" />
                                </div>
                                <CardTitle className="text-xl">{user.nama_pengguna}</CardTitle>
                                <CardDescription>
                                    <Badge variant="secondary" className="mt-2">{user.roleName}</Badge>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                    <span className="text-sm text-slate-500">Divisi</span>
                                    <span className="text-sm font-medium">{user.divisiName}</span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-slate-500">Skema</span>
                                    <span className="text-sm font-medium">{user.skemaName}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Standard Activity List */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Riwayat Aktivitas (Terakhir)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {logs.length === 0 ? <p className="text-muted-foreground text-center py-4">Tidak ada aktivitas.</p> : (
                                    <LiveActivityFeed logs={logs} />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
