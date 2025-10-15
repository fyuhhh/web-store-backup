import express from "express";
import db from "../config/database.js";

const router = express.Router();

// ✅ GET semua PR_Item
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        pr_item.*, 
        satuan.satuan AS satuanLabel
      FROM pr_item
      LEFT JOIN satuan ON pr_item.id_satuan = satuan.id_satuan
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET PR_Item by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM pr_item WHERE id_PRItem = ?", [
      id,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "PR Item tidak ditemukan" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET PR_Item by id_PR (FK)
router.get("/pr/:id_PR", async (req, res) => {
  const { id_PR } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM pr_item WHERE id_PR = ?", [
      id_PR,
    ]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ POST PR_Item baru (backend fleksibel baca field dari frontend)
router.post("/", async (req, res) => {
  try {
    const {
      id_PR,
      namabarang, // dari frontend
      jumlah,
      originaljumlah, // dari frontend
      quantityawalPR, // dari frontend
      id_satuan,
      keterangan,
    } = req.body;

    // Validasi
    if (
      !id_PR ||
      !namabarang ||
      !jumlah ||
      !originaljumlah ||
      !quantityawalPR ||
      !id_satuan
    ) {
      return res.status(400).json({ error: "Semua field wajib diisi" });
    }

    // Query sesuai kolom di database (pakai camelCase)
    const [result] = await db.query(
      `INSERT INTO pr_item 
      (id_PR, namaBarang, jumlah, originalJumlah, quantityAwalPR, id_satuan, keterangan)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id_PR,
        namabarang,
        jumlah,
        originaljumlah,
        quantityawalPR,
        id_satuan,
        keterangan,
      ]
    );

    res.status(201).json({
      message: "PR Item berhasil dibuat",
      id: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ PUT PR_Item (update data)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    id_PR,
    namabarang,
    jumlah,
    originaljumlah,
    quantityawalPR,
    id_satuan,
    keterangan,
  } = req.body;

  try {
    await db.query(
      `UPDATE pr_item 
       SET id_PR = ?, namaBarang = ?, jumlah = ?, originalJumlah = ?, 
           quantityAwalPR = ?, id_satuan = ?, keterangan = ?
       WHERE id_PRItem = ?`,
      [
        id_PR,
        namabarang,
        jumlah,
        originaljumlah,
        quantityawalPR,
        id_satuan,
        keterangan,
        id,
      ]
    );
    res.json({ message: "PR Item berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE PR_Item
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM pr_item WHERE id_PRItem = ?", [id]);
    res.json({ message: "PR Item berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Catatan
// Akses endpoint ini dengan prefix /api/pr-item
// Contoh:
// GET    http://localhost:5000/api/pr-item
// POST   http://localhost:5000/api/pr-item
// GET    http://localhost:5000/api/pr-item/pr/1
// DELETE http://localhost:5000/api/pr-item/2

export default router;
