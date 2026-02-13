import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import { initLogger } from "./utils/activityLogger.js";

import userRoutes, { ensureSuperadmin } from "./routes/user.js";
import divisiRoutes from "./routes/divisi.js";
import peranRoutes from "./routes/peran.js";
import skemaRoutes from "./routes/skema.js";
import urgensiRoutes from "./routes/urgensi.js";
import satuanRoutes from "./routes/satuan.js";
import prRoutes from "./routes/pr.js";
import prItemRoutes from "./routes/pr_item.js";
import poRoutes from "./routes/po.js";
import poItemRoutes from "./routes/po_item.js";
import supplierRoutes from "./routes/supplier.js";
import statusPengirimanRoutes from "./routes/status_pengiriman.js";
import statusPermintaanRoutes from "./routes/status_permintaan.js";
import btbRoutes from "./routes/btb.js";
import btbItemRoutes from "./routes/btb_item.js";
import bkbRoutes from "./routes/bkb.js";
import bkbItemRoutes from "./routes/bkb_item.js";
import holidayRoutes, { ensureHolidaysTable } from "./routes/holiday.js";
import terminRoutes from "./routes/termin_pembayaran.js";
import maintenanceRoutes from "./routes/maintenance.js";
import broadcastRoutes from "./routes/broadcast.js";
import monitoringRoutes from "./routes/monitoring.js";
import activityLogsRoutes from "./routes/activity_logs.js";
import mrRoutes from "./routes/mr.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// === ADDED: simple request logger to help debugging ===
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});
// === END ADDED ===

// route utama
app.use("/api/user", userRoutes);
app.use("/api/divisi", divisiRoutes);
app.use("/api/peran", peranRoutes);
app.use("/api/skema", skemaRoutes);
app.use("/api/urgensi", urgensiRoutes);
app.use("/api/satuan", satuanRoutes);
app.use("/api/pr", prRoutes);
app.use("/api/pr-item", prItemRoutes);
app.use("/api/po", poRoutes);
app.use("/api/po-item", poItemRoutes);
app.use("/api/supplier", supplierRoutes);
app.use("/api/status-pengiriman", statusPengirimanRoutes);
app.use("/api/status-permintaan", statusPermintaanRoutes);
app.use("/api/btb", btbRoutes);
app.use("/api/btb-item", btbItemRoutes);
app.use("/api/bkb", bkbRoutes);
app.use("/api/bkb-item", bkbItemRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/termin", terminRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/broadcast", broadcastRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/activity-logs", activityLogsRoutes);
app.use("/api/mr", mrRoutes);

// === ADDED: debug endpoint to list registered routes ===
app.get("/api/debug/routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods)
        .join(",")
        .toUpperCase();
      routes.push({ path: middleware.route.path, methods });
    } else if (
      middleware.name === "router" &&
      middleware.handle &&
      middleware.handle.stack
    ) {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods)
            .join(",")
            .toUpperCase();
          routes.push({ path: handler.route.path, methods });
        }
      });
    }
  });
  res.json({ routes });
});
// === END ADDED ===

// error handling
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res
    .status(500)
    .json({ message: "Terjadi kesalahan server", error: err.message });
});

// === ADDED: JSON 404 fallback to avoid HTML "Cannot GET /..." ===
app.use((req, res) => {
  res
    .status(404)
    .json({ message: `Not found ${req.method} ${req.originalUrl}` });
});
// === END ADDED ===

// Pastikan superadmin ada sebelum server listen
Promise.all([ensureSuperadmin(), ensureHolidaysTable()]).catch((err) => {
  console.error("Gagal inisialisasi system (superadmin/tables):", err);
});

// Wrap express app with HTTP server
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize Logger
initLogger(io);

// Socket Connection Handler
// Socket Connection Handler
const onlineUsers = new Map(); // socketId -> { id_user, nama_pengguna, role, ... }

io.on("connection", (socket) => {
  // console.log(`Client connected: ${socket.id}`);

  socket.on("identify", (userData) => {
    if (userData && userData.id_user) {
      onlineUsers.set(socket.id, {
        ...userData,
        socketId: socket.id,
        loginTime: new Date(),
      });
      console.log(`User identified: ${userData.nama_pengguna} (${socket.id})`);

      // Broadcast updated online users list to 'monitoring' room
      io.to("monitoring").emit("online_users_update", Array.from(onlineUsers.values()));
    }
  });

  socket.on("join_monitoring", () => {
    socket.join("monitoring");
    // console.log(`Socket ${socket.id} joined monitoring`);

    // Immediately send current online users to the new monitor
    socket.emit("online_users_update", Array.from(onlineUsers.values()));
  });

  socket.on("disconnect", () => {
    // console.log(`Client disconnected: ${socket.id}`);
    if (onlineUsers.has(socket.id)) {
      onlineUsers.delete(socket.id);
      // Broadcast updated list
      io.to("monitoring").emit("online_users_update", Array.from(onlineUsers.values()));
    }
  });
});

app.set("io", io);

// jalankan server
httpServer.listen(5000, () => {
  console.log("Server berjalan di http://192.168.10.10:5000");
  console.log("Debug routes: http://192.168.10.10:5000/api/debug/routes");
  console.log("Socket.io initialized");
});

