import express from "express";
import db from "../config/database.js";

const router = express.Router();

// GET all Kritik & Saran (For Admin View Later if needed)
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM kritik_saran ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST Kritik & Saran
router.post("/", async (req, res, next) => {
  try {
    const { id_user, nama_pengguna, isi } = req.body;

    if (!id_user || !nama_pengguna || !isi) {
      return res.status(400).json({ message: "Semua field harus diisi." });
    }

    const [result] = await db.query(
      "INSERT INTO kritik_saran (id_user, nama_pengguna, isi, created_at) VALUES (?, ?, ?, NOW())",
      [id_user, nama_pengguna, isi]
    );

    res.status(201).json({ message: "Kritik & Saran berhasil dikirim", id: result.insertId });
  } catch (err) {
    next(err);
  }
});

export default router;
