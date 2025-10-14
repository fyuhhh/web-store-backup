import express from "express";
import db from "../config/database.js";

const router = express.Router();

// GET semua divisi
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM divisi");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST divisi baru
router.post("/", async (req, res) => {
  const { divisi } = req.body;
  if (!divisi) return res.status(400).json({ error: "Divisi wajib diisi" });
  try {
    const [result] = await db.query("INSERT INTO divisi (divisi) VALUES (?)", [
      divisi,
    ]);
    res
      .status(201)
      .json({ message: "Divisi berhasil ditambahkan", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT (edit divisi)
router.put("/:id", async (req, res) => {
  const { divisi } = req.body;
  const { id } = req.params;
  if (!divisi) return res.status(400).json({ error: "Divisi wajib diisi" });
  try {
    await db.query("UPDATE divisi SET divisi=? WHERE id_divisi=?", [
      divisi,
      id,
    ]);
    res.json({ message: "Divisi berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE divisi
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM divisi WHERE id_divisi=?", [id]);
    res.json({ message: "Divisi berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
