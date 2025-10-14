import express from "express";
import db from "../config/database.js";

const router = express.Router();

// GET semua skema
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM skema");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST skema baru
router.post("/", async (req, res) => {
  const { skema } = req.body;
  if (!skema) return res.status(400).json({ error: "Skema wajib diisi" });
  try {
    const [result] = await db.query("INSERT INTO skema (skema) VALUES (?)", [
      skema,
    ]);
    res
      .status(201)
      .json({ message: "Skema berhasil ditambahkan", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT (edit skema)
router.put("/:id", async (req, res) => {
  const { skema } = req.body;
  const { id } = req.params;
  if (!skema) return res.status(400).json({ error: "Skema wajib diisi" });
  try {
    await db.query("UPDATE skema SET skema=? WHERE id_skema=?", [skema, id]);
    res.json({ message: "Skema berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE skema
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM skema WHERE id_skema=?", [id]);
    res.json({ message: "Skema berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
