import express from "express";
import db from "../config/database.js";

const router = express.Router();

// GET all holidays
router.get("/", async (req, res, next) => {
    try {
        const [rows] = await db.query("SELECT * FROM holidays ORDER BY tanggal ASC");
        res.json(rows);
    } catch (err) {
        next(err);
    }
});

// POST new holiday
router.post("/", async (req, res, next) => {
    try {
        const { tanggal, description } = req.body;
        if (!tanggal) {
            return res.status(400).json({ message: "Tanggal wajib diisi" });
        }

        // Insert
        // Format tanggal must be YYYY-MM-DD
        let dateVal = tanggal;
        if (dateVal.includes("T")) dateVal = dateVal.split("T")[0];

        const [result] = await db.query(
            "INSERT INTO holidays (tanggal, description) VALUES (?, ?)",
            [dateVal, description || ""]
        );
        const insertId = result.insertId;
        const [[newRow]] = await db.query("SELECT * FROM holidays WHERE id = ?", [insertId]);
        res.status(201).json(newRow);
    } catch (err) {
        next(err);
    }
});

// DELETE holiday
router.delete("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        const [result] = await db.query("DELETE FROM holidays WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Libur tidak ditemukan" });
        }
        res.json({ message: "Libur dihapus" });
    } catch (err) {
        next(err);
    }
});

export async function ensureHolidaysTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS holidays (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tanggal DATE NOT NULL,
            description VARCHAR(255)
        )
    `);
}

export default router;
