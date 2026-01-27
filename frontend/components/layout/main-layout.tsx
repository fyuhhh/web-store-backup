"use client";

import React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, User, ArrowUp } from "lucide-react";
import { RoleGuard } from "@/components/ui/role-guard";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [userData, setUserData] = useState<any>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [skemaList, setSkemaList] = useState<any[]>([]);
  const [peranList, setPeranList] = useState<any[]>([]);
  const [divisiList, setDivisiList] = useState<any[]>([]);

  // Maintenance States
  const [maintenanceWarning, setMaintenanceWarning] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>("");

  // --- SMART HEADER & BACK TO TOP LOGIC ---
  const [hidden, setHidden] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const mainRef = React.useRef<HTMLElement>(null);
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

  const router = useRouter();

  const scrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      fetch(`http://192.168.10.10:5000/api/user/${parsed.id_user}`)
        .then((r) => r.json())
        .then((data) => setUserDetail(data))
        .catch(() => setUserDetail(null));
    }

    // Fetch semua skema dan peran dan divisi dari backend
    fetch("http://192.168.10.10:5000/api/skema")
      .then((r) => r.json())
      .then((data) => setSkemaList(data));
    fetch("http://192.168.10.10:5000/api/peran")
      .then((r) => r.json())
      .then((data) => setPeranList(data));
    fetch("http://192.168.10.10:5000/api/divisi")
      .then((r) => r.json())
      .then((data) => setDivisiList(data));

    // --- MAINTENANCE CHECK ---
    const checkMaintenance = async () => {
      try {
        const res = await fetch("http://192.168.10.10:5000/api/maintenance", { cache: "no-store", headers: { "Pragma": "no-cache" } });
        const data = await res.json();

        if (data.isActive) {
          const whitelist = ["141", "90", "89", "85"];
          const currentId = String(parsed.id ?? parsed.id_user ?? "");

          if (!whitelist.includes(currentId)) {
            const now = new Date().getTime();
            const startTime = data.startTime ? new Date(data.startTime).getTime() : 0;
            const endTime = data.endTime ? new Date(data.endTime).getTime() : 0;

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
        } else {
          setMaintenanceWarning(null);
        }
      } catch (e) {
        console.error("Maintenance check failed", e);
      }
    };

    checkMaintenance();
    const interval = setInterval(checkMaintenance, 1000); // Check every 1s for smooth countdown
    return () => clearInterval(interval);

  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("userData");
    router.push("/login");
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  // Ambil id_skema dan id_peran dari userDetail, fallback ke userData
  const id_skema = userDetail?.id_skema ?? userData.id_skema ?? userData.skema;
  const id_peran = userDetail?.id_peran ?? userData.id_peran ?? userData.role;
  const id_divisi = userDetail?.id_divisi ?? userData.id_divisi;

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

  // --- SMART HEADER & BACK TO TOP LOGIC --- (Moved to top)


  return (
    <RoleGuard allowed={[
      "/dashboard/rekap-full",
      "/maintenance/admin",
      "/divisi/dashboard",
      "/divisi/pesanan-anda"
    ]}>
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
          <Sidebar />
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
                <div>
                  <h1 className="text-xl font-semibold text-foreground">
                    Sistem Monitoring Purchasing dan Store | {skemaLabel} {divisiLabel ? `(${divisiLabel})` : ""}
                  </h1>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{userDetail?.username || userData.username}</span>
                  </div>
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
              className="flex-1 overflow-auto bg-background p-6 pt-[88px] relative scroll-smooth"
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
    </RoleGuard>
  );
}
