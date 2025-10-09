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
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("userData");
    if (!stored) {
      router.push("/login");
      return;
    }
    setUserData(JSON.parse(stored));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("userData");
    router.push("/login");
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <RoleGuard allowed={["/dashboard/rekap-full"]}>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Sistem Monitoring PR-PO-BTB-BKB
                </h1>
                <p className="text-sm text-muted-foreground">
                  Schema: {userData.schema} | Role: {userData.role}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{userData.username}</span>
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
