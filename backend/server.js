import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import userRoutes from "./routes/user.js";
import divisiRoutes from "./routes/divisi.js";
import peranRoutes from "./routes/peran.js";
import skemaRoutes from "./routes/skema.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// route utama
app.use("/api/user", userRoutes);
app.use("/api/divisi", divisiRoutes);
app.use("/api/peran", peranRoutes);
app.use("/api/skema", skemaRoutes);

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
