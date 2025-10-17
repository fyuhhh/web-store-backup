import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
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
ensureSuperadmin().catch((err) => {
  console.error("Gagal membuat superadmin:", err);
});

// jalankan server
app.listen(5000, () => {
  console.log("Server berjalan di http://localhost:5000");
  console.log("Debug routes: http://localhost:5000/api/debug/routes");
});
