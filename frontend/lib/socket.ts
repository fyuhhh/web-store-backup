import { io } from "socket.io-client";
import { API_BASE_URL } from "./config";

// Force a new connection if needed, but singleton is usually fine.
// We point to backend URL.
export const socket = io(API_BASE_URL, {
    path: "/api/socket.io",
    transports: ["polling", "websocket"],
    autoConnect: true,
});
