"use client";

import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import "dayjs/locale/id";

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

  useEffect(() => {
    // Fetch total PR item
    fetch("http://192.168.10.10:5000/api/pr")
      .then((r) => r.json())
      .then((data) => setTotalPRItem(Array.isArray(data) ? data.length : 0));
    // Fetch total PO item
    fetch("http://192.168.10.10:5000/api/po")
      .then((r) => r.json())
      .then((data) => setTotalPOItem(Array.isArray(data) ? data.length : 0));
    // Fetch total BTB item
    fetch("http://192.168.10.10:5000/api/btb")
      .then((r) => r.json())
      .then((data) => setTotalBTBItem(Array.isArray(data) ? data.length : 0));
    // Fetch total BKB item
    fetch("http://192.168.10.10:5000/api/bkb")
      .then((r) => r.json())
      .then((data) => setTotalBKBItem(Array.isArray(data) ? data.length : 0));

    // Fetch status PR dari backend (GLOBAL COUNT - NO FILTER)
    fetch("http://192.168.10.10:5000/api/pr")
      .then((r) => r.json())
      .then((data) => {
        let waitingPart = 0,
          partialPO = 0,
          waitingPO = 0;
        if (Array.isArray(data)) {
          data.forEach((pr) => {
            // Mapping Status
            // Mapping Status (Case Insensitive & Inclusive)
            const s = (pr.status || "").toUpperCase();
            if (s === "WAITING PART" || s === "DIPROSES" || s === "SELESAI" || s === "TELAH SELESAI") waitingPart++;
            else if (s === "PARTIAL PO" || s === "PARCIAL PO" || s === "GANTUNG") partialPO++;
            else if (s === "WAITING PO" || s === "MENUNGGU") waitingPO++;
          });
        }
        setPrStatusCount({ waitingPart, partialPO, waitingPO });
      });

    // Fetch status PR untuk distribusi status dan trend bulanan (FILTERED BY DATE)
    fetch("http://192.168.10.10:5000/api/pr")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;

        // 1. FILTER DATA BY RANGE
        const filtered = data.filter((pr) => {
          if (!pr.tanggalPR) return false;
          // compare as day (ignoring time)
          const prDate = dayjs(pr.tanggalPR);
          // inclusive [start, end]
          return prDate.isBetween(startDate, endDate, "day", "[]");
        });

        // 2. Distribusi Status (Filtered)
        let waitingPart = 0,
          partialPO = 0,
          waitingPO = 0;

        filtered.forEach((pr) => {
          const s = (pr.status || "").toUpperCase();
          if (s === "WAITING PART" || s === "DIPROSES" || s === "SELESAI" || s === "TELAH SELESAI") waitingPart++;
          else if (s === "PARTIAL PO" || s === "PARCIAL PO" || s === "GANTUNG") partialPO++;
          else if (s === "WAITING PO" || s === "MENUNGGU") waitingPO++;
        });
        setPrStatusDist({ waitingPart, partialPO, waitingPO });

        // 3. Trend Bulanan (Based on Filtered Data)
        // Group by Year-Month
        const grouped: { [key: string]: any } = {};

        filtered.forEach((pr) => {
          const date = dayjs(pr.tanggalPR);
          const key = date.format("MMM YYYY"); // e.g. "Jan 2025"
          const monthLabel = date.format("MMM"); // "Jan"

          if (!grouped[key]) {
            grouped[key] = {
              month: monthLabel, // X-Axis label
              fullDate: date.valueOf(), // For sorting
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

        // Convert to array and Sort by date
        const result = Object.values(grouped).sort((a, b) => a.fullDate - b.fullDate);
        setTrendData({ current: result });
      });
  }, [startDate, endDate]);

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

  // PieChart data for Distribusi Status (pakai PR, bukan PO)
  const pieStatusData = [
    {
      name: "Waiting Part",
      value: prStatusDist.waitingPart,
      color: "hsl(var(--success))", // Green
    },
    {
      name: "Partial PO",
      value: prStatusDist.partialPO,
      color: "hsl(30, 90%, 55%)", // Orange (approx) or use a variable if available
    },
    {
      name: "Waiting PO",
      value: prStatusDist.waitingPO,
      color: "hsl(210, 90%, 55%)", // Blue (approx)
    },
  ];

  // State for fade-in animation
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    // Mulai dari opacity 0, lalu set ke 1 agar animasi fade-in
    setTimeout(() => setIsMounted(true), 10);
  }, []);

  // Tambahkan state untuk animasi count up
  const [displayPR, setDisplayPR] = useState(0);
  const [displayPO, setDisplayPO] = useState(0);
  const [displayBTB, setDisplayBTB] = useState(0);
  const [displayBKB, setDisplayBKB] = useState(0);

  // Animasi count up untuk Total PR
  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    let from = 0;
    let to = totalPRItem;
    let duration = 900;

    function animateCountUp(ts: number) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const value = Math.floor(from + (to - from) * easeOutExpo(progress));
      setDisplayPR(value);
      if (progress < 1) {
        raf = requestAnimationFrame(animateCountUp);
      } else {
        setDisplayPR(to);
      }
    }
    function easeOutExpo(x: number) {
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }
    start = null;
    from = 0;
    to = totalPRItem;
    setDisplayPR(0);
    raf = requestAnimationFrame(animateCountUp);
    return () => cancelAnimationFrame(raf);
  }, [totalPRItem]);

  // Animasi count up untuk Total PO
  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    let from = 0;
    let to = totalPOItem;
    let duration = 900;

    function animateCountUp(ts: number) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const value = Math.floor(from + (to - from) * easeOutExpo(progress));
      setDisplayPO(value);
      if (progress < 1) {
        raf = requestAnimationFrame(animateCountUp);
      } else {
        setDisplayPO(to);
      }
    }
    function easeOutExpo(x: number) {
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }
    start = null;
    from = 0;
    to = totalPOItem;
    setDisplayPO(0);
    raf = requestAnimationFrame(animateCountUp);
    return () => cancelAnimationFrame(raf);
  }, [totalPOItem]);

  // Animasi count up untuk Total BTB
  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    let from = 0;
    let to = totalBTBItem;
    let duration = 900;

    function animateCountUp(ts: number) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const value = Math.floor(from + (to - from) * easeOutExpo(progress));
      setDisplayBTB(value);
      if (progress < 1) {
        raf = requestAnimationFrame(animateCountUp);
      } else {
        setDisplayBTB(to);
      }
    }
    function easeOutExpo(x: number) {
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }
    start = null;
    from = 0;
    to = totalBTBItem;
    setDisplayBTB(0);
    raf = requestAnimationFrame(animateCountUp);
    return () => cancelAnimationFrame(raf);
  }, [totalBTBItem]);

  // Animasi count up untuk Total BKB
  useEffect(() => {
    let raf: number;
    let start: number | null = null;
    let from = 0;
    let to = totalBKBItem;
    let duration = 900;

    function animateCountUp(ts: number) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const value = Math.floor(from + (to - from) * easeOutExpo(progress));
      setDisplayBKB(value);
      if (progress < 1) {
        raf = requestAnimationFrame(animateCountUp);
      } else {
        setDisplayBKB(to);
      }
    }
    function easeOutExpo(x: number) {
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }
    start = null;
    from = 0;
    to = totalBKBItem;
    setDisplayBKB(0);
    raf = requestAnimationFrame(animateCountUp);
    return () => cancelAnimationFrame(raf);
  }, [totalBKBItem]);

  const router = useRouter();

  // State untuk user (tambahan)
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userRaw = localStorage.getItem("userData");
      if (userRaw) {
        try {
          setUser(JSON.parse(userRaw));
        } catch { }
      }
    }
  }, []);

  return (
    <MainLayout>
      <div
        className={`transition-all duration-700 ${isMounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
      >
        {/* Jam digital besar dan tanggal */}
        <div className="flex flex-col items-center justify-center py-2">
          <div
            style={{
              fontSize: "3.5rem",
              fontWeight: "bold",
              letterSpacing: "0.08em",
              fontFamily: "monospace",
              color: "#3396D3",
              textShadow: "0 2px 12px #3396d355",
              background: "rgba(255,255,255,0.7)",
              borderRadius: "1.5rem",
              padding: "0.5rem 2rem",
              marginBottom: "0.5rem",
              boxShadow: "0 2px 16px #3396d322",
              userSelect: "none",
            }}
          >
            {formatTime(now)}
          </div>
          <div className="text-xl font-semibold mt-2 text-muted-foreground">
            {formatDate(now)}
          </div>
        </div>

        {/* KPI Cards */}
        {user && user.id_peran === 4 ? (
          // Hanya tampilkan PR, BTB, BKB untuk id_peran 4 (Stock/Store)
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 w-full max-w-6xl">
              {/* Total PR */}
              <div
                className="kpi-card-anim"
                tabIndex={0}
                role="button"
                onClick={() => router.push("/pr/monitoring")}
                style={{ outline: "none" }}
              >
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total PR
                    </CardTitle>
                    <FileText className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold text-foreground"
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        transition: "color 0.3s",
                        minHeight: "2.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                      }}
                    >
                      <span
                        key={displayPR}
                        className="pr-1 animate-countup"
                        style={{
                          display: "inline-block",
                          minWidth: "2ch",
                        }}
                      >
                        {displayPR}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground"></p>
                  </CardContent>
                </Card>
              </div>
              {/* Total BTB */}
              <div
                className="kpi-card-anim"
                tabIndex={0}
                role="button"
                onClick={() => router.push("/btb/monitoring")}
                style={{ outline: "none" }}
              >
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total BTB
                    </CardTitle>
                    <Package className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold text-foreground"
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        transition: "color 0.3s",
                        minHeight: "2.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                      }}
                    >
                      <span
                        key={displayBTB}
                        className="pr-1 animate-countup"
                        style={{
                          display: "inline-block",
                          minWidth: "2ch",
                        }}
                      >
                        {displayBTB}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground"></p>
                  </CardContent>
                </Card>
              </div>
              {/* Total BKB */}
              <div
                className="kpi-card-anim"
                tabIndex={0}
                role="button"
                onClick={() => router.push("/bkb/monitoring")}
                style={{ outline: "none" }}
              >
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total BKB
                    </CardTitle>
                    <PackageOpen className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold text-foreground"
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        transition: "color 0.3s",
                        minHeight: "2.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                      }}
                    >
                      <span
                        key={displayBKB}
                        className="pr-1 animate-countup"
                        style={{
                          display: "inline-block",
                          minWidth: "2ch",
                        }}
                      >
                        {displayBKB}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground"></p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : user && user.id_peran === 3 ? (
          // Hanya tampilkan PO untuk id_peran 3 (Purchasing)
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-6 w-full max-w-md">
              {/* Total PO */}
              <div
                className="kpi-card-anim"
                tabIndex={0}
                role="button"
                onClick={() => router.push("/po/monitoring")}
                style={{ outline: "none" }}
              >
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total PO
                    </CardTitle>
                    <ShoppingCart className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold text-foreground"
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        transition: "color 0.3s",
                        minHeight: "2.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                      }}
                    >
                      <span
                        key={displayPO}
                        className="pr-1 animate-countup"
                        style={{
                          display: "inline-block",
                          minWidth: "2ch",
                        }}
                      >
                        {displayPO}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground"></p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          // Untuk user lain: 4 card seperti biasa
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total PR */}
            <div
              className="kpi-card-anim"
              tabIndex={0}
              role="button"
              onClick={() => router.push("/pr/monitoring")}
              style={{ outline: "none" }}
            >
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total PR
                  </CardTitle>
                  <FileText className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div
                    className="text-2xl font-bold text-foreground"
                    style={{
                      fontVariantNumeric: "tabular-nums",
                      transition: "color 0.3s",
                      minHeight: "2.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                  >
                    <span
                      key={displayPR}
                      className="pr-1 animate-countup"
                      style={{
                        display: "inline-block",
                        minWidth: "2ch",
                      }}
                    >
                      {displayPR}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground"></p>
                </CardContent>
              </Card>
            </div>
            {/* Total PO */}
            <div
              className="kpi-card-anim"
              tabIndex={0}
              role="button"
              onClick={() => router.push("/po/monitoring")}
              style={{ outline: "none" }}
            >
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total PO
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div
                    className="text-2xl font-bold text-foreground"
                    style={{
                      fontVariantNumeric: "tabular-nums",
                      transition: "color 0.3s",
                      minHeight: "2.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                  >
                    <span
                      key={displayPO}
                      className="pr-1 animate-countup"
                      style={{
                        display: "inline-block",
                        minWidth: "2ch",
                      }}
                    >
                      {displayPO}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground"></p>
                </CardContent>
              </Card>
            </div>
            {/* Total BTB (hanya tampil jika bukan user divisi) */}
            {!user || user.id_peran !== 3 ? (
              <div
                className="kpi-card-anim"
                tabIndex={0}
                role="button"
                onClick={() => router.push("/btb/monitoring")}
                style={{ outline: "none" }}
              >
                <Card className="bg-card border-border">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total BTB
                    </CardTitle>
                    <Package className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold text-foreground"
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        transition: "color 0.3s",
                        minHeight: "2.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                      }}
                    >
                      <span
                        key={displayBTB}
                        className="pr-1 animate-countup"
                        style={{
                          display: "inline-block",
                          minWidth: "2ch",
                        }}
                      >
                        {displayBTB}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground"></p>
                  </CardContent>
                </Card>
              </div>
            ) : null}
            {/* Total BKB */}
            <div
              className="kpi-card-anim"
              tabIndex={0}
              role="button"
              onClick={() => router.push("/bkb/monitoring")}
              style={{ outline: "none" }}
            >
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total BKB
                  </CardTitle>
                  <PackageOpen className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div
                    className="text-2xl font-bold text-foreground"
                    style={{
                      fontVariantNumeric: "tabular-nums",
                      transition: "color 0.3s",
                      minHeight: "2.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                    }}
                  >
                    <span
                      key={displayBKB}
                      className="pr-1 animate-countup"
                      style={{
                        display: "inline-block",
                        minWidth: "2ch",
                      }}
                    >
                      {displayBKB}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground"></p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Status Overview di tengah */}
        <div className="flex justify-center">
          <Card className="bg-card border-border min-w-[320px] max-w-md w-full">
            <CardHeader>
              <CardTitle>Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-row gap-4 justify-between items-center px-2">
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-5 w-5 text-success mb-1" />
                  <span className="text-[10px] text-center whitespace-nowrap">Waiting Part</span>
                  <span className="text-base font-bold text-success">
                    {prStatusCount.waitingPart}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <Clock className="h-5 w-5 text-orange-500 mb-1" />
                  <span className="text-[10px] text-center whitespace-nowrap">Partial PO</span>
                  <span className="text-base font-bold text-orange-500">
                    {prStatusCount.partialPO}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <TrendingDown className="h-5 w-5 text-blue-500 mb-1" />
                  <span className="text-[10px] text-center whitespace-nowrap">Waiting PO</span>
                  <span className="text-base font-bold text-blue-500">
                    {prStatusCount.waitingPO}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <style jsx>{`
          .kpi-card-anim {
            transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.22s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            border-radius: 1rem;
          }
          .kpi-card-anim:hover,
          .kpi-card-anim:focus {
            transform: scale(1.045) translateY(-2px);
            box-shadow: 0 4px 24px #3396d322;
            z-index: 2;
          }
          .animate-countup {
            animation: countup-fadeup 0.5s cubic-bezier(0.4, 2, 0.6, 1);
            box-shadow: 0 6px 18px -6px #3396d355;
            border-radius: 0.4em;
            background: rgba(255, 255, 255, 0.7);
            padding: 0.1em 0.5em;
          }
          @keyframes countup-fadeup {
            0% {
              opacity: 0;
              transform: translateY(16px) scale(1.08);
              box-shadow: 0 12px 32px -8px #3396d355;
            }
            60% {
              opacity: 1;
              transform: translateY(-4px) scale(1.02);
              box-shadow: 0 8px 24px -8px #3396d355;
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
              box-shadow: 0 6px 18px -6px #3396d355;
            }
          }
        `}</style>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Trend Bulanan</CardTitle>
              <CardDescription>
                Aktivitas Perbulan
                {/* Year selector */}
                {/* Date Range Selectors */}
                <div className="flex flex-col xl:flex-row gap-2 mt-2 xl:mt-0 items-start xl:items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Dari
                    </span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-2 py-1 h-8 border border-slate-200 bg-white rounded-md text-xs w-[130px] shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Sampai
                    </span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-2 py-1 h-8 border border-slate-200 bg-white rounded-md text-xs w-[130px] shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendData["current"] || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="waitingPart"
                    fill="hsl(var(--success))"
                    name="Waiting Part"
                  />
                  <Bar
                    dataKey="partialPO"
                    fill="hsl(30, 90%, 55%)"
                    name="Partial PO"
                  />
                  <Bar
                    dataKey="waitingPO"
                    fill="hsl(210, 90%, 55%)"
                    name="Waiting PO"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Distribusi Status</CardTitle>
              <CardDescription>
                Status PR: Waiting Part, Partial PO, Waiting PO
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Supplier Performance */}
        {/* HAPUS Evaluasi Supplier */}
        {/* <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Evaluasi Supplier</CardTitle>
            <CardDescription>
              Performance supplier berdasarkan rating dan ketepatan waktu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {supplierData.map((supplier, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">
                      {supplier.name}
                    </h4>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                      <span>Rating: {supplier.rating}/5</span>
                      <span>Orders: {supplier.orders}</span>
                      <span>On-time: {supplier.onTime}%</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={supplier.onTime} className="w-20 h-2" />
                    <Badge
                      variant={
                        supplier.onTime >= 90
                          ? "default"
                          : supplier.onTime >= 80
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {supplier.onTime >= 90
                        ? "Excellent"
                        : supplier.onTime >= 80
                        ? "Good"
                        : "Poor"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}
      </div>
    </MainLayout>
  );
}

// Jika ada filter data, pastikan menggunakan skema
// Contoh: data.filter((d) => !userSkema || d.skema === userSkema)
