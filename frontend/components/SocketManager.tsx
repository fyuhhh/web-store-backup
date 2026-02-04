"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";

export function SocketManager() {
    useEffect(() => {
        // 1. Identify User on Connect/Mount
        const identifyUser = () => {
            try {
                const stored = localStorage.getItem("userData");
                if (stored) {
                    const userData = JSON.parse(stored);
                    if (userData && userData.id_user) {
                        socket.emit("identify", {
                            id_user: userData.id_user,
                            nama_pengguna: userData.nama_pengguna || userData.username, // Handle varies formats
                            role: userData.role || userData.id_peran,
                            divisi: userData.divisi || userData.id_divisi,
                        });
                        // console.log("Sent identification:", userData.nama_pengguna);
                    }
                }
            } catch (err) {
                console.error("Error identifying user:", err);
            }
        };

        // Attempt immediately
        identifyUser();

        // Also on re-connect
        socket.on("connect", identifyUser);

        return () => {
            socket.off("connect", identifyUser);
        };
    }, []);

    return null; // Logic only
}
