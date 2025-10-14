import express from "express";
import db from "../config/database.js";

const router = express.Router();

// GET semua PR
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM pr");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET PR by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM pr WHERE id_PR=?", [id]);
    if (rows.length === 0)
      return res.status(404).json({ message: "PR tidak ditemukan" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST PR baru
router.post("/", async (req, res) => {
  const {
    noPR,
    tanggalPR,
    divisi,
    urgensi,
    status,
    dibuatOleh,
    skema,
    createdAt,
  } = req.body;
  if (
    !noPR ||
    !tanggalPR ||
    !divisi ||
    !urgensi ||
    !status ||
    !dibuatOleh ||
    !skema
  ) {
    return res.status(400).json({ error: "Semua field wajib diisi" });
  }
  try {
    const [result] = await db.query(
      "INSERT INTO pr (noPR, tanggalPR, divisi, urgensi, status, dibuatOleh, skema, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [noPR, tanggalPR, divisi, urgensi, status, dibuatOleh, skema, createdAt]
    );
    res
      .status(201)
      .json({ message: "PR berhasil dibuat", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT PR
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    noPR,
    tanggalPR,
    divisi,
    urgensi,
    status,
    dibuatOleh,
    skema,
    createdAt,
  } = req.body;
  try {
    await db.query(
      "UPDATE pr SET noPR=?, tanggalPR=?, divisi=?, urgensi=?, status=?, dibuatOleh=?, skema=?, createdAt=? WHERE id_PR=?",
      [
        noPR,
        tanggalPR,
        divisi,
        urgensi,
        status,
        dibuatOleh,
        skema,
        createdAt,
        id,
      ]
    );
    res.json({ message: "PR berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE PR
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM pr WHERE id_PR=?", [id]);
    res.json({ message: "PR berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
