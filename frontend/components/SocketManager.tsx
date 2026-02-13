"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";

export function SocketManager() {
    useEffect(() => {
        // Use a ref to prevent double-firing in Strict Mode or rapid re-renders
        let isIdentified = false;

        const identifyUser = () => {
            if (isIdentified) return;

            try {
                const stored = localStorage.getItem("userData");
                if (stored) {
                    const userData = JSON.parse(stored);
                    if (userData && userData.id_user) {
                        // Only emit if connected (or let the auto-buffer handle it, but better to be explicit)
                        if (socket.connected) {
                            socket.emit("identify", {
                                id_user: userData.id_user,
                                nama_pengguna: userData.nama_pengguna || userData.username,
                                role: userData.role || userData.id_peran,
                                divisi: userData.divisi || userData.id_divisi,
                            });
                            // console.log("Sent identification:", userData.nama_pengguna);
                            isIdentified = true;
                        }
                    }
                }
            } catch (err) {
                console.error("Error identifying user:", err);
            }
        };

        // Attempt immediately if already connected
        if (socket.connected) {
            identifyUser();
        }

        // Listen for connect event (in case it wasn't connected yet)
        const onConnect = () => {
            identifyUser();
        };

        socket.on("connect", onConnect);

        return () => {
            socket.off("connect", onConnect);
            // Resetting isIdentified on unmount is tricky if we want to PERSIST identification across navigations 
            // but this component mounts once in Layout, so it should be fine.
        };
    }, []);

    return null; // Logic only
}
