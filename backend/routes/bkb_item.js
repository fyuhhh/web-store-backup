import express from "express";
import db from "../config/database.js";

const router = express.Router();

// GET semua BKB Item (opsional: filter by id_bkb)
router.get("/", async (req, res) => {
  const { id_bkb } = req.query;
  try {
    let sql = "SELECT * FROM bkb_item";
    let params = [];
    if (id_bkb) {
      sql += " WHERE id_bkb = ?";
      params.push(id_bkb);
    }
    sql += " ORDER BY id_bkb_item ASC";
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET BKB Item by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [[row]] = await db.query(
      "SELECT * FROM bkb_item WHERE id_bkb_item = ?",
      [id]
    );
    if (!row)
      return res.status(404).json({ message: "BKB Item tidak ditemukan" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE BKB Item
router.post("/", async (req, res) => {
  try {
    const {
      id_bkb,
      id_btb_item,
      nama_barang,
      jumlah_keluar,
      satuan,
      sisa_btb,
      keterangan,
    } = req.body;

    if (!id_bkb || !nama_barang || !jumlah_keluar || !satuan) {
      return res
        .status(400)
        .json({
          error: "id_bkb, nama_barang, jumlah_keluar, satuan wajib diisi",
        });
    }

    const [result] = await db.query(
      `INSERT INTO bkb_item 
      (id_bkb, id_btb_item, nama_barang, jumlah_keluar, satuan, sisa_btb, keterangan)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id_bkb,
        id_btb_item || null,
        nama_barang,
        jumlah_keluar,
        satuan,
        sisa_btb || null,
        keterangan || "",
      ]
    );
    res
      .status(201)
      .json({ message: "BKB Item berhasil dibuat", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE BKB Item
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  try {
    const fields = Object.keys(payload);
    if (fields.length === 0)
      return res.status(400).json({ message: "Tidak ada data untuk update" });

    const sql =
      `UPDATE bkb_item SET ` +
      fields.map((f) => `${f} = ?`).join(", ") +
      ` WHERE id_bkb_item = ?`;

    await db.query(sql, [...fields.map((f) => payload[f]), id]);
    res.json({ message: "BKB Item berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE BKB Item
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      "DELETE FROM bkb_item WHERE id_bkb_item = ?",
      [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "BKB Item tidak ditemukan" });
    res.json({ message: "BKB Item berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
