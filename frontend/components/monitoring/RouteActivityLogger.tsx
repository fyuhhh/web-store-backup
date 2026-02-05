"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { logActivity } from "@/utils/activity";

export function RouteActivityLogger() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const lastPathRef = useRef<string | null>(null);

    useEffect(() => {
        // Construct full path including query params if relevant, or just pathname
        // Let's stick to pathname for cleaner logs, maybe add query if important (like ?id=)
        // But for "Mengakses halaman X", pathname is usually sufficient.
        const currentPath = pathname;

        // Skip logging if path hasn't changed (though useEffect triggers on change)
        // Also skip irrelevant internal paths if any
        if (currentPath === lastPathRef.current) return;

        lastPathRef.current = currentPath;

        // Debounce or immediate? Immediate is fine for navigation.
        // We need user data.
        try {
            const userDataStr = localStorage.getItem("userData");
            if (!userDataStr) return;
            const userData = JSON.parse(userDataStr);
            const userId = userData.id_user || userData.id;
            const username = userData.username || userData.nama_pengguna || "Unknown";

            if (userId) {
                // Friendly names for paths
                let pageName = currentPath;
                if (currentPath === "/dashboard") pageName = "Dashboard";
                else if (currentPath.includes("/pr/input")) pageName = "Input PR";
                else if (currentPath.includes("/po/input")) pageName = "Input PO";
                else if (currentPath.includes("/monitoring")) pageName = "Monitoring";
                else if (currentPath.includes("/divisi/pesanan-anda")) pageName = "Pesanan Anda";

                logActivity({
                    id_user: userId,
                    nama_pengguna: username,
                    action_type: "NAVIGATE",
                    details: `Mengakses halaman ${pageName}`,
                    entity_id: currentPath // Store raw path in entity_id or details? Let's keep entity_id for IDs usually.
                });
            }
        } catch (e) {
            console.error("Failed to log route", e);
        }

    }, [pathname, searchParams]); // Trigger on path or param change? Maybe just path to avoid spam on sorting/filtering

    return null;
}
