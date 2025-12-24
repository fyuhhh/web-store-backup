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
      ORDER BY pr_item.id_PRItem ASC -- <-- Tambahkan ASC di sini
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
    const [rows] = await db.query(
      "SELECT * FROM pr_item WHERE id_PR = ? ORDER BY id_PRItem ASC", // <-- Tambahkan ASC
      [id_PR]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ POST PR_Item baru (frontend field names are flexible)
router.post("/", async (req, res) => {
  try {
    const {
      id_PR,
      namabarang,
      namaBarang, // accept both versions
      jumlah,
      originaljumlah,
      originalJumlah, // accept both versions
      quantityawalPR,
      quantityAwalPR, // accept both versions
      id_satuan,
      keterangan,
    } = req.body;

    // Normalize field names and convert to decimal
    const finalNamaBarang = namaBarang || namabarang;
    const finalJumlah = parseFloat(jumlah) || 0;
    const finalOriginalJumlah =
      parseFloat(originalJumlah || originaljumlah || jumlah) || 0;
    const finalQuantityAwalPR =
      parseFloat(quantityAwalPR || quantityawalPR || jumlah) || 0;

    // More flexible validation
    if (!id_PR) {
      return res.status(400).json({ error: "id_PR is required" });
    }
    if (!finalNamaBarang) {
      return res.status(400).json({ error: "Nama barang is required" });
    }
    if (!finalJumlah) {
      return res.status(400).json({ error: "Jumlah is required" });
    }
    if (!id_satuan) {
      return res.status(400).json({ error: "id_satuan is required" });
    }

    // Query with normalized field names and DECIMAL handling
    const [result] = await db.query(
      `INSERT INTO pr_item 
      (id_PR, namaBarang, jumlah, originalJumlah, quantityAwalPR, id_satuan, keterangan)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id_PR,
        finalNamaBarang,
        finalJumlah,
        finalOriginalJumlah,
        finalQuantityAwalPR,
        id_satuan,
        keterangan || "",
      ]
    );

    // Add debug logging
    console.log("Inserted PR Item values:", {
      id_PR,
      namaBarang: finalNamaBarang,
      jumlah: finalJumlah,
      originalJumlah: finalOriginalJumlah,
      quantityAwalPR: finalQuantityAwalPR,
      id_satuan,
      keterangan,
    });

    res.status(201).json({
      message: "PR Item berhasil dibuat",
      id: result.insertId,
    });
  } catch (err) {
    console.error("Error creating PR item:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ PUT PR_Item (update data)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const payload = req.body;

  try {
    // Validate and normalize payload fields
    const normalizedPayload = {
      id_PR: payload.id_PR,
      namaBarang: payload.namaBarang,
      jumlah: parseFloat(payload.jumlah) || 0,
      originalJumlah: parseFloat(payload.originalJumlah) || 0,
      quantityAwalPR: parseFloat(payload.quantityAwalPR) || 0,
      id_satuan: payload.id_satuan,
      keterangan: payload.keterangan || "",
    };

    // Debug logging
    console.log("Updating PR Item:", {
      id,
      ...normalizedPayload,
    });

    // Update with all fields to ensure consistency
    const [result] = await db.query(
      `UPDATE pr_item 
       SET id_PR = ?, 
           namaBarang = ?, 
           jumlah = ?, 
           originalJumlah = ?, 
           quantityAwalPR = ?, 
           id_satuan = ?, 
           keterangan = ?
       WHERE id_PRItem = ?`,
      [
        normalizedPayload.id_PR,
        normalizedPayload.namaBarang,
        normalizedPayload.jumlah,
        normalizedPayload.originalJumlah,
        normalizedPayload.quantityAwalPR,
        normalizedPayload.id_satuan,
        normalizedPayload.keterangan,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "PR Item not found" });
    }

    res.json({
      message: "PR Item berhasil diupdate",
      data: normalizedPayload,
    });
  } catch (err) {
    console.error("Error updating PR item:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE PR_Item
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Tambahkan log id yang diterima
    console.log("DELETE PR_Item id_PRItem:", id);
    const [result] = await db.query("DELETE FROM pr_item WHERE id_PRItem = ?", [
      id,
    ]);
    console.log("DELETE result:", result);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "PR Item tidak ditemukan" });
    }
    res.json({ message: "PR Item berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE ALL PR_Item by PR ID (moved here from pr-item.js)
router.delete("/by-pr/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM pr_item WHERE id_PR = ?", [id]);
    res.json({ message: "PR Item berhasil dihapus (by PR id)" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Catatan
// Akses endpoint ini dengan prefix /api/pr-item
// Contoh:
// GET    http://192.168.10.10:5000/api/pr-item
// POST   http://192.168.10.10:5000/api/pr-item
// GET    http://192.168.10.10:5000/api/pr-item/pr/1
// DELETE http://192.168.10.10:5000/api/pr-item/2

// No change needed: id_satuan in PR item is never deleted or set to null by PO process
// Only updated via explicit PUT /api/pr-item/:id

export default router;
