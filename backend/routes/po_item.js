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
      diskonItem,
      keterangan,
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO po_item (id_PO, id_PRItem, hargaSatuan, jumlahPO, jumlahAsli, diskonItem, keterangan)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id_PO || null,
        id_PRItem || null,
        hargaSatuan || 0,
        jumlahPO || 0,
        jumlahAsli || 0,
        diskonItem || 0,
        keterangan || "",
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
    const fields = Object.keys(payload);
    if (fields.length === 0)
      return res.status(400).json({ message: "No data" });

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
