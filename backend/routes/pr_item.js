import express from "express";
import db from "../config/database.js";

const router = express.Router();
import { updatePRStatus } from '../utils/statusHelper.js';

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
      kodeBarang, // New
      namabarang,
      namaBarang, // accept both versions
      spesifikasi, // New
      jumlah,
      originaljumlah,
      originalJumlah, // accept both versions
      quantityawalPR,
      quantityAwalPR, // accept both versions
      id_satuan,
      keterangan,
      noMR // New
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
      (id_PR, kodeBarang, namaBarang, spesifikasi, jumlah, originalJumlah, quantityAwalPR, id_satuan, keterangan, noMR)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_PR,
        kodeBarang || null,
        finalNamaBarang,
        spesifikasi || null,
        finalJumlah,
        finalOriginalJumlah,
        finalQuantityAwalPR,
        id_satuan,
        keterangan || "",
        noMR || null
      ]
    );

    // Add debug logging
    console.log("Inserted PR Item values:", {
      id_PR,
      kodeBarang,
      namaBarang: finalNamaBarang,
      spesifikasi,
      jumlah: finalJumlah,
      originalJumlah: finalOriginalJumlah,
      quantityAwalPR: finalQuantityAwalPR,
      id_satuan,
      keterangan,
      noMR,
    });

    // Update PR Status
    await updatePRStatus(id_PR);

    res.status(201).json({
      message: "PR Item berhasil dibuat",
      id: result.insertId,
    });
  } catch (err) {
    console.error("Error creating PR item:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE PR_Item
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const {
      kodeBarang,
      namaBarang,
      namabarang,
      spesifikasi,
      jumlah,
      originaljumlah,
      originalJumlah,
      quantityawalPR,
      quantityAwalPR,
      id_satuan,
      keterangan,
      noMR
    } = req.body;

    // Build dynamic update query
    const finalNamaBarang = namaBarang || namabarang;
    const finalJumlah = parseFloat(jumlah) || 0;
    // For editing, we update original/awal if provided, else keep existing or default to jumlah
    const finalOriginalJumlah =
      parseFloat(originalJumlah || originaljumlah || jumlah) || 0;
    const finalQuantityAwalPR =
      parseFloat(quantityAwalPR || quantityawalPR || jumlah) || 0;

    const fieldsToUpdate = [];
    const values = [];

    if (kodeBarang !== undefined) {
      fieldsToUpdate.push("kodeBarang = ?");
      values.push(kodeBarang);
    }
    if (finalNamaBarang !== undefined) {
      fieldsToUpdate.push("namaBarang = ?");
      values.push(finalNamaBarang);
    }
    if (spesifikasi !== undefined) {
      fieldsToUpdate.push("spesifikasi = ?");
      values.push(spesifikasi);
    }
    if (jumlah !== undefined) {
      fieldsToUpdate.push("jumlah = ?");
      values.push(finalJumlah);
    }
    if (req.body.originalJumlah !== undefined || req.body.originaljumlah !== undefined) {
      fieldsToUpdate.push("originalJumlah = ?");
      values.push(finalOriginalJumlah);
    }
    if (req.body.quantityAwalPR !== undefined || req.body.quantityawalPR !== undefined) {
      fieldsToUpdate.push("quantityAwalPR = ?");
      values.push(finalQuantityAwalPR);
    }
    if (id_satuan !== undefined) {
      fieldsToUpdate.push("id_satuan = ?");
      values.push(id_satuan);
    }
    if (keterangan !== undefined) {
      fieldsToUpdate.push("keterangan = ?");
      values.push(keterangan);
    }
    if (noMR !== undefined) {
      fieldsToUpdate.push("noMR = ?");
      values.push(noMR);
    }

    if (fieldsToUpdate.length === 0) {
      return res.json({ message: "No fields to update" });
    }

    const sql = `UPDATE pr_item SET ${fieldsToUpdate.join(", ")} WHERE id_PRItem = ?`;
    values.push(id);

    await db.query(sql, values);

    // Get id_PR for status update (need to fetch it first as we only have id_PRItem)
    const [[prItem]] = await db.query("SELECT id_PR FROM pr_item WHERE id_PRItem = ?", [id]);
    if (prItem) {
      await updatePRStatus(prItem.id_PR);
    }

    res.json({ message: "PR Item berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ✅ DELETE PR_Item
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    console.log("DELETE PR_Item id_PRItem:", id);

    // Ambil id_PR dan status jumlah sebelum hapus
    const [[itemToDelete]] = await db.query("SELECT * FROM pr_item WHERE id_PRItem = ?", [id]);

    if (!itemToDelete) {
      return res.status(404).json({ message: "PR Item tidak ditemukan" });
    }

    // Validation: Cannot delete if processed
    if (parseFloat(itemToDelete.jumlah) < parseFloat(itemToDelete.originalJumlah)) {
      return res.status(400).json({
        message: "Tidak dapat menghapus Item PR yang sudah diproses PO.",
      });
    }

    const [result] = await db.query("DELETE FROM pr_item WHERE id_PRItem = ?", [id]);

    console.log("DELETE result:", result);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "PR Item tidak ditemukan" });
    }

    if (itemToDelete) {
      await updatePRStatus(itemToDelete.id_PR);
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
