import express from "express";
import db from "../config/database.js";

const router = express.Router();

// GET semua BTB
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        btb.*, 
        supplier.namaSupplier, 
        user.nama_pengguna, 
        skema.skema, 
        po.noPO
      FROM btb
      LEFT JOIN supplier ON btb.id_supplier = supplier.id_supplier
      LEFT JOIN user ON btb.id_user = user.id_user
      LEFT JOIN skema ON btb.id_skema = skema.id_skema
      LEFT JOIN po ON btb.id_po = po.id_PO
      ORDER BY btb.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET BTB by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [[row]] = await db.query(
      `
      SELECT 
        btb.*, 
        supplier.namaSupplier, 
        user.nama_pengguna, 
        skema.skema, 
        po.noPO
      FROM btb
      LEFT JOIN supplier ON btb.id_supplier = supplier.id_supplier
      LEFT JOIN user ON btb.id_user = user.id_user
      LEFT JOIN skema ON btb.id_skema = skema.id_skema
      LEFT JOIN po ON btb.id_po = po.id_PO
      WHERE btb.id_btb = ?
    `,
      [id]
    );
    if (!row) return res.status(404).json({ message: "BTB tidak ditemukan" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE BTB
router.post("/", async (req, res) => {
  try {
    const {
      no_btb,
      tanggal_btb,
      periode,
      id_po,
      id_supplier,
      id_user,
      id_skema,
      biaya,
      diterima_oleh,
      tanggal_diterima,
      status,
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO btb 
      (no_btb, tanggal_btb, periode, id_po, id_supplier, id_user, id_skema, biaya, diterima_oleh, tanggal_diterima, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        no_btb,
        tanggal_btb,
        periode || null,
        id_po,
        id_supplier || null,
        id_user || null,
        id_skema || null,
        biaya || 0,
        diterima_oleh || null,
        tanggal_diterima || null,
        status || "draft",
      ]
    );
    res
      .status(201)
      .json({ message: "BTB berhasil dibuat", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE BTB
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  try {
    const fields = Object.keys(payload);
    if (fields.length === 0)
      return res.status(400).json({ message: "Tidak ada data untuk update" });

    const sql =
      `UPDATE btb SET ` +
      fields.map((f) => `${f} = ?`).join(", ") +
      ` WHERE id_btb = ?`;

    await db.query(sql, [...fields.map((f) => payload[f]), id]);
    res.json({ message: "BTB berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE BTB (beserta item, ON DELETE CASCADE)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM btb WHERE id_btb = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "BTB tidak ditemukan" });
    res.json({ message: "BTB berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
