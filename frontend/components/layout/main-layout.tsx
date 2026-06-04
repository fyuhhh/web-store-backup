"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, User, ArrowUp, Menu, MessageSquare } from "lucide-react";
import { RoleGuard } from "@/components/ui/role-guard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "@/lib/config";
import { logActivity } from "@/utils/activity";
import { RouteActivityLogger } from "@/components/monitoring/RouteActivityLogger";

interface MainLayoutProps {
  children: React.ReactNode;
}

// Separate component to handle Scroll Logic safely
// This ensures useScroll is only called when the element is actually rendered inside RoleGuard
const MainLayoutContent = ({
  children,
  maintenanceWarning,
  countdown,
  skemaLabel,
  peranLabel,
  divisiLabel,
  userDetail,
  userData,
  handleLogout,
  skemaList = [],
}: {
  children: React.ReactNode;
  maintenanceWarning: string | null;
  countdown: string;
  skemaLabel: string;
  peranLabel: string;
  divisiLabel: string;
  userDetail: any;
  userData: any;
  handleLogout: () => void;
  skemaList?: any[];
}) => {
  const [selectedSkemaId, setSelectedSkemaId] = useState<string>("");
  const id_peran = userDetail?.id_peran ?? userData?.id_peran ?? userData?.role;
  const isDivisi = Number(id_peran) === 2 || String(id_peran).toLowerCase() === "divisi";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentSkema = localStorage.getItem("selectedSkemaId") || String(userDetail?.id_skema ?? userData?.id_skema ?? userData?.skema ?? "");
      setSelectedSkemaId(currentSkema);
    }
  }, [userDetail, userData]);

  const handleSkemaChange = (newSkemaId: string) => {
    localStorage.setItem("selectedSkemaId", newSkemaId);
    setSelectedSkemaId(newSkemaId);
    window.location.reload();
  };
  // --- SMART HEADER & BACK TO TOP LOGIC ---
  const [hidden, setHidden] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Kritik & Saran States
  const [isKritikOpen, setIsKritikOpen] = useState(false);
  const [kritikText, setKritikText] = useState("");
  const [isSubmittingKritik, setIsSubmittingKritik] = useState(false);

  const mainRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll({ container: mainRef });

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    // Hide header if scrolling DOWN and position > 100px
    if (latest > previous && latest > 100) {
      setHidden(true);
    } else {
      setHidden(false);
    }

    // Show BackToTop if scrolled > 300px
    if (latest > 300) {
      setShowBackToTop(true);
    } else {
      setShowBackToTop(false);
    }
  });

  const scrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleKritikSubmit = async () => {
    if (!kritikText.trim()) return;
    setIsSubmittingKritik(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/kritik-saran`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_user: userDetail?.id_user || userData?.id_user || userData?.id,
          nama_pengguna: userDetail?.username || userData?.username || "Unknown User",
          isi: kritikText
        }),
      });

      if (!response.ok) throw new Error("Gagal mengirim kritik & saran");

      alert("Terima kasih atas kritik & saran Anda!");
      setKritikText("");
      setIsKritikOpen(false);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat mengirim kritik & saran. Silakan coba lagi.");
    } finally {
      setIsSubmittingKritik(false);
    }
  };

  return (
    <div className="flex h-screen bg-background relative flex-col">
      {/* Maintenance Warning Banner (Fixed at top, above everything) */}
      {maintenanceWarning && (
        <div className="bg-red-600 text-white px-4 py-3 text-center font-bold sticky top-0 z-[100] shadow-md animate-pulse">
          <div className="flex flex-col md:flex-row items-center justify-center gap-2">
            <span>⚠️ {maintenanceWarning}</span>
            <span className="text-xl bg-white text-red-600 px-2 rounded">{countdown}</span>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* Smart Sticky Header */}
          <motion.header
            variants={{
              visible: { y: 0 },
              hidden: { y: "-100%" },
            }}
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute top-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-md border-b border-border px-6 py-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold text-foreground">
                  Portal {peranLabel} <span className="text-slate-300 mx-1">|</span> {skemaLabel} {divisiLabel ? `(${divisiLabel})` : ""}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                {isDivisi && skemaList && skemaList.length > 0 && (
                  <div className="flex items-center space-x-2 mr-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Skema:</span>
                    <select
                      value={selectedSkemaId}
                      onChange={(e) => handleSkemaChange(e.target.value)}
                      className="h-9 w-32 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer hover:bg-slate-50 font-medium text-slate-700"
                    >
                      {skemaList.map((s: any) => (
                        <option key={s.id_skema} value={String(s.id_skema)}>
                          {s.skema}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm text-muted-foreground mr-2">
                  <User className="h-4 w-4" />
                  <span>{userDetail?.username || userData.username}</span>
                </div>
                
                {/* Kritik & Saran Button */}
                <Dialog open={isKritikOpen} onOpenChange={setIsKritikOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white bg-transparent"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Kritik & Saran
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-white">
                    <DialogHeader>
                      <DialogTitle>Kritik & Saran</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Textarea
                        placeholder="Silahkan isi kritik & saran anda disini...."
                        value={kritikText}
                        onChange={(e) => setKritikText(e.target.value)}
                        className="min-h-[150px]"
                        disabled={isSubmittingKritik}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsKritikOpen(false)} disabled={isSubmittingKritik}>Batal</Button>
                      <Button onClick={handleKritikSubmit} disabled={isSubmittingKritik || !kritikText.trim()} className="bg-primary group relative">
                        {isSubmittingKritik ? "Mengirim..." : "Kirim"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Logout Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Keluar
                </Button>
              </div>
            </div>
          </motion.header>

          {/* Main Content with Top Padding compensation for absolute header */}
          <main
            ref={mainRef}
            className="flex-1 overflow-auto bg-slate-50 p-6 pt-[88px] relative scroll-smooth"
          >
            {children}

            {/* Back to Top Button */}
            <AnimatePresence>
              {showBackToTop && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: 20 }}
                  onClick={scrollToTop}
                  className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-primary text-white shadow-lg shadow-blue-500/30 hover:bg-primary/90 transition-all hover:scale-110 active:scale-95"
                >
                  <ArrowUp className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export function MainLayout({ children }: MainLayoutProps) {
  const [userData, setUserData] = useState<any>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [skemaList, setSkemaList] = useState<any[]>([]);
  const [peranList, setPeranList] = useState<any[]>([]);
  const [divisiList, setDivisiList] = useState<any[]>([]);

  // Maintenance States
  const [maintenanceWarning, setMaintenanceWarning] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("userData");
    if (!stored) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(stored);
    setUserData(parsed);

    // Fetch user detail dari backend
    if (parsed?.id_user) {
      fetch(`${API_BASE_URL}/api/user/${parsed.id_user}`)
        .then((r) => r.json())
        .then((data) => setUserDetail(data))
        .catch(() => setUserDetail(null));
    }

    // Fetch semua skema dan peran dan divisi dari backend
    fetch(API_BASE_URL + "/api/skema")
      .then((r) => r.json())
      .then((data) => setSkemaList(data));
    fetch(API_BASE_URL + "/api/peran")
      .then((r) => r.json())
      .then((data) => setPeranList(data));
    fetch(API_BASE_URL + "/api/divisi")
      .then((r) => r.json())
      .then((data) => setDivisiList(data));

    // --- MAINTENANCE CHECK ---
    let maintenanceData: any = null;

    const tickCountdown = () => {
      if (!maintenanceData || !maintenanceData.isActive) return;
      
      const whitelist = ["141", "90", "89", "85"];
      const currentId = String(parsed.id ?? parsed.id_user ?? "");

      if (!whitelist.includes(currentId)) {
        const now = new Date().getTime();
        const startTime = maintenanceData.startTime ? new Date(maintenanceData.startTime).getTime() : 0;
        const endTime = maintenanceData.endTime ? new Date(maintenanceData.endTime).getTime() : 0;

        // Jika belum lockout (masih dalam grace period 5 menit)
        if (startTime > 0 && now < startTime) {
          const diff = startTime - now;
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setCountdown(`${minutes}m ${seconds}s`);
          setMaintenanceWarning("Akan segera maintenance ketika hitung mundur selesai, segera menyelesaikan/mengehentikan proses/inputan Anda, terima kasih.");
        } else {
          // Sudah lockout
          setMaintenanceWarning(null); // Clear warning to redirect

          // Double check end time validity (backend usually handles auto-disable, but for safety)
          if (endTime === 0 || now < endTime) {
            // Redirect to maintenance page
            if (window.location.pathname !== "/maintenance") {
              window.location.href = "/maintenance";
            }
          }
        }
      }
    };

    const fetchMaintenance = async () => {
      try {
        const res = await fetch(API_BASE_URL + "/api/maintenance", { cache: "no-store", headers: { "Pragma": "no-cache" } });
        const data = await res.json();
        maintenanceData = data;

        if (!data.isActive) {
          setMaintenanceWarning(null);
        } else {
          tickCountdown();
        }
      } catch (e) {
        console.error("Maintenance check failed", e);
      }
    };

    fetchMaintenance();
    const fetchInterval = setInterval(fetchMaintenance, 60000); // Check API every 60s (reduces backend log spam)
    const tickInterval = setInterval(tickCountdown, 1000); // Check local countdown every 1s

    return () => {
      clearInterval(fetchInterval);
      clearInterval(tickInterval);
    };

  }, [router]);

  // These hooks MUST be before any early return (Rules of Hooks)
  const [activeSkemaId, setActiveSkemaId] = useState<string | null>(null);

  // Derive peran/skema info (safe to compute even when userData is null)
  const rawSkema = userDetail?.id_skema ?? userData?.id_skema ?? userData?.skema;
  const id_peran = userDetail?.id_peran ?? userData?.id_peran ?? userData?.role;
  const id_divisi = userDetail?.id_divisi ?? userData?.id_divisi;
  const isDivisi = Number(id_peran) === 2 || String(id_peran ?? "").toLowerCase() === "divisi";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const selected = localStorage.getItem("selectedSkemaId");
      if (isDivisi && selected) {
        setActiveSkemaId(selected);
      } else {
        setActiveSkemaId(rawSkema ? String(rawSkema) : null);
      }
    }
  }, [rawSkema, isDivisi]);

  const handleLogout = async () => {
    try {
      const stored = localStorage.getItem("userData");
      if (stored) {
        const u = JSON.parse(stored);
        await logActivity({
          id_user: u.id_user || u.id,
          nama_pengguna: u.username || u.nama_pengguna || "Unknown",
          action_type: "LOGOUT",
          details: "User keluar dari sistem"
        });
      }
    } catch (e) { console.error("Logout log failed", e); }

    import("@/lib/socket").then(({ socket }) => {
      socket.disconnect();
    });
    localStorage.removeItem("userData");
    localStorage.removeItem("selectedSkemaId");
    router.push("/login");
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  const id_skema = activeSkemaId ?? rawSkema;

  // Cari label skema dan peran dari list
  const skemaLabel =
    skemaList.find((s: any) => String(s.id_skema) === String(id_skema))
      ?.skema || "-";
  const peranLabel =
    peranList.find((p: any) => String(p.id_peran) === String(id_peran))
      ?.peran || "-";
  const divisiLabel =
    divisiList.find((d: any) => String(d.id_divisi) === String(id_divisi))
      ?.divisi || "";

  return (
    <RoleGuard allowed={[
      "/dashboard/rekap-full",
      "/maintenance/admin",
      "/divisi/dashboard",
      "/divisi/pesanan-anda"
    ]}>
      <MainLayoutContent
        maintenanceWarning={maintenanceWarning}
        countdown={countdown}
        skemaLabel={skemaLabel}
        peranLabel={peranLabel}
        divisiLabel={divisiLabel}
        userDetail={userDetail}
        userData={userData}
        handleLogout={handleLogout}
        skemaList={skemaList}
      >
        <RouteActivityLogger />
        {children}
      </MainLayoutContent>
    </RoleGuard>
  );
}

// --- SUB-COMPONENT FOR SCROLL LOGIC ---
interface ScrollLogicProps {
  containerRef: React.RefObject<HTMLElement | null>;
  setHidden: (hidden: boolean) => void;
  setShowBackToTop: (show: boolean) => void;
}

function ScrollLogic({ containerRef, setHidden, setShowBackToTop }: ScrollLogicProps) {
  const { scrollY } = useScroll({ container: containerRef });

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;

    // Hide header if scrolling DOWN and position > 100px
    if (latest > previous && latest > 100) {
      setHidden(true);
    } else {
      setHidden(false);
    }

    // Show BackToTop if scrolled > 300px
    if (latest > 300) {
      setShowBackToTop(true);
    } else {
      setShowBackToTop(false);
    }
  });

  return null;
}
