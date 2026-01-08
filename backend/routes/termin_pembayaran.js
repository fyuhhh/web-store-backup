import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// GET all termin
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM termin_pembayaran ORDER BY id_termin ASC");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// POST new termin
router.post('/', async (req, res) => {
    try {
        const { termin } = req.body;
        if (!termin) return res.status(400).json({ error: "Termin is required" });

        const [result] = await db.query("INSERT INTO termin_pembayaran (termin) VALUES (?)", [termin]);
        res.status(201).json({ id_termin: result.insertId, termin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// PUT update termin
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { termin } = req.body;
        if (!termin) return res.status(400).json({ error: "Termin is required" });

        await db.query("UPDATE termin_pembayaran SET termin = ? WHERE id_termin = ?", [termin, id]);
        res.json({ id, termin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE termin
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM termin_pembayaran WHERE id_termin = ?", [id]);
        res.json({ message: "Deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
