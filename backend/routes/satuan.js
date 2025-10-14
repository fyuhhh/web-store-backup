import express from "express";
import db from "../config/database.js";

const router = express.Router();

// GET semua satuan
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM satuan");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST satuan baru
router.post("/", async (req, res) => {
  const { satuan } = req.body;
  if (!satuan) return res.status(400).json({ error: "Satuan wajib diisi" });
  try {
    const [result] = await db.query("INSERT INTO satuan (satuan) VALUES (?)", [
      satuan,
    ]);
    res
      .status(201)
      .json({ message: "Satuan berhasil ditambahkan", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT satuan
router.put("/:id", async (req, res) => {
  const { satuan } = req.body;
  const { id } = req.params;
  if (!satuan) return res.status(400).json({ error: "Satuan wajib diisi" });
  try {
    await db.query("UPDATE satuan SET satuan=? WHERE id_satuan=?", [
      satuan,
      id,
    ]);
    res.json({ message: "Satuan berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE satuan
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM satuan WHERE id_satuan=?", [id]);
    res.json({ message: "Satuan berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
