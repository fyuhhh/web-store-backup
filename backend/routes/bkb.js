import express from "express";
import db from "../config/database.js";

const router = express.Router();
import { logActivity } from '../utils/activityLogger.js';

// GET Next BKB Number
router.get("/next-number", async (req, res) => {
  try {
    const { id_skema, tanggal_bkb } = req.query;

    if (!id_skema || !tanggal_bkb) {
      return res.status(400).json({ message: "id_skema and tanggal_bkb required" });
    }

    // Determine Schema Code
    let skemaCode = "PENTACITY"; // Default fallback (Pentacity)
    // Mapping based on DB check: 2 -> E-WALK, 1 -> PENTACITY
    if (String(id_skema) === "2" || String(id_skema).toLowerCase() === "ewalk") {
      skemaCode = "E-WALK";
    } else {
      skemaCode = "PENTACITY";
    }

    // Parse Date
    const d = new Date(tanggal_bkb);
    if (isNaN(d.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const yearFull = d.getFullYear();
    const yearShort = String(yearFull).substring(2); // 26
    const monthIndex = d.getMonth(); // 0-11

    // Roman Month Map
    const romanMonths = [
      "I", "II", "III", "IV", "V", "VI",
      "VII", "VIII", "IX", "X", "XI", "XII"
    ];
    const monthRoman = romanMonths[monthIndex];

    // Pattern: BKB/[CODE]/[YY]/[ROMAN]/%
    // e.g., BKB/E-WALK/26/I/%
    const pattern = `BKB/${skemaCode}/${yearShort}/${monthRoman}/%`;

    // Query matching BKBs
    const [rows] = await db.query(
      "SELECT no_bkb FROM bkb WHERE no_bkb LIKE ? ORDER BY LENGTH(no_bkb) DESC, no_bkb DESC LIMIT 1",
      [pattern]
    );

    let nextSeq = 1;
    if (rows.length > 0) {
      const lastNoBKB = rows[0].no_bkb;
      // Extract last part
      const parts = lastNoBKB.split("/");
      const lastSeqStr = parts[parts.length - 1];
      const lastSeq = parseInt(lastSeqStr, 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    const padLength = 3; // Standardize to 3 digits
    const nextSeqStr = String(nextSeq).padStart(padLength, "0");
    const nextNoBKB = `BKB/${skemaCode}/${yearShort}/${monthRoman}/${nextSeqStr}`;

    res.json({ nextNoBKB });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET semua BKB
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM bkb ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET BKB by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [[row]] = await db.query("SELECT * FROM bkb WHERE id_bkb = ?", [id]);
    if (!row) return res.status(404).json({ message: "BKB tidak ditemukan" });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE BKB
router.post("/", async (req, res) => {
  try {
    const {
      no_bkb,
      tanggal_bkb,
      keterangan,
      dibuat_oleh,
      dikeluarkan_oleh,
      diterima_oleh,
      skema, // frontend kirim skema, backend simpan ke id_skema
      id_btb, // <-- tambahkan field id_btb
      refrensiNoPr, // allow manual override, but will auto-lookup if not provided
      divisi, // <-- tambahkan field divisi
    } = req.body;

    // --- Check Duplicate No BKB ---
    if (no_bkb) {
      const [[existingBKB]] = await db.query("SELECT id_bkb FROM bkb WHERE no_bkb = ?", [no_bkb]);
      if (existingBKB) {
        return res.status(400).json({ message: "Nomor BKB telah digunakan" });
      }
    }

    // --- AUTO-LOOKUP refrensiNoPr jika tidak dikirim ---
    let finalRefrensiNoPr = refrensiNoPr;
    if (!finalRefrensiNoPr && id_btb) {
      // id_btb → id_po (btb) → id_POItem (btb_item) → id_PRItem (po_item) → id_PR (pr_item) → noPR (pr)
      // 1. Get id_po from btb
      const [[btbRow]] = await db.query("SELECT id_po FROM btb WHERE id_btb = ?", [id_btb]);
      if (btbRow && btbRow.id_po) {
        // 2. Get id_POItem from btb_item (ambil satu saja, asumsikan satu POItem utama)
        const [[btbItemRow]] = await db.query("SELECT id_POItem FROM btb_item WHERE id_btb = ? LIMIT 1", [id_btb]);
        if (btbItemRow && btbItemRow.id_POItem) {
          // 3. Get id_PRItem from po_item
          const [[poItemRow]] = await db.query("SELECT id_PRItem FROM po_item WHERE id_POItem = ?", [btbItemRow.id_POItem]);
          if (poItemRow && poItemRow.id_PRItem) {
            // 4. Get id_PR from pr_item
            const [[prItemRow]] = await db.query("SELECT id_PR FROM pr_item WHERE id_PRItem = ?", [poItemRow.id_PRItem]);
            if (prItemRow && prItemRow.id_PR) {
              // 5. Get noPR from pr
              const [[prRow]] = await db.query("SELECT noPR FROM pr WHERE id_PR = ?", [prItemRow.id_PR]);
              if (prRow && prRow.noPR) {
                finalRefrensiNoPr = prRow.noPR;
              }
            }
          }
        }
      }
    }

    const [result] = await db.query(
      `INSERT INTO bkb 
      (no_bkb, tanggal_bkb, keterangan, dibuat_oleh, dikeluarkan_oleh, diterima_oleh, id_skema, id_btb, refrensiNoPr, divisi) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        no_bkb,
        tanggal_bkb,
        keterangan || "",
        dibuat_oleh || null,
        dikeluarkan_oleh || null,
        diterima_oleh || null,
        skema || null, // simpan ke id_skema
        id_btb || null, // <-- simpan ke kolom id_btb
        finalRefrensiNoPr || null,
        divisi || null, // <-- simpan ke kolom divisi
      ]
    );

    logActivity(req, {
      action_type: 'CREATE',
      entity_id: 'BKB',
      details: `Membuat BKB baru ${no_bkb}`,
      status: 'SUCCESS'
    });

    res
      .status(201)
      .json({ message: "BKB berhasil dibuat", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST BKB + items sekaligus (input BKB dari frontend)
router.post("/full", async (req, res) => {
  const {
    no_bkb,
    tanggal_bkb,
    keterangan,
    dibuat_oleh,
    dikeluarkan_oleh,
    diterima_oleh,
    skema, // frontend kirim skema, backend simpan ke id_skema
    barang, // array of { id_btb_item, nama_barang, jumlah_keluar, satuan, keterangan }
    id_btb, // <-- tambahkan field id_btb
    refrensiNoPr, // allow manual override, but will auto-lookup if not provided
    divisi, // <-- tambahkan field divisi
  } = req.body;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // --- Check Duplicate No BKB ---
    if (no_bkb) {
      const [[existingBKB]] = await conn.query("SELECT id_bkb FROM bkb WHERE no_bkb = ?", [no_bkb]);
      if (existingBKB) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ message: "Nomor BKB telah digunakan" });
      }
    }

    // --- AUTO-LOOKUP refrensiNoPr jika tidak dikirim ---
    let finalRefrensiNoPr = refrensiNoPr;
    if (!finalRefrensiNoPr && id_btb) {
      const [[btbRow]] = await conn.query("SELECT id_po FROM btb WHERE id_btb = ?", [id_btb]);
      if (btbRow && btbRow.id_po) {
        const [[btbItemRow]] = await conn.query("SELECT id_POItem FROM btb_item WHERE id_btb = ? LIMIT 1", [id_btb]);
        if (btbItemRow && btbItemRow.id_POItem) {
          const [[poItemRow]] = await conn.query("SELECT id_PRItem FROM po_item WHERE id_POItem = ?", [btbItemRow.id_POItem]);
          if (poItemRow && poItemRow.id_PRItem) {
            const [[prItemRow]] = await conn.query("SELECT id_PR FROM pr_item WHERE id_PRItem = ?", [poItemRow.id_PRItem]);
            if (prItemRow && prItemRow.id_PR) {
              const [[prRow]] = await conn.query("SELECT noPR FROM pr WHERE id_PR = ?", [prItemRow.id_PR]);
              if (prRow && prRow.noPR) {
                finalRefrensiNoPr = prRow.noPR;
              }
            }
          }
        }
      }
    }

    // 1. Insert ke bkb (tambahkan field divisi)
    const [bkbResult] = await conn.query(
      `INSERT INTO bkb (no_bkb, tanggal_bkb, keterangan, dibuat_oleh, dikeluarkan_oleh, diterima_oleh, id_skema, id_btb, refrensiNoPr, divisi)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        no_bkb,
        tanggal_bkb,
        keterangan || "",
        dibuat_oleh || null,
        dikeluarkan_oleh || null,
        diterima_oleh || null,
        skema || null, // simpan ke id_skema
        id_btb || null, // <-- simpan ke kolom id_btb
        finalRefrensiNoPr || null,
        divisi || null, // <-- simpan ke kolom divisi
      ]
    );
    const id_bkb = bkbResult.insertId;

    // 2. Insert ke bkb_item dan update sisa btb_item (tidak berubah)
    for (const item of barang) {
      const [[btbItem]] = await conn.query(
        "SELECT qty_sisa, jumlah_diterima FROM btb_item WHERE id_btb_item = ?",
        [item.id_btb_item]
      );
      const sisaSebelum = btbItem?.qty_sisa ?? btbItem?.jumlah_diterima ?? 0;
      const jumlahKeluar = Number(item.jumlah_keluar);

      await conn.query(
        `INSERT INTO bkb_item
          (id_bkb, id_btb_item, nama_barang, jumlah_keluar, id_satuan, sisa_btb, keterangan)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id_bkb,
          item.id_btb_item,
          item.nama_barang,
          jumlahKeluar,
          item.satuan || null, // simpan ke id_satuan
          Math.max(0, sisaSebelum - jumlahKeluar),
          item.keterangan || "",
        ]
      );

      await conn.query(
        "UPDATE btb_item SET qty_sisa = ? WHERE id_btb_item = ?",
        [Math.max(0, sisaSebelum - jumlahKeluar), item.id_btb_item]
      );
    }

    await conn.commit();

    logActivity(req, {
      action_type: 'CREATE',
      entity_id: 'BKB',
      details: `Membuat BKB (Full) ${no_bkb}`,
      status: 'SUCCESS'
    });

    res.status(201).json({ message: "BKB & item berhasil disimpan", id_bkb });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// UPDATE BKB
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  try {
    // --- Check Duplicate No BKB (exclude current ID) ---
    if (payload.no_bkb) {
      const [[existingBKB]] = await db.query("SELECT id_bkb FROM bkb WHERE no_bkb = ? AND id_bkb != ?", [payload.no_bkb, id]);
      if (existingBKB) {
        return res.status(400).json({ message: "Nomor BKB telah digunakan" });
      }
    }

    const fields = Object.keys(payload);
    if (fields.length === 0)
      return res.status(400).json({ message: "Tidak ada data untuk update" });

    // Pastikan id_btb & divisi bisa diupdate jika dikirim
    const sql =
      `UPDATE bkb SET ` +
      fields.map((f) => `${f} = ?`).join(", ") +
      ` WHERE id_bkb = ?`;

    await db.query(sql, [...fields.map((f) => payload[f]), id]);

    logActivity(req, {
      action_type: 'UPDATE',
      entity_id: 'BKB',
      details: `Update BKB ID ${id}`,
      status: 'SUCCESS'
    });

    res.json({ message: "BKB berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE BKB
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM bkb WHERE id_bkb = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "BKB tidak ditemukan" });

    logActivity(req, {
      action_type: 'DELETE',
      entity_id: 'BKB',
      details: `Menghapus BKB ID ${id}`,
      status: 'WARNING'
    });

    res.json({ message: "BKB berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/transaksi", async (req, res) => {
  const conn = await db.getConnection(); // <-- ini hanya bisa jika db adalah pool!
  try {
    await conn.beginTransaction();
    // ...query...
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

export default router;
