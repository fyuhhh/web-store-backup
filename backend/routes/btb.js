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
      nama_supplier, // <-- ambil dari frontend
      id_user,
      id_skema,
      biaya,
      diterima_oleh,
      tanggal_diterima,
      status,
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO btb 
      (no_btb, tanggal_btb, periode, id_po, id_supplier, nama_supplier, id_user, id_skema, biaya, diterima_oleh, tanggal_diterima, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        no_btb,
        tanggal_btb,
        periode || null,
        id_po,
        id_supplier || null,
        nama_supplier || "", // <-- simpan ke kolom nama_supplier
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

// === Tambah endpoint untuk input BTB beserta item dan update jumlahPO pada po_item ===
router.post("/full", async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      no_btb, // dari form No. BTB
      tanggal_btb, // dari form Tanggal BTB
      periode, // dari form Periode
      id_po, // dari input (PO yang dipilih)
      id_supplier, // dari input (supplier yang dipilih)
      id_user, // dari user yang akses halaman input BTB
      id_skema, // dari input (skema yang dipilih)
      biaya, // dari form Biaya
      diterima_oleh, // dari user yang akses halaman input BTB (id_user)
      tanggal_diterima, // dari form Tanggal BTB
      items, // array: [{ id_POItem, nama_barang, jumlah_diterima, id_satuan, keterangan }]
    } = req.body;

    // 1. Insert ke btb (header)
    const [btbResult] = await conn.query(
      `INSERT INTO btb 
      (no_btb, tanggal_btb, periode, id_po, id_supplier, id_user, id_skema, biaya, diterima_oleh, tanggal_diterima, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'Menunggu')`,
      [
        no_btb,
        tanggal_btb,
        periode || null,
        id_po,
        id_supplier || null,
        id_user || null,
        id_skema || null,
        biaya || 0,
        diterima_oleh || null, // id_user
        tanggal_diterima || null,
      ]
    );
    const id_btb = btbResult.insertId;

    // 2. Insert ke btb_item dan update jumlahPO pada po_item
    for (const item of items || []) {
      const { id_POItem, nama_barang, jumlah_diterima, id_satuan, keterangan } =
        item;

      // Insert ke btb_item
      await conn.query(
        `INSERT INTO btb_item 
        (id_btb, id_POItem, nama_barang, jumlah_diterima, id_satuan, keterangan, qty_sisa, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          id_btb,
          id_POItem || null,
          nama_barang,
          jumlah_diterima || 0,
          id_satuan || null,
          keterangan || "",
          jumlah_diterima || 0, // qty_sisa = jumlah_diterima
        ]
      );

      // Update jumlahPO pada po_item (kurangi dengan jumlah_diterima)
      if (id_POItem && jumlah_diterima) {
        // Ambil jumlahPO lama
        const [[poItem]] = await conn.query(
          "SELECT jumlahPO FROM po_item WHERE id_POItem = ?",
          [id_POItem]
        );
        const sisa = Math.max(
          0,
          Number(poItem?.jumlahPO || 0) - Number(jumlah_diterima)
        );
        await conn.query(
          "UPDATE po_item SET jumlahPO = ? WHERE id_POItem = ?",
          [sisa, id_POItem]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ message: "BTB dan item berhasil dibuat", id_btb });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

export default router;
