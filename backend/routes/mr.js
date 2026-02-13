
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
            items // Array of items
        } = req.body;

        if (!no_mr || !tanggal_mr) {
            return res.status(400).json({ message: "No MR and Tanggal MR are required" });
        }

        // Insert Header
        const [result] = await connection.query(
            `INSERT INTO mr (no_mr, tanggal_mr, id_divisi, nama_supplier, tanggal_pembelian)
       VALUES (?, ?, ?, ?, ?)`,
            [no_mr, tanggal_mr, id_divisi || null, nama_supplier || null, tanggal_pembelian || null]
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

export default router;
