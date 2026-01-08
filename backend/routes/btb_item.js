import express from "express";
const router = express.Router();

import db from "../config/database.js";
import { updatePOStatus } from '../utils/statusHelper.js';

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
    sql += " ORDER BY btb_item.id_btb_item ASC"; // <-- Sudah benar ASC
    const [rows] = await db.query(sql, params);
    // Pastikan biaya integer
    const fixedRows = rows.map((row) => ({
      ...row,
      biaya:
        row.biaya !== undefined && row.biaya !== null
          ? Math.round(Number(row.biaya))
          : 0,
    }));
    res.json(fixedRows);
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
      biaya, // <-- tambahkan biaya
      targetPencapaianPo, // <-- NEW field
    } = req.body;

    // --- FIX: pastikan jumlah_diterima dan qty_sisa integer ---
    // --- FIX: pastikan jumlah_diterima dan qty_sisa integer ---
    const cleanCurrency = (val) => {
      if (typeof val === "string") {
        return parseFloat(val.replace(/[^0-9,-]/g, "").replace(",", ".")) || 0;
      }
      return Number(val) || 0;
    };

    const jumlahDiterimaInt = jumlah_diterima !== undefined && jumlah_diterima !== null
      ? cleanCurrency(jumlah_diterima)
      : 0; // Usually Qty is decimal too if units like liters allow it, but variable name says Int... assume float is allowed now.

    const qtySisaInt = qty_sisa !== undefined && qty_sisa !== null
      ? cleanCurrency(qty_sisa)
      : jumlahDiterimaInt;

    const biayaInt = biaya !== undefined && biaya !== null
      ? cleanCurrency(biaya)
      : 0;

    // Validasi wajib
    if (!id_btb || !id_POItem || !nama_barang) {
      return res
        .status(400)
        .json({ error: "id_btb, id_POItem, nama_barang wajib diisi" });
    }

    const [result] = await db.query(
      `INSERT INTO btb_item 
      (id_btb, id_POItem, nama_barang, jumlah_diterima, id_satuan, keterangan, qty_sisa, biaya, targetPencapaianPo, delay)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_btb,
        id_POItem,
        nama_barang,
        jumlahDiterimaInt, // <-- integer
        id_satuan || null,
        keterangan || "",
        qtySisaInt, // <-- integer
        biayaInt, // <-- biaya per item
        targetPencapaianPo || null, // <-- NEW value
        req.body.delay || null, // <-- NEW value
      ]
    );
    // Setelah insert, update biaya pada btb
    await db.query(
      "UPDATE btb SET biaya = (SELECT IFNULL(SUM(biaya),0) FROM btb_item WHERE id_btb = ?) WHERE id_btb = ?",
      [id_btb, id_btb]
    );

    // --- FIX: Update jumlahPO pada po_item (kurangi dengan jumlah_diterima) ---
    // Dilakukan di sini (backend) agar tidak mentrigger logic "Edit PO" yang mengubah pr_item.jumlah
    if (id_POItem && jumlahDiterimaInt > 0) {
      const [[poItemData]] = await db.query("SELECT jumlahPO FROM po_item WHERE id_POItem = ?", [id_POItem]);
      if (poItemData) {
        const currentQty = Math.round(Number(poItemData.jumlahPO || 0));
        const sisa = Math.max(0, currentQty - jumlahDiterimaInt);
        // Direct SQL update to avoid side effects
        await db.query("UPDATE po_item SET jumlahPO = ? WHERE id_POItem = ?", [sisa, id_POItem]);

        // --- FIX: Update PO Status ---
        const [[poRow]] = await db.query("SELECT id_PO FROM po_item WHERE id_POItem = ?", [id_POItem]);
        if (poRow) {
          await updatePOStatus(poRow.id_PO);
        }
      }
    }

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

    // 1. Fetch old data BEFORE update
    const [[oldData]] = await db.query(
      "SELECT id_btb, id_POItem, jumlah_diterima FROM btb_item WHERE id_btb_item = ?",
      [id]
    );

    if (!oldData) {
      return res.status(404).json({ message: "BTB Item tidak ditemukan" });
    }

    const sql =
      `UPDATE btb_item SET ` +
      fields.map((f) => `${f} = ?`).join(", ") +
      ` WHERE id_btb_item = ?`;

    await db.query(sql, [...fields.map((f) => payload[f]), id]);

    // 2. Update biaya pada btb (selalu update biaya)
    const btbId = oldData.id_btb; // ID BTB tidak berubah biasanya
    await db.query(
      "UPDATE btb SET biaya = (SELECT IFNULL(SUM(biaya),0) FROM btb_item WHERE id_btb = ?) WHERE id_btb = ?",
      [btbId, btbId]
    );

    // 3. Sync PO Item Quantity if jumlah_diterima changed
    if (payload.jumlah_diterima !== undefined && oldData.id_POItem) {
      const oldQty = Math.round(Number(oldData.jumlah_diterima));
      const newQty = Math.round(Number(payload.jumlah_diterima));
      const diff = newQty - oldQty; // Positif jika nambah, Negatif jika kurang

      if (diff !== 0) {
        // Update PO Item: sisa jumlahPO berkurang jika diff positif
        await db.query(
          "UPDATE po_item SET jumlahPO = GREATEST(0, jumlahPO - ?) WHERE id_POItem = ?",
          [diff, oldData.id_POItem]
        );

        // 4. Update PO Status
        const [[poRow]] = await db.query("SELECT id_PO FROM po_item WHERE id_POItem = ?", [oldData.id_POItem]);
        if (poRow) {
          await updatePOStatus(poRow.id_PO);
        }
      }
    }

    res.json({ message: "BTB Item berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE BTB Item
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Ambil id_btb dan info item sebelum hapus
    const [[row]] = await db.query("SELECT id_btb, id_POItem, jumlah_diterima FROM btb_item WHERE id_btb_item = ?", [id]);

    const [result] = await db.query(
      "DELETE FROM btb_item WHERE id_btb_item = ?",
      [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "BTB Item tidak ditemukan" });

    // Setelah delete:
    if (row) {
      // 1. Update biaya pada btb
      if (row.id_btb) {
        await db.query(
          "UPDATE btb SET biaya = (SELECT IFNULL(SUM(biaya),0) FROM btb_item WHERE id_btb = ?) WHERE id_btb = ?",
          [row.id_btb, row.id_btb]
        );
      }
      // 2. Restore PO Quantity (tambahkan kembali jumlah_diterima ke jumlahPO)
      if (row.id_POItem && row.jumlah_diterima > 0) {
        await db.query("UPDATE po_item SET jumlahPO = jumlahPO + ? WHERE id_POItem = ?", [row.jumlah_diterima, row.id_POItem]);

        // --- FIX: Update PO Status ---
        const [[poRow]] = await db.query("SELECT id_PO FROM po_item WHERE id_POItem = ?", [row.id_POItem]);
        if (poRow) {
          await updatePOStatus(poRow.id_PO);
        }
      }
    }
    res.json({ message: "BTB Item berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
