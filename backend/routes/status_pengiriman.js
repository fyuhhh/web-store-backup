import express from "express";
import db from "../config/database.js";

const router = express.Router();

// GET all
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM status_pengiriman ORDER BY id_statusPengiriman ASC"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET by id
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[row]] = await db.query(
      "SELECT * FROM status_pengiriman WHERE id_statusPengiriman = ?",
      [id]
    );
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// CREATE
router.post("/", async (req, res, next) => {
  try {
    const { status_pengiriman } = req.body;
    const [result] = await db.query(
      "INSERT INTO status_pengiriman (status_pengiriman) VALUES (?)",
      [status_pengiriman || ""]
    );
    const [[newRow]] = await db.query(
      "SELECT * FROM status_pengiriman WHERE id_statusPengiriman = ?",
      [result.insertId]
    );
    res.status(201).json(newRow || { id_statusPengiriman: result.insertId });
  } catch (err) {
    next(err);
  }
});

// UPDATE
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status_pengiriman } = req.body;
    await db.query(
      "UPDATE status_pengiriman SET status_pengiriman = ? WHERE id_statusPengiriman = ?",
      [status_pengiriman, id]
    );
    const [[updated]] = await db.query(
      "SELECT * FROM status_pengiriman WHERE id_statusPengiriman = ?",
      [id]
    );
    res.json(updated || { message: "Diperbarui" });
  } catch (err) {
    next(err);
  }
});

// DELETE
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await db.query(
      "DELETE FROM status_pengiriman WHERE id_statusPengiriman = ?",
      [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Not found" });
    res.json({ message: "Dihapus" });
  } catch (err) {
    next(err);
  }
});

export default router;
