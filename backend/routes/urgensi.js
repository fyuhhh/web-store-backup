import express from "express";
import db from "../config/database.js";

const router = express.Router();

// GET semua urgensi
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM urgensi");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST urgensi baru
router.post("/", async (req, res) => {
  const { urgensi } = req.body;
  if (!urgensi) return res.status(400).json({ error: "Urgensi wajib diisi" });
  try {
    const [result] = await db.query(
      "INSERT INTO urgensi (urgensi) VALUES (?)",
      [urgensi]
    );
    res
      .status(201)
      .json({ message: "Urgensi berhasil ditambahkan", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT urgensi
router.put("/:id", async (req, res) => {
  const { urgensi } = req.body;
  const { id } = req.params;
  if (!urgensi) return res.status(400).json({ error: "Urgensi wajib diisi" });
  try {
    await db.query("UPDATE urgensi SET urgensi=? WHERE id_urgensi=?", [
      urgensi,
      id,
    ]);
    res.json({ message: "Urgensi berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE urgensi
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM urgensi WHERE id_urgensi=?", [id]);
    res.json({ message: "Urgensi berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
