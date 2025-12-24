import express from "express";
import db from "../config/database.js";

const router = express.Router();

// Helper: hitung tanggal +N hari kerja (skip Sabtu/Minggu & Libur DB)
async function calculateEstimatePO(conn, startDateStr, days) {
  // Parsing date
  let date;
  if (/^\d{2}-\d{2}-\d{4}$/.test(startDateStr)) {
    const [d, m, y] = startDateStr.split("-");
    date = new Date(`${y}-${m}-${d}`);
  } else {
    date = new Date(startDateStr);
  }

  // Fetch holidays from DB (simple cache-less approach for now)
  const [holidaysRaw] = await conn.query("SELECT tanggal FROM holidays");
  // Set YYYY-MM-DD
  const holidaySet = new Set(holidaysRaw.map(h => {
    // Handle timezone issues by treating date string directly if possible, or robust parsing
    // Assuming backend returns valid Date object or string
    const d = new Date(h.tanggal);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }));

  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();

    const cy = date.getFullYear();
    const cm = String(date.getMonth() + 1).padStart(2, '0');
    const cd = String(date.getDate()).padStart(2, '0');
    const dateString = `${cy}-${cm}-${cd}`;

    // 0=Minggu, 6=Sabtu
    if (day !== 0 && day !== 6 && !holidaySet.has(dateString)) {
      added++;
    }
  }

  const resDd = String(date.getDate()).padStart(2, "0");
  const resMm = String(date.getMonth() + 1).padStart(2, "0");
  const resYy = date.getFullYear();
  return `${resDd}-${resMm}-${resYy}`;
}

// GET semua PR
router.get("/", async (req, res) => {
  try {
    // Join ke tabel skema, divisi, urgensi untuk dapatkan label
    const [rows] = await db.query(`
      SELECT 
        pr.*, 
        skema.skema AS skemaLabel,
        divisi.divisi AS divisiLabel,
        urgensi.urgensi AS urgensiLabel
      FROM pr
      LEFT JOIN skema ON pr.id_skema = skema.id_skema
      LEFT JOIN divisi ON pr.id_divisi = divisi.id_divisi
      LEFT JOIN urgensi ON pr.id_urgensi = urgensi.id_urgensi
      ORDER BY pr.id_PR ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET PR by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Join ke tabel skema untuk dapatkan label skema
    const [rows] = await db.query(
      `
      SELECT pr.*, skema.skema AS skemaLabel
      FROM pr
      LEFT JOIN skema ON pr.id_skema = skema.id_skema
      WHERE pr.id_PR=?
    `,
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "PR tidak ditemukan" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST PR baru
router.post("/", async (req, res) => {
  // Hapus semua log di backend

  let {
    noPR,
    tanggalPR,
    id_divisi,
    id_urgensi,
    status,
    dibuatOleh,
    id_skema,
    createdAt,
    // plan, // jangan ambil dari body, akan diisi otomatis
    // estimasipo, // <-- jangan ambil dari body, akan diisi otomatis
  } = req.body;

  id_divisi = typeof id_divisi === "string" ? parseInt(id_divisi) : id_divisi;
  id_urgensi =
    typeof id_urgensi === "string" ? parseInt(id_urgensi) : id_urgensi;
  id_skema = typeof id_skema === "string" ? parseInt(id_skema) : id_skema;

  // Validasi lebih detail
  const emptyFields = [];
  if (!noPR) emptyFields.push("noPR");
  if (!tanggalPR) emptyFields.push("tanggalPR");
  if (!id_divisi) emptyFields.push("id_divisi");
  if (!id_urgensi) emptyFields.push("id_urgensi");
  if (!status) emptyFields.push("status");
  if (!dibuatOleh) emptyFields.push("dibuatOleh");
  if (!id_skema) emptyFields.push("id_skema");

  if (emptyFields.length > 0) {
    return res.status(400).json({
      error: `Field berikut wajib diisi: ${emptyFields.join(", ")}`,
    });
  }

  // --- Hitung nilai kolom plan otomatis ---
  let plan = "No Plan";
  if (tanggalPR) {
    // tanggalPR bisa "yyyy-mm-dd" atau "dd-mm-yyyy"
    let day = 0;
    if (/^\d{4}-\d{2}-\d{2}$/.test(tanggalPR)) {
      // yyyy-mm-dd
      day = parseInt(tanggalPR.split("-")[2], 10);
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(tanggalPR)) {
      // dd-mm-yyyy
      day = parseInt(tanggalPR.split("-")[0], 10);
    }
    // Jika tanggal 25-31 atau 1-5
    if ((day >= 25 && day <= 31) || (day >= 1 && day <= 5)) {
      plan = "Plan";
    }
  }

  // --- Hitung estimasipo otomatis (3 hari kerja setelah tanggalPR) ---
  let estimasipo = null;
  if (tanggalPR) {
    try {
      estimasipo = await calculateEstimatePO(db, tanggalPR, 3);
    } catch (e) {
      console.error("Error calculating estimate:", e);
      // Fallback if db fails (shouldn't happen)
      estimasipo = null;
    }
  }

  try {
    const [result] = await db.query(
      "INSERT INTO pr (noPR, tanggalPR, id_divisi, id_urgensi, status, dibuatOleh, id_skema, createdAt, plan, estimasipo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        noPR,
        tanggalPR,
        id_divisi,
        id_urgensi,
        status,
        dibuatOleh,
        id_skema,
        createdAt,
        plan, // <-- tambahkan plan
        estimasipo, // <-- tambahkan estimasipo
      ]
    );
    res
      .status(201)
      .json({ message: "PR berhasil dibuat", id: result.insertId });
    return;
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT PR (update sebagian field saja)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const payload = req.body;

  try {
    // Kalau tidak ada data dikirim
    if (!payload || Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "Tidak ada data untuk diupdate" });
    }

    // === LOCK tanggalPR: hapus field tanggalPR dari payload agar tidak bisa diupdate ===
    if ('tanggalPR' in payload) {
      delete payload.tanggalPR;
    }

    // --- Normalisasi id_divisi, id_urgensi, id_skema ke integer jika string ---
    if (payload.id_divisi && typeof payload.id_divisi === "string") {
      payload.id_divisi = parseInt(payload.id_divisi);
    }
    if (payload.id_urgensi && typeof payload.id_urgensi === "string") {
      payload.id_urgensi = parseInt(payload.id_urgensi);
    }
    if (payload.id_skema && typeof payload.id_skema === "string") {
      payload.id_skema = parseInt(payload.id_skema);
    }

    // --- Validasi status agar hanya enum yang valid ---
    const allowedStatus = ["Draft", "Menunggu", "Gantung", "Diproses"];
    if (payload.status && !allowedStatus.includes(payload.status)) {
      // fallback ke "Menunggu" jika status tidak valid
      payload.status = "Menunggu";
    }

    // --- Hapus field yang tidak ada di tabel PR ---
    const allowedFields = [
      "noPR",
      // "tanggalPR", // <-- JANGAN izinkan update tanggalPR
      "id_divisi",
      "id_urgensi",
      "status",
      "dibuatOleh",
      "id_skema",
      "createdAt",
      "plan", // <-- tambahkan plan
    ];
    for (const key of Object.keys(payload)) {
      if (!allowedFields.includes(key)) {
        delete payload[key];
      }
    }

    // Buat query dinamis
    const fields = Object.keys(payload);
    const values = Object.values(payload);

    if (fields.length === 0) {
      return res
        .status(400)
        .json({ message: "Tidak ada field valid untuk update" });
    }

    const sql = `
      UPDATE pr
      SET ${fields.map((f) => `${f} = ?`).join(", ")}
      WHERE id_PR = ?
    `;

    await db.query(sql, [...values, id]);

    // Ambil ulang data setelah update
    const [[updated]] = await db.query("SELECT * FROM pr WHERE id_PR = ?", [
      id,
    ]);

    if (!updated) {
      return res.status(404).json({ message: "PR tidak ditemukan" });
    }

    res.json(updated || { message: "PR berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE PR (beserta item)
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Check if any PO items reference this PR
    // Find all PR items for this PR
    const [prItems] = await db.query("SELECT id_PRItem FROM pr_item WHERE id_PR = ?", [id]);
    if (prItems.length > 0) {
      // Check if any PO items reference these PR items
      const prItemIds = prItems.map(item => item.id_PRItem);
      if (prItemIds.length > 0) {
        const [poItems] = await db.query(
          `SELECT * FROM po_item WHERE id_PRItem IN (${prItemIds.map(() => "?").join(",")})`,
          prItemIds
        );
        if (poItems.length > 0) {
          return res.status(400).json({
            message: "PR tidak dapat dihapus karena sudah diproses menjadi PO. Silakan kembalikan semua item PO ke PR terlebih dahulu."
          });
        }
      }
    }

    // 2. Delete PR items
    await db.query("DELETE FROM pr_item WHERE id_PR = ?", [id]);
    // 3. Delete PR
    const [result] = await db.query("DELETE FROM pr WHERE id_PR = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "PR tidak ditemukan" });

    res.json({ message: "PR berhasil dihapus" });
  } catch (err) {
    next(err);
  }
});

export default router;
