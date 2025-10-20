import express from "express";
import db from "../config/database.js";

const router = express.Router();

// GET semua BKB
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM bkb ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET BKB by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [[row]] = await db.query("SELECT * FROM bkb WHERE id_bkb = ?", [id]);
    if (!row) return res.status(404).json({ message: "BKB tidak ditemukan" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE BKB
router.post("/", async (req, res) => {
  try {
    const {
      no_bkb,
      tanggal_bkb,
      keterangan,
      dibuat_oleh,
      dikeluarkan_oleh,
      skema,
    } = req.body;
    const [result] = await db.query(
      `INSERT INTO bkb 
      (no_bkb, tanggal_bkb, keterangan, dibuat_oleh, dikeluarkan_oleh, skema) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        no_bkb,
        tanggal_bkb,
        keterangan || "",
        dibuat_oleh || null,
        dikeluarkan_oleh || null,
        skema || null,
      ]
    );
    res
      .status(201)
      .json({ message: "BKB berhasil dibuat", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE BKB
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  try {
    const fields = Object.keys(payload);
    if (fields.length === 0)
      return res.status(400).json({ message: "Tidak ada data untuk update" });

    const sql =
      `UPDATE bkb SET ` +
      fields.map((f) => `${f} = ?`).join(", ") +
      ` WHERE id_bkb = ?`;

    await db.query(sql, [...fields.map((f) => payload[f]), id]);
    res.json({ message: "BKB berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE BKB
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM bkb WHERE id_bkb = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "BKB tidak ditemukan" });
    res.json({ message: "BKB berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
