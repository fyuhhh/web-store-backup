"use client";

import React, { useEffect, useState } from "react";
import { Timer, Clock, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { formatDuration, intervalToDuration, type Duration } from "date-fns";
import { id } from "date-fns/locale";
import { API_BASE_URL } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function MaintenancePage() {
    const [endTime, setEndTime] = useState<string | null>(null);
    const [description, setDescription] = useState("");
    const [timeLeft, setTimeLeft] = useState<Duration | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch(API_BASE_URL + "/api/maintenance", { cache: "no-store" });
                const data = await res.json();

                if (data.isActive) {
                    // Check grace period
                    const now = new Date().getTime();
                    const startTime = data.startTime ? new Date(data.startTime).getTime() : 0;

                    if (startTime > 0 && now < startTime) {
                        const userRaw = localStorage.getItem("userData");
                        let targetPath = "/dashboard";
                        if (userRaw) {
                            try {
                                const u = JSON.parse(userRaw);
                                if (Number(u.id_peran) === 2) targetPath = "/divisi/dashboard";
                            } catch { }
                        }
                        window.location.href = targetPath;
                        return;
                    }
                    setEndTime(data.endTime);
                    setDescription(data.description);
                } else {
                    localStorage.removeItem("userData");
                    window.location.href = "/login";
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchStatus();
        const pollInterval = setInterval(fetchStatus, 10000);
        return () => clearInterval(pollInterval);
    }, []);

    useEffect(() => {
        if (!endTime) return;
        const updateTimer = () => {
            const end = new Date(endTime);
            const now = new Date();
            if (now >= end) setTimeLeft(null);
            else setTimeLeft(intervalToDuration({ start: now, end: end }));
        };
        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [endTime]);


    const handleBackToLogin = () => {
        localStorage.removeItem("userData");
        window.location.href = "/login";
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-50">
            {/* Background Decor */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
            <div className="absolute top-0 right-0 -tranlsate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-100/50 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 w-full max-w-lg px-4">
                <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                    <CardContent className="p-8 sm:p-10 text-center">

                        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner ring-4 ring-white">
                            <Timer className="w-10 h-10 text-amber-600 animate-pulse" />
                        </div>

                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">
                            Sistem Dalam Perbaikan
                        </h1>

                        <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                            Kami sedang melakukan pemeliharaan sistem untuk meningkatkan performa layanan.
                        </p>

                        {/* Status Box */}
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 mb-8 mx-auto w-full">
                            {timeLeft ? (
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest text-[11px]">
                                        Estimasi Selesai
                                    </p>
                                    <div className="flex items-baseline justify-center gap-1 font-mono text-slate-900">
                                        <span className="text-3xl font-bold tabular-nums tracking-tighter sm:text-4xl text-blue-600">
                                            {formatDuration(timeLeft, { format: ['hours'], locale: id, zero: true }).replace(' jam', '') || '00'}
                                        </span>
                                        <span className="text-sm font-medium text-slate-400 mr-2">j</span>
                                        <span className="text-3xl font-bold tabular-nums tracking-tighter sm:text-4xl text-blue-600">
                                            {formatDuration(timeLeft, { format: ['minutes'], locale: id, zero: true }).replace(' menit', '') || '00'}
                                        </span>
                                        <span className="text-sm font-medium text-slate-400 mr-2">m</span>
                                        <span className="text-3xl font-bold tabular-nums tracking-tighter sm:text-4xl text-blue-600">
                                            {formatDuration(timeLeft, { format: ['seconds'], locale: id, zero: true }).replace(' detik', '') || '00'}
                                        </span>
                                        <span className="text-sm font-medium text-slate-400">d</span>
                                    </div>
                                </div>
                            ) : endTime ? (
                                <div className="flex items-center justify-center gap-2 text-green-600 font-medium animate-bounce">
                                    <RefreshCw className="w-5 h-5" />
                                    Hampir Selesai...
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-amber-600">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span className="font-medium">Jadwal belum ditentukan</span>
                                </div>
                            )}

                            {/* Description */}
                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <p className="text-sm text-slate-600 font-medium italic">
                                    "{description || 'Perbaikan rutin sistem'}"
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={handleBackToLogin}
                                className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Kembali ke Halaman Login
                            </Button>
                            <p className="text-xs text-slate-400 mt-2">
                                Halaman akan memuat ulang otomatis saat selesai.
                            </p>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
