"use client";

import React, { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { formatDuration, intervalToDuration, type Duration } from "date-fns";
import { id } from "date-fns/locale";

export default function MaintenancePage() {
    const [endTime, setEndTime] = useState<string | null>(null);
    const [description, setDescription] = useState("");
    const [timeLeft, setTimeLeft] = useState<Duration | null>(null);

    useEffect(() => {
        // Initial fetch
        const fetchStatus = async () => {
            try {
                const res = await fetch("http://192.168.10.10:5000/api/maintenance");
                const data = await res.json();
                if (data.isActive) {
                    setEndTime(data.endTime);
                    setDescription(data.description);
                } else {
                    // If not active, redirect back to dashboard
                    window.location.href = "/dashboard";
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchStatus();

        // Polling every 10 seconds to check if maintenance is over
        const pollInterval = setInterval(fetchStatus, 10000);
        return () => clearInterval(pollInterval);
    }, []);

    useEffect(() => {
        if (!endTime) return;

        const timer = setInterval(() => {
            const end = new Date(endTime);
            const now = new Date();
            if (now >= end) {
                setTimeLeft(null);
                // Optionally refresh to see if status changed or just wait for poll
            } else {
                const duration = intervalToDuration({ start: now, end: end });
                setTimeLeft(duration);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [endTime]);

    // Format time remaining
    const formatTime = (duration: Duration) => {
        return formatDuration(duration, {
            format: ['days', 'hours', 'minutes', 'seconds'],
            locale: id,
            delimiter: ', '
        })
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900 p-4">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="flex justify-center">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                        <Timer className="w-12 h-12 text-blue-600" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold tracking-tight">Sedang Maintenance</h1>

                {timeLeft ? (
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <p className="text-sm text-gray-500 mb-2 uppercase tracking-wide font-semibold">Estimasi Selesai Dalam</p>
                        <p className="text-2xl font-mono font-medium text-blue-600 break-words">
                            {formatTime(timeLeft)}
                        </p>
                    </div>
                ) : endTime ? (
                    <p className="text-lg text-green-600 font-medium">Maintenance hampir selesai...</p>
                ) : (
                    <p className="text-gray-500">Kami sedang melakukan perbaikan sistem.</p>
                )}

                {description && (
                    <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md text-sm border border-yellow-200">
                        {description}
                    </div>
                )}

                <p className="text-xs text-gray-400 mt-8">
                    Silakan coba akses beberapa saat lagi. Halaman ini akan otomatis dimuat ulang jika maintenance selesai.
                </p>
            </div>
        </div>
    );
}
