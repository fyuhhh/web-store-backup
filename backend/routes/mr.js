
import express from "express";
import db from "../config/database.js";

const router = express.Router();

// Helper: Format date YYYY-MM-DD
function formatDate(tgl) {
    if (!tgl) return null;
    if (typeof tgl === "string" && /^\d{4}-\d{2}-\d{2}$/.test(tgl)) return tgl;
    if (tgl instanceof Date) {
        const yyyy = tgl.getFullYear();
        const mm = String(tgl.getMonth() + 1).padStart(2, "0");
        const dd = String(tgl.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }
    return tgl;
}

// GET All MRs
router.get("/", async (req, res, next) => {
    try {
        const [rows] = await db.query("SELECT * FROM mr ORDER BY created_at DESC");
        const formatted = rows.map((r) => ({
            ...r,
            tanggal_mr: formatDate(r.tanggal_mr),
            tanggal_pembelian: formatDate(r.tanggal_pembelian),
        }));
        res.json(formatted);
    } catch (err) {
        next(err);
    }
});

// GET All MR Items (monitoring view)
router.get("/items/all", async (req, res, next) => {
    try {
        const query = `
            SELECT 
                mi.*, 
                m.id_mr,
                m.no_mr, 
                m.tanggal_mr, 
                m.tanggal_pembelian, 
                m.nama_supplier, 
                m.id_skema, 
                m.id_divisi, 
                d.divisi as nama_divisi
            FROM mr m
            LEFT JOIN mr_item mi ON m.id_mr = mi.id_mr
            LEFT JOIN divisi d ON m.id_divisi = d.id_divisi
            ORDER BY m.created_at DESC, mi.id_mr_item ASC
        `;
        const [rows] = await db.query(query);
        const formatted = rows.map((r) => ({
            ...r,
            tanggal_mr: formatDate(r.tanggal_mr),
            tanggal_pembelian: formatDate(r.tanggal_pembelian),
        }));
        res.json(formatted);
    } catch (err) {
        next(err);
    }
});

// GET All MRs

// GET Next MR Number
router.get("/next-number", async (req, res, next) => {
    try {
        const { tanggal_mr } = req.query;
        // Format: MR/YYYY/MM/XXXX
        const d = tanggal_mr ? new Date(tanggal_mr) : new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const pattern = `MR/${year}/${month}/%`;

        const [rows] = await db.query(
            "SELECT no_mr FROM mr WHERE no_mr LIKE ? ORDER BY LENGTH(no_mr) DESC, no_mr DESC LIMIT 1",
            [pattern]
        );

        let nextSeq = 1;
        if (rows.length > 0) {
            const lastNo = rows[0].no_mr;
            const parts = lastNo.split("/");
            const lastSeqStr = parts[parts.length - 1];
            const lastSeq = parseInt(lastSeqStr, 10);
            if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
        }

        const nextSeqStr = String(nextSeq).padStart(4, "0");
        const nextNoMR = `MR/${year}/${month}/${nextSeqStr}`;
        res.json({ nextNoMR });
    } catch (err) {
        next(err);
    }
});

// GET MR by ID
router.get("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        const [[mr]] = await db.query("SELECT * FROM mr WHERE id_mr = ?", [id]);
        if (!mr) return res.status(404).json({ message: "MR not found" });

        const [items] = await db.query("SELECT * FROM mr_item WHERE id_mr = ?", [id]);
        mr.items = items;

        // Format dates
        mr.tanggal_mr = formatDate(mr.tanggal_mr);
        mr.tanggal_pembelian = formatDate(mr.tanggal_pembelian);

        res.json(mr);
    } catch (err) {
        next(err);
    }
});

// CREATE MR
router.post("/", async (req, res, next) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            no_mr,
            tanggal_mr,
            id_divisi,
            nama_supplier,
            tanggal_pembelian,
            id_skema,
            items // Array of items
        } = req.body;

        if (!no_mr || !tanggal_mr) {
            return res.status(400).json({ message: "No MR and Tanggal MR are required" });
        }

        // Insert Header
        const [result] = await connection.query(
            `INSERT INTO mr (no_mr, tanggal_mr, id_divisi, nama_supplier, tanggal_pembelian, id_skema)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [no_mr, tanggal_mr, id_divisi || null, nama_supplier || null, tanggal_pembelian || null, id_skema || null]
        );

        const id_mr = result.insertId;

        // Insert Items
        if (items && Array.isArray(items) && items.length > 0) {
            const values = items.map(item => [
                id_mr,
                item.nama_barang,
                item.quantity || 0,
                item.satuan || null,
                item.keterangan || null,
                item.harga_satuan || 0,
                item.diskon_persen || null,
                item.diskon_rp || 0,
                item.ppn_persen || 0,
                item.ppn_rp || 0,
                item.total || 0
            ]);

            await connection.query(
                `INSERT INTO mr_item (id_mr, nama_barang, quantity, satuan, keterangan, harga_satuan, diskon_persen, diskon_rp, ppn_persen, ppn_rp, total)
         VALUES ?`,
                [values]
            );
        }

        await connection.commit();
        res.status(201).json({ message: "MR Created", id_mr });
    } catch (err) {
        await connection.rollback();
        next(err);
    } finally {
        connection.release();
    }
});
// DELETE MR (and cascaded items)
router.delete("/:id", async (req, res, next) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;

        // Delete Items first (optional if ON DELETE CASCADE is set, but safer here)
        await connection.query("DELETE FROM mr_item WHERE id_mr = ?", [id]);
        
        // Delete Header
        const [result] = await connection.query("DELETE FROM mr WHERE id_mr = ?", [id]);
        
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "MR not found" });
        }

        await connection.commit();
        res.json({ message: "MR deleted successfully" });
    } catch (err) {
        await connection.rollback();
        next(err);
    } finally {
        connection.release();
    }
});

// DELETE Item specific
router.delete("/items/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        const [result] = await db.query("DELETE FROM mr_item WHERE id_mr_item = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: "Item not found" });
        res.json({ message: "Item deleted successfully" });
    } catch (err) {
        next(err);
    }
});

// UPDATE MR (Full Update)
router.put("/:id", async (req, res, next) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const {
            no_mr,
            tanggal_mr,
            id_divisi,
            nama_supplier,
            tanggal_pembelian,
            id_skema,
            items // Array of items
        } = req.body;

        // Update Header
        await connection.query(
            `UPDATE mr 
             SET no_mr=?, tanggal_mr=?, id_divisi=?, nama_supplier=?, tanggal_pembelian=?, id_skema=?
             WHERE id_mr=?`,
            [no_mr, tanggal_mr, id_divisi || null, nama_supplier || null, tanggal_pembelian || null, id_skema || null, id]
        );

        // Update Items strategy: Delete all and re-insert (Simplest for now)
        // Ideally we should track IDs, but strict replace is acceptable for MR as it's a simple document.
        await connection.query("DELETE FROM mr_item WHERE id_mr = ?", [id]);

        if (items && Array.isArray(items) && items.length > 0) {
            const values = items.map(item => [
                id,
                item.nama_barang,
                item.quantity || 0,
                item.satuan || null,
                item.keterangan || null,
                item.harga_satuan || 0,
                item.diskon_persen || null,
                item.diskon_rp || 0,
                item.ppn_persen || 0,
                item.ppn_rp || 0,
                item.total || 0
            ]);

            await connection.query(
                `INSERT INTO mr_item (id_mr, nama_barang, quantity, satuan, keterangan, harga_satuan, diskon_persen, diskon_rp, ppn_persen, ppn_rp, total)
                 VALUES ?`,
                [values]
            );
        }

        await connection.commit();
        res.json({ message: "MR updated successfully" });
    } catch (err) {
        await connection.rollback();
        next(err);
    } finally {
        connection.release();
    }
});

export default router;
