import express from "express";
import db from "../config/database.js";

const router = express.Router();

// GET all PO items
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM po_item ORDER BY id_POItem DESC"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET single PO item by id_POItem
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[row]] = await db.query(
      "SELECT * FROM po_item WHERE id_POItem = ?",
      [id]
    );
    if (!row)
      return res.status(404).json({ message: "PO item tidak ditemukan" });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// CREATE PO item
router.post("/", async (req, res, next) => {
  try {
    const {
      id_PO,
      id_PRItem,
      hargaSatuan,
      jumlahPO,
      jumlahAsli,
      diskonPersen,
      diskonRupiah,
      ppnPersen,
      ppnRupiah,
      totalPerItem,
      keterangan,
      id_satuan,
    } = req.body;

    // Pastikan diskonPersen hanya angka (tanpa %)
    let diskonPersenValue = diskonPersen;
    if (typeof diskonPersen === "string" && diskonPersen.includes("%")) {
      const match = diskonPersen.match(/(\d+(\.\d+)?)/);
      diskonPersenValue = match ? parseFloat(match[1]) : 0;
    }

    // Pastikan diskonRupiah, ppnPersen, ppnRupiah adalah angka
    const diskonRupiahValue = Number(diskonRupiah) || 0;
    const ppnPersenValue = Number(ppnPersen) || 0;
    const ppnRupiahValue = Number(ppnRupiah) || 0;

    const [result] = await db.query(
      `INSERT INTO po_item 
        (id_PO, id_PRItem, hargaSatuan, jumlahPO, jumlahAsli, diskonPersen, diskonRupiah, ppnPersen, ppnRupiah, totalPerItem, keterangan, id_satuan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_PO || null,
        id_PRItem || null,
        hargaSatuan || 0,
        jumlahPO || 0,
        jumlahAsli || 0,
        diskonPersenValue || 0,
        diskonRupiahValue,
        ppnPersenValue,
        ppnRupiahValue,
        totalPerItem || 0,
        keterangan || "",
        id_satuan || null,
      ]
    );

    const insertId = result.insertId;
    const [[newRow]] = await db.query(
      "SELECT * FROM po_item WHERE id_POItem = ?",
      [insertId]
    );
    res.status(201).json(newRow || { id_POItem: insertId });
  } catch (err) {
    next(err);
  }
});

// UPDATE PO item by id_POItem
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    // Pastikan field baru bisa diupdate
    const fields = Object.keys(payload);
    if (fields.length === 0)
      return res.status(400).json({ message: "No data" });

    // Pastikan diskonPersen, diskonRupiah, ppnPersen, ppnRupiah adalah angka jika dikirim
    if (
      payload.diskonPersen &&
      typeof payload.diskonPersen === "string" &&
      payload.diskonPersen.includes("%")
    ) {
      const match = payload.diskonPersen.match(/(\d+(\.\d+)?)/);
      payload.diskonPersen = match ? parseFloat(match[1]) : 0;
    }
    if (payload.diskonRupiah)
      payload.diskonRupiah = Number(payload.diskonRupiah) || 0;
    if (payload.ppnPersen) payload.ppnPersen = Number(payload.ppnPersen) || 0;
    if (payload.ppnRupiah) payload.ppnRupiah = Number(payload.ppnRupiah) || 0;

    // Pastikan totalPerItem bisa diupdate jika dikirim
    if (payload.totalPerItem)
      payload.totalPerItem = Number(payload.totalPerItem) || 0;

    const sql =
      `UPDATE po_item SET ` +
      fields.map((f) => `${f} = ?`).join(", ") +
      ` WHERE id_POItem = ?`;
    await db.query(sql, [...fields.map((f) => payload[f]), id]);
    const [[updated]] = await db.query(
      "SELECT * FROM po_item WHERE id_POItem = ?",
      [id]
    );
    res.json(updated || { message: "Diperbarui" });
  } catch (err) {
    next(err);
  }
});

// DELETE PO item by id_POItem
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM po_item WHERE id_POItem = ?", [
      id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "PO item tidak ditemukan" });
    res.json({ message: "PO item dihapus" });
  } catch (err) {
    next(err);
  }
});

export default router;
