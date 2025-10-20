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
      skema, // frontend kirim skema, backend simpan ke id_skema
    } = req.body;
    const [result] = await db.query(
      `INSERT INTO bkb 
      (no_bkb, tanggal_bkb, keterangan, dibuat_oleh, dikeluarkan_oleh, id_skema) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        no_bkb,
        tanggal_bkb,
        keterangan || "",
        dibuat_oleh || null,
        dikeluarkan_oleh || null,
        skema || null, // simpan ke id_skema
      ]
    );
    res
      .status(201)
      .json({ message: "BKB berhasil dibuat", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST BKB + items sekaligus (input BKB dari frontend)
router.post("/full", async (req, res) => {
  const {
    no_bkb,
    tanggal_bkb,
    keterangan,
    dibuat_oleh,
    dikeluarkan_oleh,
    skema, // frontend kirim skema, backend simpan ke id_skema
    barang, // array of { id_btb_item, nama_barang, jumlah_keluar, satuan, keterangan }
  } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Insert ke bkb (gunakan id_skema)
    const [bkbResult] = await conn.query(
      `INSERT INTO bkb (no_bkb, tanggal_bkb, keterangan, dibuat_oleh, dikeluarkan_oleh, id_skema)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        no_bkb,
        tanggal_bkb,
        keterangan || "",
        dibuat_oleh || null,
        dikeluarkan_oleh || null,
        skema || null, // simpan ke id_skema
      ]
    );
    const id_bkb = bkbResult.insertId;

    // 2. Insert ke bkb_item dan update sisa btb_item
    for (const item of barang) {
      // Ambil sisa stok BTB sebelum update
      const [[btbItem]] = await conn.query(
        "SELECT qty_sisa, jumlah_diterima FROM btb_item WHERE id_btb_item = ?",
        [item.id_btb_item]
      );
      const sisaSebelum = btbItem?.qty_sisa ?? btbItem?.jumlah_diterima ?? 0;
      const jumlahKeluar = Number(item.jumlah_keluar);

      // Insert ke bkb_item (gunakan id_satuan)
      await conn.query(
        `INSERT INTO bkb_item
          (id_bkb, id_btb_item, nama_barang, jumlah_keluar, id_satuan, sisa_btb, keterangan)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id_bkb,
          item.id_btb_item,
          item.nama_barang,
          jumlahKeluar,
          item.satuan || null, // simpan ke id_satuan
          Math.max(0, sisaSebelum - jumlahKeluar),
          item.keterangan || "",
        ]
      );

      // Update qty_sisa di btb_item
      await conn.query(
        "UPDATE btb_item SET qty_sisa = ? WHERE id_btb_item = ?",
        [Math.max(0, sisaSebelum - jumlahKeluar), item.id_btb_item]
      );
    }

    await conn.commit();
    res.status(201).json({ message: "BKB & item berhasil disimpan", id_bkb });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
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
