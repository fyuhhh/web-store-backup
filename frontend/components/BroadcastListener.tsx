"use client";

import { useState, useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

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
                const res = await fetch("http://192.168.10.10:5000/api/broadcast");
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
        <div className="fixed top-4 left-4 z-[9999] w-full max-w-2xl animate-in slide-in-from-top-5 fade-in duration-300">
            <Alert variant="default" className="bg-white border-l-8 border-l-blue-600 shadow-2xl relative pr-12 py-6">
                <AlertCircle className="h-8 w-8 text-blue-600 mt-1" />
                <div className="ml-2">
                    <AlertTitle className="text-blue-800 font-bold text-xl mb-2">Pemberitahuan</AlertTitle>
                    <AlertDescription className="text-slate-700 text-lg leading-relaxed text-justify">
                        {notification.message}
                    </AlertDescription>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 h-8 w-8 text-slate-400 hover:text-slate-600"
                    onClick={() => setVisible(false)}
                >
                    <X className="h-6 w-6" />
                </Button>
            </Alert>
        </div>
    );
}
