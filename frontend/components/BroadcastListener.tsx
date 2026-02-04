"use client";

import { useState, useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { API_BASE_URL } from "@/lib/config";

export function BroadcastListener() {
    const [notification, setNotification] = useState<{
        message: string;
        isActive: boolean;
    } | null>(null);
    const [visible, setVisible] = useState(false);

    const pathname = usePathname();

    useEffect(() => {
        // Hanya jalankan di client
        if (typeof window === "undefined") return;

        // Requirement: "pokoknya saat login terus di dashboard" 
        // -> Hanya tampil jika di halaman /dashboard
        if (pathname !== "/dashboard") return;

        // Fungsi fetch status
        const checkBroadcast = async () => {
            try {
                const res = await fetch(API_BASE_URL + "/api/broadcast");
                if (!res.ok) return;
                const data = await res.json();

                if (data.isActive && data.message) {
                    // Cek Session Storage untuk "Once per Session" (prevent refresh re-show)
                    // Gunakan ID unik: endTime + UserID agar spesifik per user
                    let currentUserId = "anon";
                    try {
                        const userRaw = localStorage.getItem("userData");
                        if (userRaw) {
                            const u = JSON.parse(userRaw);
                            currentUserId = String(u.id || u.id_user);
                        }
                    } catch { }

                    // Format key: broadcast_seen_<endTime>_<userId>
                    const seenKey = `broadcast_seen_${data.endTime}_${currentUserId}`;

                    if (sessionStorage.getItem(seenKey)) {
                        // Sudah dilihat di sesi ini oleh user ini
                        return;
                    }


                    setNotification(data);
                    setVisible(true);

                    // Tandai sudah dilihat agar tidak muncul saat refresh
                    sessionStorage.setItem(seenKey, "true");

                    // Auto hide after 60 seconds
                    const timer = setTimeout(() => {
                        setVisible(false);
                    }, 60000); // 60 detik

                    return () => clearTimeout(timer);
                }
            } catch (err) {
                console.error("Failed to fetch broadcast", err);
            }
        };

        checkBroadcast();

    }, [pathname]);

    if (!visible || !notification) return null;

    return (
        <div className="fixed top-0 left-0 w-full z-[9999] flex justify-center pt-6 px-4 animate-in slide-in-from-top-full duration-500 fade-in">
            <div className="relative w-full max-w-3xl bg-white/95 backdrop-blur-md border border-blue-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl overflow-hidden ring-1 ring-black/5 dark:bg-slate-900/95 dark:border-slate-800">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-cyan-500" />

                <div className="flex p-5 gap-5">
                    <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm animate-pulse dark:bg-blue-900/20 dark:border-blue-800">
                            <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2 dark:text-slate-100">
                            Pemberitahuan Sistem
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-300">
                                Penting
                            </span>
                        </h3>
                        <p className="text-slate-600 text-[15px] leading-relaxed dark:text-slate-300">
                            {notification.message}
                        </p>
                    </div>

                    <div className="flex-shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            onClick={() => setVisible(false)}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Progress bar for auto-dismiss could be cool, but sticking to simple active border for now */}
            </div>
        </div>
    );
}
