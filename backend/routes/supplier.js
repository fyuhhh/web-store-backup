import express from "express";
import db from "../config/database.js";

const router = express.Router();

// GET all suppliers
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM supplier ORDER BY namaSupplier ASC"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET supplier by id_supplier
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[row]] = await db.query(
      "SELECT * FROM supplier WHERE id_supplier = ?",
      [id]
    );
    if (!row)
      return res.status(404).json({ message: "Supplier tidak ditemukan" });
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// CREATE supplier
router.post("/", async (req, res, next) => {
  try {
    const { namaSupplier } = req.body;
    const [result] = await db.query(
      "INSERT INTO supplier (namaSupplier) VALUES (?)",
      [namaSupplier || ""]
    );
    const [[newRow]] = await db.query(
      "SELECT * FROM supplier WHERE id_supplier = ?",
      [result.insertId]
    );
    res.status(201).json(newRow || { id_supplier: result.insertId });
  } catch (err) {
    next(err);
  }
});

// UPDATE supplier
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { namaSupplier } = req.body;
    await db.query(
      "UPDATE supplier SET namaSupplier = ? WHERE id_supplier = ?",
      [namaSupplier, id]
    );
    const [[updated]] = await db.query(
      "SELECT * FROM supplier WHERE id_supplier = ?",
      [id]
    );
    res.json(updated || { message: "Diperbarui" });
  } catch (err) {
    next(err);
  }
});

// DELETE supplier
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await db.query(
      "DELETE FROM supplier WHERE id_supplier = ?",
      [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Supplier tidak ditemukan" });
    res.json({ message: "Supplier dihapus" });
  } catch (err) {
    next(err);
  }
});

export default router;
