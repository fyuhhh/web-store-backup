import express from "express";
import db from "../config/database.js";

const router = express.Router();

// GET semua BTB Item (opsional: filter by id_btb)
router.get("/", async (req, res) => {
  const { id_btb } = req.query;
  try {
    let sql = `
      SELECT 
        btb_item.*, 
        satuan.satuan AS satuanLabel
      FROM btb_item
      LEFT JOIN satuan ON btb_item.id_satuan = satuan.id_satuan
    `;
    let params = [];
    if (id_btb) {
      sql += " WHERE btb_item.id_btb = ?";
      params.push(id_btb);
    }
    sql += " ORDER BY btb_item.id_btb_item ASC";
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET BTB Item by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [[row]] = await db.query(
      `SELECT btb_item.*, satuan.satuan AS satuanLabel
       FROM btb_item
       LEFT JOIN satuan ON btb_item.id_satuan = satuan.id_satuan
       WHERE btb_item.id_btb_item = ?`,
      [id]
    );
    if (!row)
      return res.status(404).json({ message: "BTB Item tidak ditemukan" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE BTB Item
router.post("/", async (req, res) => {
  try {
    const {
      id_btb,
      id_POItem,
      nama_barang,
      jumlah_diterima,
      id_satuan,
      keterangan,
      qty_sisa,
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO btb_item 
      (id_btb, id_POItem, nama_barang, jumlah_diterima, id_satuan, keterangan, qty_sisa)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id_btb,
        id_POItem || null,
        nama_barang,
        jumlah_diterima || 0,
        id_satuan || null,
        keterangan || "",
        qty_sisa || 0,
      ]
    );
    res
      .status(201)
      .json({ message: "BTB Item berhasil dibuat", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE BTB Item
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  try {
    const fields = Object.keys(payload);
    if (fields.length === 0)
      return res.status(400).json({ message: "Tidak ada data untuk update" });

    const sql =
      `UPDATE btb_item SET ` +
      fields.map((f) => `${f} = ?`).join(", ") +
      ` WHERE id_btb_item = ?`;

    await db.query(sql, [...fields.map((f) => payload[f]), id]);
    res.json({ message: "BTB Item berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE BTB Item
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      "DELETE FROM btb_item WHERE id_btb_item = ?",
      [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "BTB Item tidak ditemukan" });
    res.json({ message: "BTB Item berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
