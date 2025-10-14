import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import userRoutes from "./routes/user.js";
import divisiRoutes from "./routes/divisi.js";
import peranRoutes from "./routes/peran.js";
import skemaRoutes from "./routes/skema.js";
import urgensiRoutes from "./routes/urgensi.js";
import satuanRoutes from "./routes/satuan.js";
import prRoutes from "./routes/pr.js";
import prItemRoutes from "./routes/pr_item.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// route utama
app.use("/api/user", userRoutes);
app.use("/api/divisi", divisiRoutes);
app.use("/api/peran", peranRoutes);
app.use("/api/skema", skemaRoutes);
app.use("/api/urgensi", urgensiRoutes);
app.use("/api/satuan", satuanRoutes);
app.use("/api/pr", prRoutes);
app.use("/api/pr-item", prItemRoutes);

// error handling
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res
    .status(500)
    .json({ message: "Terjadi kesalahan server", error: err.message });
});

// jalankan server
app.listen(5000, () => {
  console.log("Server berjalan di http://localhost:5000");
});
