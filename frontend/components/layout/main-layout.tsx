"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { RoleGuard } from "@/components/ui/role-guard";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [userData, setUserData] = useState<any>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [skemaList, setSkemaList] = useState<any[]>([]);
  const [peranList, setPeranList] = useState<any[]>([]);
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
      fetch(`http://192.168.10.10:5000/api/user/${parsed.id_user}`)
        .then((r) => r.json())
        .then((data) => setUserDetail(data))
        .catch(() => setUserDetail(null));
    }

    // Fetch semua skema dan peran dari backend
    fetch("http://192.168.10.10:5000/api/skema")
      .then((r) => r.json())
      .then((data) => setSkemaList(data));
    fetch("http://192.168.10.10:5000/api/peran")
      .then((r) => r.json())
      .then((data) => setPeranList(data));

    // --- MAINTENANCE CHECK ---
    const checkMaintenance = async () => {
      try {
        const res = await fetch("http://192.168.10.10:5000/api/maintenance");
        const data = await res.json();
        if (data.isActive) {
          const whitelist = ["141", "90", "89", "85"];
          const currentId = String(parsed.id ?? parsed.id_user ?? "");
          if (!whitelist.includes(currentId)) {
            // Redirect to maintenance page
            // But wait, if we use router.push, we need to ensure we are not already there
            // Since MainLayout is likely NOT used on maintenance page, this is safe.
            // However, to be extra safe:
            if (window.location.pathname !== "/maintenance") {
              window.location.href = "/maintenance";
            }
          }
        }
      } catch (e) {
        console.error("Maintenance check failed", e);
      }
    };

    checkMaintenance();
    const interval = setInterval(checkMaintenance, 10000); // Check every 10s
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

  // Cari label skema dan peran dari list
  const skemaLabel =
    skemaList.find((s: any) => String(s.id_skema) === String(id_skema))
      ?.skema || "-";
  const peranLabel =
    peranList.find((p: any) => String(p.id_peran) === String(id_peran))
      ?.peran || "-";

  return (
    <RoleGuard allowed={["/dashboard/rekap-full", "/maintenance/admin"]}>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Sistem Monitoring Purchasing dan Store | {skemaLabel}
                </h1>
                {/* <p className="text-sm text-muted-foreground">
                  Skema: {skemaLabel} | Role: {peranLabel}
                </p> */}
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
          </header>

          <main className="flex-1 overflow-auto bg-background p-6">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
