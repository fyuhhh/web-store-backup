import express from "express";
import db from "../config/database.js";

const router = express.Router();

// GET semua PR_Item
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM pr_item");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET PR_Item by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM pr_item WHERE id_PRItem=?", [
      id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "PR Item tidak ditemukan" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET PR_Item by id_PR (FK)
router.get("/pr/:id_PR", async (req, res) => {
  const { id_PR } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM pr_item WHERE id_PR=?", [
      id_PR,
    ]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST PR_Item baru
router.post("/", async (req, res) => {
  const {
    id_PR,
    namabarang,
    jumlah,
    originaljumlah,
    quantityawalPR,
    satuan,
    keterangan,
  } = req.body;
  if (
    !id_PR ||
    !namabarang ||
    !jumlah ||
    !originaljumlah ||
    !quantityawalPR ||
    !satuan
  ) {
    return res.status(400).json({ error: "Semua field wajib diisi" });
  }
  try {
    const [result] = await db.query(
      "INSERT INTO pr_item (id_PR, namabarang, jumlah, originaljumlah, quantityawalPR, satuan, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        id_PR,
        namabarang,
        jumlah,
        originaljumlah,
        quantityawalPR,
        satuan,
        keterangan,
      ]
    );
    res
      .status(201)
      .json({ message: "PR Item berhasil dibuat", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT PR_Item
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    id_PR,
    namabarang,
    jumlah,
    originaljumlah,
    quantityawalPR,
    satuan,
    keterangan,
  } = req.body;
  try {
    await db.query(
      "UPDATE pr_item SET id_PR=?, namabarang=?, jumlah=?, originaljumlah=?, quantityawalPR=?, satuan=?, keterangan=? WHERE id_PRItem=?",
      [
        id_PR,
        namabarang,
        jumlah,
        originaljumlah,
        quantityawalPR,
        satuan,
        keterangan,
        id,
      ]
    );
    res.json({ message: "PR Item berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE PR_Item
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM pr_item WHERE id_PRItem=?", [id]);
    res.json({ message: "PR Item berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Semua endpoint sudah benar, hanya pastikan aksesnya /api/pr-item

export default router;
