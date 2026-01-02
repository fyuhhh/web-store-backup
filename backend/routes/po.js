import express from "express";
import db from "../config/database.js";

const router = express.Router();

console.log("Loaded routes: /api/po");

// Fungsi konversi tanggal ke YYYY-MM-DD
function formatDate(tgl) {
  if (!tgl) return null;
  // Jika sudah string 'YYYY-MM-DD', return apa adanya
  if (typeof tgl === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(tgl)) return tgl;
  // Jika Date object, ambil tanggal lokal (bukan UTC)
  if (tgl instanceof Date) {
    const yyyy = tgl.getFullYear();
    const mm = String(tgl.getMonth() + 1).padStart(2, '0');
    const dd = String(tgl.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return tgl;
}

// Helper: get PR info (tanggalPR, estimasipo) dari PO id
async function getPRInfoByPO(conn, id_PO) {
  // Ambil satu id_PR dari po_item
  const [[poItem]] = await conn.query(
    "SELECT id_PRItem FROM po_item WHERE id_PO = ? LIMIT 1",
    [id_PO]
  );
  if (!poItem || !poItem.id_PRItem) return null;
  // Ambil id_PR dari pr_item
  const [[prItem]] = await conn.query(
    "SELECT id_PR FROM pr_item WHERE id_PRItem = ?",
    [poItem.id_PRItem]
  );
  if (!prItem || !prItem.id_PR) return null;
  // Ambil tanggalPR & estimasipo dari pr
  const [[pr]] = await conn.query(
    "SELECT tanggalPR, estimasipo FROM pr WHERE id_PR = ?",
    [prItem.id_PR]
  );
  if (!pr) return null;
  return { tanggalPR: pr.tanggalPR, estimasipo: pr.estimasipo };
}

// Helper: cek apakah tanggalPO di antara tanggalPR dan estimasipo
function getStatusTerima(tanggalPR, estimasipo, tanggalPO) {
  if (!tanggalPR || !estimasipo || !tanggalPO) return "TIDAK TERCAPAI";
  // Normalisasi ke Date
  function toDateObj(t) {
    if (t instanceof Date) return t; // handle if already date object
    if (typeof t === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(t)) {
      const [d, m, y] = t.split("-");
      return new Date(`${y}-${m}-${d}`);
    }
    if (typeof t === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t)) {
      return new Date(t);
    }
    return new Date(t);
  }
  const dPR = toDateObj(tanggalPR);
  const dEst = toDateObj(estimasipo);
  const dPO = toDateObj(tanggalPO);

  // Set jam ke 00:00:00 untuk komparasi tanggal murni
  dPR.setHours(0, 0, 0, 0);
  dEst.setHours(0, 0, 0, 0);
  dPO.setHours(0, 0, 0, 0);

  if (isNaN(dPR.getTime()) || isNaN(dEst.getTime()) || isNaN(dPO.getTime())) return "TIDAK TERCAPAI";

  // Logic: dPO between dPR and dEst (inclusive)
  if (dPO.getTime() >= dPR.getTime() && dPO.getTime() <= dEst.getTime()) {
    return "SCHEDULE";
  }
  return "TIDAK TERCAPAI";
}

// Helper: update statusterima pada po_item (dan po optional)
async function updateStatusTerimaPO(conn, id_PO) {
  // Ambil tanggalPO dari po
  const [[poRow]] = await conn.query("SELECT tanggalPO FROM po WHERE id_PO = ?", [id_PO]);
  if (!poRow || !poRow.tanggalPO) return;

  const tanggalPOVal = poRow.tanggalPO;

  // Ambil semua item PO ini link ke PR
  const [items] = await conn.query(`
    SELECT pi.id_POItem, pr.tanggalPR, pr.estimasipo 
    FROM po_item pi
    LEFT JOIN pr_item pri ON pi.id_PRItem = pri.id_PRItem
    LEFT JOIN pr ON pri.id_PR = pr.id_PR
    WHERE pi.id_PO = ?
  `, [id_PO]);

  for (const item of items) {
    // Calculate status for each item
    const status = getStatusTerima(item.tanggalPR, item.estimasipo, tanggalPOVal);
    await conn.query("UPDATE po_item SET statusTerima = ? WHERE id_POItem = ?", [status, item.id_POItem]);
  }

  // Optional: Return something consistent
  return "UPDATED_ITEMS";
}

// GET semua PO
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT po.*, user.nama_pengguna as orderedByName 
      FROM po 
      LEFT JOIN user ON po.orderedBy = user.id_user 
      ORDER BY po.createdAt DESC
    `);

    const formatted = rows.map((r) => ({
      ...r,
      tanggalPO: formatDate(r.tanggalPO),
      estimasiTanggalTerima: formatDate(r.estimasiTanggalTerima),
      createdAt: r.createdAt ? formatDate(r.createdAt) : null,
      orderedBy: r.orderedByName || r.orderedBy, // Fallback to ID if name not found, or replace ID with Name if preferred
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// GET PO by id
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[row]] = await db.query(`
      SELECT po.*, user.nama_pengguna as orderedByName 
      FROM po 
      LEFT JOIN user ON po.orderedBy = user.id_user 
      WHERE po.id_PO = ?
    `, [id]);

    if (!row) return res.status(404).json({ message: "PO tidak ditemukan" });

    row.tanggalPO = formatDate(row.tanggalPO);
    row.estimasiTanggalTerima = formatDate(row.estimasiTanggalTerima);
    row.createdAt = row.createdAt ? formatDate(row.createdAt) : null;
    row.orderedBy = row.orderedByName || row.orderedBy;

    res.json(row);
  } catch (err) {
    next(err);
  }
});

// CREATE PO
router.post("/", async (req, res, next) => {
  try {
    const {
      noPO,
      tanggalPO,
      id_supplier,
      diskon,
      originalDiskon,
      ppn,
      ppnAmount,
      totalPembayaran,
      orderedBy,
      estimasiTanggalTerima,
      id_statusPengiriman,
      id_statusPermintaan,
      status,
      createdAt,
      id_skema,
    } = req.body;

    // Normalize decimals for all numeric fields
    const diskonVal = typeof diskon === "string"
      ? parseFloat(diskon.replace(",", "."))
      : Number(diskon) || 0;
    const originalDiskonVal = typeof originalDiskon === "string"
      ? parseFloat(originalDiskon.replace(/\./g, "").replace(",", "."))
      : Number(originalDiskon) || 0;
    const ppnVal = typeof ppn === "string"
      ? parseFloat(ppn.replace(",", "."))
      : Number(ppn) || 0;
    const ppnAmountVal = typeof ppnAmount === "string"
      ? parseFloat(ppnAmount.replace(/\./g, "").replace(",", "."))
      : Number(ppnAmount) || 0;
    const totalPembayaranVal = typeof totalPembayaran === "string"
      ? parseFloat(totalPembayaran.replace(/\./g, "").replace(",", "."))
      : Number(totalPembayaran) || 0;

    // Normalisasi tanggalPO dan estimasiTanggalTerima ke format YYYY-MM-DD
    if (req.body.tanggalPO && typeof req.body.tanggalPO === "string") {
      if (req.body.tanggalPO.includes("T")) {
        req.body.tanggalPO = req.body.tanggalPO.split("T")[0];
      } else if (/^\d{2}-\d{2}-\d{4}$/.test(req.body.tanggalPO)) {
        const [d, m, y] = req.body.tanggalPO.split("-");
        req.body.tanggalPO = `${y}-${m}-${d}`;
      }
    }
    if (req.body.estimasiTanggalTerima && typeof req.body.estimasiTanggalTerima === "string") {
      if (req.body.estimasiTanggalTerima.includes("T")) {
        req.body.estimasiTanggalTerima = req.body.estimasiTanggalTerima.split("T")[0];
      } else if (/^\d{2}-\d{2}-\d{4}$/.test(req.body.estimasiTanggalTerima)) {
        const [d, m, y] = req.body.estimasiTanggalTerima.split("-");
        req.body.estimasiTanggalTerima = `${y}-${m}-${d}`;
      }
    }

    const [result] = await db.query(
      `INSERT INTO po
      (noPO, tanggalPO, id_supplier, diskon, originalDiskon, ppn, ppnAmount, totalPembayaran, orderedBy, estimasiTanggalTerima, id_statusPengiriman, id_statusPermintaan, status, createdAt, id_skema)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        noPO || "",
        tanggalPO || null,
        id_supplier || null,
        diskonVal,
        originalDiskonVal,
        ppnVal,
        ppnAmountVal,
        totalPembayaranVal,
        orderedBy || null,
        estimasiTanggalTerima || null,
        id_statusPengiriman || null,
        id_statusPermintaan || null,
        status || "Menunggu",
        createdAt || new Date().toISOString(),
        id_skema || null,
      ]
    );
    const insertId = result.insertId;
    // --- statusterima kemungkinan belum bisa diisi di sini karena po_item biasanya belum ada ---
    // Tetap coba update, tapi jika null, biarkan, nanti diupdate setelah po_item masuk
    await updateStatusTerimaPO(db, insertId);
    const [[newRow]] = await db.query("SELECT * FROM po WHERE id_PO = ?", [
      insertId,
    ]);
    if (newRow) {
      newRow.tanggalPO = formatDate(newRow.tanggalPO);
      newRow.estimasiTanggalTerima = formatDate(newRow.estimasiTanggalTerima);
      newRow.createdAt = newRow.createdAt ? formatDate(newRow.createdAt) : null;
      // newRow.statusterima sudah terisi dari DB
    }
    res.status(201).json(newRow || { id_PO: insertId });
  } catch (err) {
    next(err);
  }
});

// UPDATE PO by id
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    // Normalize decimals for all numeric fields
    if (payload.diskon)
      payload.diskon = typeof payload.diskon === "string"
        ? parseFloat(payload.diskon.replace(",", "."))
        : Number(payload.diskon) || 0;
    if (payload.originalDiskon)
      payload.originalDiskon = typeof payload.originalDiskon === "string"
        ? parseFloat(payload.originalDiskon.replace(/\./g, "").replace(",", "."))
        : Number(payload.originalDiskon) || 0;
    if (payload.ppn)
      payload.ppn = typeof payload.ppn === "string"
        ? parseFloat(payload.ppn.replace(",", "."))
        : Number(payload.ppn) || 0;
    if (payload.ppnAmount)
      payload.ppnAmount = typeof payload.ppnAmount === "string"
        ? parseFloat(payload.ppnAmount.replace(/\./g, "").replace(",", "."))
        : Number(payload.ppnAmount) || 0;
    if (payload.totalPembayaran)
      payload.totalPembayaran = typeof payload.totalPembayaran === "string"
        ? parseFloat(payload.totalPembayaran.replace(/\./g, "").replace(",", "."))
        : Number(payload.totalPembayaran) || 0;

    // Normalisasi tanggalPO dan estimasiTanggalTerima ke format YYYY-MM-DD
    if (req.body.tanggalPO && typeof req.body.tanggalPO === "string") {
      if (req.body.tanggalPO.includes("T")) {
        req.body.tanggalPO = req.body.tanggalPO.split("T")[0];
      } else if (/^\d{2}-\d{2}-\d{4}$/.test(req.body.tanggalPO)) {
        const [d, m, y] = req.body.tanggalPO.split("-");
        req.body.tanggalPO = `${y}-${m}-${d}`;
      }
    }
    if (req.body.estimasiTanggalTerima && typeof req.body.estimasiTanggalTerima === "string") {
      if (req.body.estimasiTanggalTerima.includes("T")) {
        req.body.estimasiTanggalTerima = req.body.estimasiTanggalTerima.split("T")[0];
      } else if (/^\d{2}-\d{2}-\d{4}$/.test(req.body.estimasiTanggalTerima)) {
        const [d, m, y] = req.body.estimasiTanggalTerima.split("-");
        req.body.estimasiTanggalTerima = `${y}-${m}-${d}`;
      }
    }

    // Tambahkan: jika statusterima di payload, update langsung tanpa auto-calc
    let skipAutoStatus = false;
    if (typeof payload.statusterima === "string") {
      skipAutoStatus = true;
    }

    const fields = Object.keys(payload);
    if (fields.length === 0)
      return res.status(400).json({ message: "No data to update" });

    const sql =
      `UPDATE po SET ` +
      fields.map((f) => `${f} = ?`).join(", ") +
      ` WHERE id_PO = ?`;

    await db.query(sql, [...fields.map((f) => payload[f]), id]);
    // --- update statusterima setelah update ---
    if (!skipAutoStatus) {
      await updateStatusTerimaPO(db, id);
    }
    const [[updated]] = await db.query("SELECT * FROM po WHERE id_PO = ?", [
      id,
    ]);
    if (updated) {
      updated.tanggalPO = formatDate(updated.tanggalPO);
      updated.estimasiTanggalTerima = formatDate(updated.estimasiTanggalTerima);
      updated.createdAt = updated.createdAt
        ? formatDate(updated.createdAt)
        : null;
      // updated.statusterima sudah terisi dari DB
    }
    res.json(updated || { message: "PO berhasil diperbarui" });
  } catch (err) {
    next(err);
  }
});

// PATCH endpoint: paksa update statusterima PO (bisa dipanggil dari po_item.js)
router.patch("/update-statusterima/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const statusterima = await updateStatusTerimaPO(db, id);
    res.json({ id_PO: id, statusterima });
  } catch (err) {
    next(err);
  }
});

// DELETE PO (beserta item)
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // --- Tambahkan pengecekan: apakah ada BTB item yang refer ke PO ini? ---
    const [btbItems] = await db.query(
      "SELECT id_btb_item FROM btb_item WHERE id_POItem IN (SELECT id_POItem FROM po_item WHERE id_PO = ?)",
      [id]
    );

    if (btbItems.length > 0) {
      return res.status(400).json({
        message:
          "Tidak dapat menghapus PO ini karena sudah ada BTB yang terkait",
      });
    }

    await db.query("DELETE FROM po_item WHERE id_PO = ?", [id]);
    const result = await db.query("DELETE FROM po WHERE id_PO = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "PO tidak ditemukan" });
    }

    res.json({ message: "PO berhasil dihapus" });
  } catch (err) {
    next(err);
  }
});

// RESET PO ITEMS (Restore PR quantities & Delete PO Items)
router.post("/reset-items/:id", async (req, res, next) => {
  const { id } = req.params; // id_PO
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // 1. Get all items in this PO
    const [poItems] = await conn.query("SELECT * FROM po_item WHERE id_PO = ?", [id]);

    for (const poItem of poItems) {
      // 2. Restore quantity to PR Item
      // Use id_PRItem from po_item to find matching pr_item
      const [[prItem]] = await conn.query("SELECT * FROM pr_item WHERE id_PRItem = ?", [poItem.id_PRItem]);

      if (prItem) {
        // Restore: jumlah (remaining) = jumlah + jumlahPO (what was taken)
        const restoredJumlah = parseFloat(prItem.jumlah) + parseFloat(poItem.jumlahPO);
        await conn.query("UPDATE pr_item SET jumlah = ? WHERE id_PRItem = ?", [restoredJumlah, poItem.id_PRItem]);

        // Find PR ID
        const prId = prItem.id_PR;

        // 3. Update PR Status if needed (Set to 'Diproses' if it was 'Telah Selesai' or 'Gantung')
        // Since we are restoring items, it likely becomes 'open' again.
        // Let's set it to 'Diproses' to be safe, filtering ensures we don't accidentally close it.
        await conn.query("UPDATE pr SET status = 'Diproses' WHERE id_PR = ?", [prId]);
      }
    }

    // 4. Delete PO Items
    await conn.query("DELETE FROM po_item WHERE id_PO = ?", [id]);

    await conn.commit();
    res.json({ message: "PO Items reset successfully" });
  } catch (err) {
    if (conn) await conn.rollback();
    next(err);
  } finally {
    if (conn) conn.release();
  }
});

// Tambahkan export agar bisa di-import di file lain
export { updateStatusTerimaPO };

export default router;
