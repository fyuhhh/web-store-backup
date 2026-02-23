"use client";

import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  FileText,
  ShoppingCart,
  Package,
  PackageOpen,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Sparkles,
  Activity,
  PieChart as PieChartIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import "dayjs/locale/id";
import CountUp from "@/components/ui/count-up";
import TextType from "@/components/ui/text-type";
import { API_BASE_URL } from "@/lib/config";

dayjs.extend(isBetween);
dayjs.locale("id");

// Dummy data for dashboard
const kpiData = {
  totalPR: 156,
  totalPO: 89,
  totalBTB: 67,
  totalBKB: 45,
  prOnTime: 78,
  prDelayed: 12,
  avgProcessTime: 2.3,
  budgetUtilization: 67.5,
};

const monthlyData = [
  { month: "Jan", PR: 12, PO: 8, BTB: 6, BKB: 4 },
  { month: "Feb", PR: 15, PO: 12, BTB: 9, BKB: 7 },
  { month: "Mar", PR: 18, PO: 14, BTB: 11, BKB: 8 },
  { month: "Apr", PR: 22, PO: 16, BTB: 13, BKB: 10 },
  { month: "Mei", PR: 25, PO: 19, BTB: 15, BKB: 12 },
  { month: "Jun", PR: 28, PO: 21, BTB: 17, BKB: 14 },
];

// Dummy supplier data (restore this block)
const supplierData = [
  { name: "PT. Supplier A", rating: 4.8, orders: 23, onTime: 95 },
  { name: "PT. Supplier B", rating: 4.5, orders: 18, onTime: 88 },
  { name: "PT. Supplier C", rating: 4.2, orders: 15, onTime: 82 },
  { name: "PT. Supplier D", rating: 3.9, orders: 12, onTime: 75 },
];

export default function DashboardPage() {
  // State untuk total item
  const [totalPRItem, setTotalPRItem] = useState(0);
  const [totalPOItem, setTotalPOItem] = useState(0);
  const [totalBTBItem, setTotalBTBItem] = useState(0);
  const [totalBKBItem, setTotalBKBItem] = useState(0);

  // State untuk user (Moved to top)
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userRaw = localStorage.getItem("userData");
      if (userRaw) {
        try {
          const localUser = JSON.parse(userRaw);
          setUser(localUser);

          // Fetch fresh user data to ensure we have the latest id_skema
          const userId = localUser.id || localUser.id_user;
          if (userId) {
            fetch(`${API_BASE_URL}/api/user/${userId}`)
              .then((r) => r.json())
              .then((freshUser) => {
                // Validate if it's a real user object
                if (freshUser && (freshUser.id || freshUser.id_user)) {
                  setUser(freshUser);
                } else {
                  console.warn("Fetched user data invalid:", freshUser);
                }
              })
              .catch((err) => console.error("Failed to fetch fresh user data", err));
          }
        } catch { }
      }
    }
  }, []);



  // State untuk jam
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper untuk format jam digital
  function formatTime(date: Date) {
    return date
      .toLocaleTimeString("id-ID", { hour12: false })
      .replace(/(\d{2}):(\d{2}):(\d{2})/, "$1:$2:$3");
  }

  function formatDate(date: Date) {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }



  // Auto-logout logic (testing: 5 detik idle)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.removeItem("userData");
        window.location.href = "/login";
      }, 600000); // 5 detik idle
    };

    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, []);

  // State for properties
  const [prStatusCount, setPrStatusCount] = useState({
    waitingPart: 0,
    partialPO: 0,
    waitingPO: 0,
  });
  const [prStatusDist, setPrStatusDist] = useState({
    waitingPart: 0,
    partialPO: 0,
    waitingPO: 0,
  });

  const [trendData, setTrendData] = useState<{ [year: string]: any[] }>({});
  // const [selectedYear, setSelectedYear] = useState<string>(""); // HAPUS or Comment

  // -- NEW STATE FOR DATE RANGE --
  const [startDate, setStartDate] = useState(
    dayjs().subtract(1, "month").startOf("month").format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(
    dayjs().endOf("month").format("YYYY-MM-DD")
  );
  // -----------------------------


  // State for loading
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // BLOCK FETCH UNTIL USER IS LOADED & HAS ID
    const userId = user?.id || user?.id_user;

    if (!user || !userId) {
      console.log("[Dashboard Filter] Waiting for VALID user login state...", user);
      return;
    }

    // Helper to filter by Schema
    const filterBySchema = (data: any[]) => {
      if (!Array.isArray(data)) return [];
      const userSchema = user?.id_skema ?? user?.skema;

      if (!user) return data;

      if (userSchema === undefined || userSchema === null) {
        console.warn("[Dashboard Filter] No schema found. Displaying ALL data.");
        return data;
      }

      const filtered = data.filter((item) => String(item.id_skema) === String(userSchema));
      return filtered;
    };

    setIsLoading(true);

    const p1 = fetch(API_BASE_URL + "/api/pr")
      .then((r) => r.json())
      .then((data) => {
        const filtered = filterBySchema(data);
        setTotalPRItem(filtered.length);

        // Count statuses for Global (Cards) - also filtered
        let waitingPart = 0,
          partialPO = 0,
          waitingPO = 0;

        filtered.forEach((pr) => {
          const s = (pr.status || "").toUpperCase();
          if (s === "WAITING PART" || s === "DIPROSES" || s === "SELESAI" || s === "TELAH SELESAI") waitingPart++;
          else if (s === "PARTIAL PO" || s === "PARCIAL PO" || s === "GANTUNG") partialPO++;
          else if (s === "WAITING PO" || s === "MENUNGGU") waitingPO++;
        });
        setPrStatusCount({ waitingPart, partialPO, waitingPO });

        // Calculate Trend & Dist based on same filtered data ( + Date Range)
        const dateFiltered = filtered.filter((pr) => {
          if (!pr.tanggalPR) return false;
          const prDate = dayjs(pr.tanggalPR);
          return prDate.isBetween(startDate, endDate, "day", "[]");
        });

        let distWaitingPart = 0,
          distPartialPO = 0,
          distWaitingPO = 0;

        dateFiltered.forEach((pr) => {
          const s = (pr.status || "").toUpperCase();
          if (s === "WAITING PART" || s === "DIPROSES" || s === "SELESAI" || s === "TELAH SELESAI") distWaitingPart++;
          else if (s === "PARTIAL PO" || s === "PARCIAL PO" || s === "GANTUNG") distPartialPO++;
          else if (s === "WAITING PO" || s === "MENUNGGU") distWaitingPO++;
        });
        setPrStatusDist({ waitingPart: distWaitingPart, partialPO: distPartialPO, waitingPO: distWaitingPO });

        // Trend Bulanan
        const grouped: { [key: string]: any } = {};
        dateFiltered.forEach((pr) => {
          const date = dayjs(pr.tanggalPR);
          const key = date.format("MMM YYYY");
          const monthLabel = date.format("MMM");

          if (!grouped[key]) {
            grouped[key] = {
              month: monthLabel,
              fullDate: date.valueOf(),
              waitingPart: 0,
              partialPO: 0,
              waitingPO: 0,
            };
          }

          const s = (pr.status || "").toUpperCase();
          if (s === "WAITING PART" || s === "DIPROSES" || s === "SELESAI" || s === "TELAH SELESAI") grouped[key].waitingPart++;
          else if (s === "PARTIAL PO" || s === "PARCIAL PO" || s === "GANTUNG") grouped[key].partialPO++;
          else if (s === "WAITING PO" || s === "MENUNGGU") grouped[key].waitingPO++;
        });

        const result = Object.values(grouped).sort((a, b) => a.fullDate - b.fullDate);
        setTrendData({ current: result });
      });

    const p2 = fetch(API_BASE_URL + "/api/po")
      .then((r) => r.json())
      .then((data) => setTotalPOItem(filterBySchema(data).length));

    const p3 = fetch(API_BASE_URL + "/api/btb")
      .then((r) => r.json())
      .then((data) => setTotalBTBItem(filterBySchema(data).length));

    const p4 = fetch(API_BASE_URL + "/api/bkb")
      .then((r) => r.json())
      .then((data) => setTotalBKBItem(filterBySchema(data).length));

    Promise.all([p1, p2, p3, p4]).finally(() => {
      // Add a small delay for smoother transition visually
      setTimeout(() => setIsLoading(false), 500);
    });

  }, [startDate, endDate, user]);

  // Auto-logout logic (testing: 5 detik idle)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        localStorage.removeItem("userData");
        window.location.href = "/login";
      }, 600000); // 10 menit idle (600000ms)
    };

    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, []);

  const router = useRouter();

  // 1. Definisikan Animasi Stagger & Fade-Up untuk Framer Motion
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
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
        duration: 0.6,
      },
    },
  };

  // 2. Data warna palet modern untuk Donut Chart
  const pieStatusData = [
    {
      name: "Waiting Part",
      value: prStatusDist.waitingPart,
      color: "url(#colorPieProses)",
    },
    {
      name: "Partial PO",
      value: prStatusDist.partialPO,
      color: "url(#colorPieParsial)",
    },
    {
      name: "Waiting PO",
      value: prStatusDist.waitingPO,
      color: "url(#colorPieMenunggu)",
    },
  ];

  return (
    <MainLayout>
      <div className="min-h-full pb-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 pt-4"
        >
          {/* 1. HERO BANNER (Jam Digital & Sapaan) */}
          <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-950 text-white shadow-xl isolate">
            {/* Dekorasi Latar Belakang */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[400px] h-[400px] bg-white opacity-5 blur-3xl rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[300px] h-[300px] bg-blue-400 opacity-20 blur-3xl rounded-full pointer-events-none"></div>

            <div className="relative z-10 px-8 py-10 md:py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Pesan Sapaan (Kiri) */}
              <div className="max-w-2xl">
                <Badge variant="outline" className="bg-white/10 text-blue-100 hover:bg-white/20 border-white/20 mb-4 backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-300" />
                  Sistem Monitoring Terpusat
                </Badge>
                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-3 leading-snug">
                  <TextType 
                    text={[`Selamat datang, ${user?.nama_pengguna || "Pengguna"}`]}
                    typingSpeed={60}
                    pauseDuration={1500}
                    showCursor
                    cursorCharacter="|"
                    deletingSpeed={30}
                    loop={false}
                  />
                </h1>
                <p className="text-blue-100/90 text-sm md:text-base leading-relaxed max-w-2xl mb-0 font-medium tracking-wide">
                  Kontrol seluruh aktivitas pesanan, penerimaan, dan pengeluaran barang secara langsung dalam satu dasbor.
                </p>
              </div>

              {/* Jam Digital (Kanan) */}
              <div className="flex flex-col items-end shrink-0 mt-4 md:mt-0 text-right">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl py-4 px-6 border border-white/20 flex flex-col items-center justify-center text-center shadow-lg">
                  <div className="text-4xl md:text-5xl font-extrabold tracking-wider tabular-nums text-white drop-shadow-md leading-none mb-2">
                    {formatTime(now)}
                  </div>
                  <div className="text-xs font-bold text-blue-100/90 uppercase tracking-[0.15em]">
                    {formatDate(now)}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          {/* 2 & 3. MODERNISASI 4 SUMMARY CARDS & GABUNGAN STATUS OVERVIEW DI BAWAHNYA */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0 mt-2">
            
            {/* Kartu 1: Total PR (+ Status PR gabungan) */}
            <motion.div variants={itemVariants}>
              <Card 
                className="group relative overflow-hidden border-0 bg-white shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col h-full rounded-2xl"
                onClick={() => router.push("/pr/monitoring")}
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 group-hover:rotate-12 duration-500">
                  <FileText className="h-32 w-32 text-indigo-600" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 space-y-0">
                  <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Total PR Aktif
                  </CardTitle>
                  <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all duration-300">
                    <FileText className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent className="z-10 pb-4 flex-1 flex flex-col justify-between">
                  <div>
                    {isLoading ? (
                      <Skeleton className="h-10 w-24 my-1" />
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-800 tabular-nums tracking-tight">
                          <CountUp from={0} to={Number(totalPRItem) || 0} separator="." duration={2.5} />
                        </span>
                        <div className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <TrendingUp className="w-3 h-3 mr-1" /> Trending
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Status Overview Dipindah ke Sini (Bawah PR Angka) */}
                  <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Menunggu</span>
                      <span className="text-sm font-bold tracking-tight text-blue-600 flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></div>
                        {prStatusCount.waitingPO}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Parsial</span>
                      <span className="text-sm font-bold tracking-tight text-amber-500 flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></div>
                        {prStatusCount.partialPO}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Proses</span>
                      <span className="text-sm font-bold tracking-tight text-emerald-500 flex items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></div>
                        {prStatusCount.waitingPart}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Kartu 2: Total PO */}
            <motion.div variants={itemVariants}>
              <Card 
                className="group relative overflow-hidden border-0 bg-white shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col h-full rounded-2xl"
                onClick={() => router.push("/po/monitoring")}
              >
                <div className="absolute -right-4 -bottom-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 group-hover:-rotate-12 duration-500">
                  <ShoppingCart className="h-32 w-32 text-cyan-600" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 space-y-0">
                  <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Total PO Diterbitkan
                  </CardTitle>
                  <div className="h-10 w-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-300">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent className="z-10 pb-4 flex-1">
                  {isLoading ? (
                    <Skeleton className="h-10 w-24 my-1" />
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-slate-800 tabular-nums tracking-tight">
                        <CountUp from={0} to={Number(totalPOItem) || 0} separator="." duration={2.5} />
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-2 font-medium">Berdasarkan data {user?.skema === "PENTACITY" ? "Pentacity" : "Ewalk"}</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Kartu 3: Total BTB (Bisa disembunyikan pakai ternary if seperti sebelumnya) */}
            {(!user || user.id_peran !== 3) && (
              <motion.div variants={itemVariants}>
                <Card 
                  className="group relative overflow-hidden border-0 bg-white shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col h-full rounded-2xl"
                  onClick={() => router.push("/btb/monitoring")}
                >
                  <div className="absolute -right-4 -bottom-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 group-hover:-rotate-12 duration-500">
                    <Package className="h-32 w-32 text-orange-600" />
                  </div>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 space-y-0">
                    <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                      Total BTB Masuk
                    </CardTitle>
                    <div className="h-10 w-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(249,115,22,0.5)] transition-all duration-300">
                      <Package className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent className="z-10 pb-4 flex-1">
                    {isLoading ? (
                      <Skeleton className="h-10 w-24 my-1" />
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-800 tabular-nums tracking-tight">
                          <CountUp from={0} to={Number(totalBTBItem) || 0} separator="." duration={2.5} />
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-2 font-medium">Laporan Tanda Terima Barang</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Kartu 4: Total BKB */}
            <motion.div variants={itemVariants}>
                <Card 
                  className="group relative overflow-hidden border-0 bg-white shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col h-full rounded-2xl"
                  onClick={() => router.push("/bkb/monitoring")}
                >
                  <div className="absolute -right-4 -bottom-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 group-hover:rotate-12 duration-500">
                    <PackageOpen className="h-32 w-32 text-emerald-600" />
                  </div>
                  <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 space-y-0">
                    <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                      Total BKB Keluar
                    </CardTitle>
                    <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-300">
                      <PackageOpen className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent className="z-10 pb-4 flex-1">
                    {isLoading ? (
                      <Skeleton className="h-10 w-24 my-1" />
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-800 tabular-nums tracking-tight">
                          <CountUp from={0} to={Number(totalBKBItem) || 0} separator="." duration={2.5} />
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-2 font-medium">Laporan Pengeluaran Material</p>
                  </CardContent>
                </Card>
            </motion.div>

          </div>


          {/* 4. OPTIMALISASI TAMPILAN GRAFIK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
            
            {/* Bar Chart (Trend Bulanan) */}
            <motion.div variants={itemVariants} className="h-full">
              <Card className="h-full shadow-lg border-0 bg-white rounded-2xl flex flex-col">
                <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-800 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-indigo-600"/> Trend Bulanan PR
                      </CardTitle>
                      <CardDescription className="font-medium mt-1">
                        Aktivitas transaksi perbandingan waktu
                      </CardDescription>
                    </div>
                    
                    {/* Date Range Selectors */}
                    <div className="flex bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden p-1 gap-1 w-full sm:w-auto">
                        <div className="flex flex-col px-2 py-1 bg-slate-50 rounded-md flex-1">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Mulai</span>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-xs font-semibold text-slate-700 w-full outline-none"
                          />
                        </div>
                        <div className="w-px bg-slate-200 shrink-0"></div>
                        <div className="flex flex-col px-2 py-1 bg-slate-50 rounded-md flex-1">
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Akhir</span>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-xs font-semibold text-slate-700 w-full outline-none"
                          />
                        </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 pb-2 px-2 sm:px-6 flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData["current"] || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorProses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                          <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="colorParsial" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                          <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
                        </linearGradient>
                        <linearGradient id="colorMenunggu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B", fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B", fontWeight: 600 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', fontWeight: 600 }}
                        cursor={{fill: '#F1F5F9', opacity: 0.5}}
                      />
                      {/* Using rounded corners for the top of the bars */}
                      <Bar dataKey="waitingPart" fill="url(#colorProses)" name="Proses" radius={[6, 6, 0, 0]} maxBarSize={35} />
                      <Bar dataKey="partialPO" fill="url(#colorParsial)" name="Parsial" radius={[6, 6, 0, 0]} maxBarSize={35} />
                      <Bar dataKey="waitingPO" fill="url(#colorMenunggu)" name="Menunggu" radius={[6, 6, 0, 0]} maxBarSize={35} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Donut Chart (Distribusi Status) */}
            <motion.div variants={itemVariants} className="h-full">
              <Card className="h-full shadow-lg border-0 bg-white rounded-2xl flex flex-col">
                <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center">
                    <PieChartIcon className="w-5 h-5 mr-2 text-indigo-600"/> Breakdown Status Request
                  </CardTitle>
                  <CardDescription className="font-medium mt-1">
                    Persentase tingkat penyelesaian (PR)
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 pb-2 px-2 flex-1 flex flex-col overflow-hidden min-h-[300px] relative">
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8 text-center z-0">
                    <span className="text-4xl font-extrabold text-slate-800 tracking-tighter drop-shadow-sm">{totalPRItem}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total PR</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                    <PieChart>
                      <defs>
                        <linearGradient id="colorPieProses" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#34d399" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#059669" stopOpacity={1}/>
                        </linearGradient>
                        <linearGradient id="colorPieParsial" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#fbbf24" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#d97706" stopOpacity={1}/>
                        </linearGradient>
                        <linearGradient id="colorPieMenunggu" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#60a5fa" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={1}/>
                        </linearGradient>
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.15" />
                        </filter>
                      </defs>
                      <Pie
                        data={pieStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={85}
                        outerRadius={115}
                        stroke="none"
                        paddingAngle={4}
                        dataKey="value"
                        cornerRadius={4}
                        style={{ filter: "url(#shadow)" }}
                      >
                        {pieStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 600 }}
                        itemStyle={{ color: '#1E293B', fontWeight: 600 }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        wrapperStyle={{ fontSize: '13px', fontWeight: 600, color: '#475569', paddingTop: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

          </div>

        </motion.div>
      </div>
    </MainLayout>
  );
}

// Jika ada filter data, pastikan menggunakan skema
// Contoh: data.filter((d) => !userSkema || d.skema === userSkema)
