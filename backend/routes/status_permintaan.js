import express from "express";
import db from "../config/database.js";

const router = express.Router();

// GET all
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM status_permintaan ORDER BY id_statusPermintaan ASC"
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
      "SELECT * FROM status_permintaan WHERE id_statusPermintaan = ?",
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
    const { status_permintaan } = req.body;
    const [result] = await db.query(
      "INSERT INTO status_permintaan (status_permintaan) VALUES (?)",
      [status_permintaan || ""]
    );
    const [[newRow]] = await db.query(
      "SELECT * FROM status_permintaan WHERE id_statusPermintaan = ?",
      [result.insertId]
    );
    res.status(201).json(newRow || { id_statusPermintaan: result.insertId });
  } catch (err) {
    next(err);
  }
});

// UPDATE
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status_permintaan } = req.body;
    await db.query(
      "UPDATE status_permintaan SET status_permintaan = ? WHERE id_statusPermintaan = ?",
      [status_permintaan, id]
    );
    const [[updated]] = await db.query(
      "SELECT * FROM status_permintaan WHERE id_statusPermintaan = ?",
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
      "DELETE FROM status_permintaan WHERE id_statusPermintaan = ?",
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
