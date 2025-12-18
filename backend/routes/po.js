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
  if (!tanggalPR || !estimasipo || !tanggalPO) return "Tidak Tercapai";
  // Normalisasi ke Date
  function toDateObj(t) {
    if (/^\d{2}-\d{2}-\d{4}$/.test(t)) {
      const [d, m, y] = t.split("-");
      return new Date(`${y}-${m}-${d}`);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
      return new Date(t);
    }
    return new Date(t);
  }
  const dPR = toDateObj(tanggalPR);
  const dEst = toDateObj(estimasipo);
  const dPO = toDateObj(tanggalPO);
  if (isNaN(dPR.getTime()) || isNaN(dEst.getTime()) || isNaN(dPO.getTime())) return "Tidak Tercapai";
  // dPO >= dPR && dPO <= dEst
  if (dPO.getTime() >= dPR.getTime() && dPO.getTime() <= dEst.getTime()) {
    return "SCHEDULE (Tercapai)";
  }
  return "Tidak Tercapai";
}

// Helper: update statusterima pada PO (id_PO)
async function updateStatusTerimaPO(conn, id_PO) {
  // Ambil tanggalPO dari po
  const [[poRow]] = await conn.query("SELECT tanggalPO FROM po WHERE id_PO = ?", [id_PO]);
  const tanggalPOVal = poRow?.tanggalPO;
  // Ambil info PR terkait
  const prInfo = await getPRInfoByPO(conn, id_PO);
  let statusterima = "Tidak Tercapai";
  if (prInfo && tanggalPOVal) {
    statusterima = getStatusTerima(prInfo.tanggalPR, prInfo.estimasipo, tanggalPOVal);
    await conn.query("UPDATE po SET statusterima = ? WHERE id_PO = ?", [statusterima, id_PO]);
  }
  return statusterima;
}

// GET semua PO
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT * FROM po ORDER BY createdAt DESC");

    const formatted = rows.map((r) => ({
      ...r,
      tanggalPO: formatDate(r.tanggalPO),
      estimasiTanggalTerima: formatDate(r.estimasiTanggalTerima),
      createdAt: r.createdAt ? formatDate(r.createdAt) : null,
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
    const [[row]] = await db.query("SELECT * FROM po WHERE id_PO = ?", [id]);

    if (!row) return res.status(404).json({ message: "PO tidak ditemukan" });

    row.tanggalPO = formatDate(row.tanggalPO);
    row.estimasiTanggalTerima = formatDate(row.estimasiTanggalTerima);
    row.createdAt = row.createdAt ? formatDate(row.createdAt) : null;

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

// Tambahkan export agar bisa di-import di file lain
export { updateStatusTerimaPO };

export default router;
