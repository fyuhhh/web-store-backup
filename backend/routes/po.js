import express from "express";
import db from "../config/database.js";

const router = express.Router();

// ADDED: log to confirm route file is loaded
console.log("Loaded routes: /api/po");
// END ADDED

function formatTanggal(tgl) {
  if (!tgl) return "";
  const date = String(tgl).split("T")[0];
  const [y, m, d] = date.split("-");
  return `${d}-${m}-${y}`;
}

// GET all PO
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query("SELECT * FROM po ORDER BY createdAt DESC");
    const result = rows.map((r) => ({
      ...r,
      tanggalPO: formatTanggal(r.tanggalPO),
      estimasiTanggalTerima: formatTanggal(r.estimasiTanggalTerima),
      createdAt: r.createdAt ? String(r.createdAt) : r.createdAt,
    }));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET one PO by id_PO
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[row]] = await db.query("SELECT * FROM po WHERE id_PO = ?", [id]);
    if (!row) return res.status(404).json({ message: "PO tidak ditemukan" });
    row.tanggalPO = formatTanggal(row.tanggalPO);
    row.estimasiTanggalTerima = formatTanggal(row.estimasiTanggalTerima);
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

    const [result] = await db.query(
      `INSERT INTO po
      (noPO, tanggalPO, id_supplier, diskon, originalDiskon, ppn, ppnAmount, totalPembayaran, orderedBy, estimasiTanggalTerima, id_statusPengiriman, id_statusPermintaan, status, createdAt, id_skema)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        noPO || "",
        tanggalPO || null,
        id_supplier || null,
        diskon || "0",
        originalDiskon || "",
        ppn || 0,
        ppnAmount || 0,
        totalPembayaran || 0,
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
    const [[newRow]] = await db.query("SELECT * FROM po WHERE id_PO = ?", [
      insertId,
    ]);
    if (newRow) {
      newRow.tanggalPO = formatTanggal(newRow.tanggalPO);
      newRow.estimasiTanggalTerima = formatTanggal(
        newRow.estimasiTanggalTerima
      );
    }
    res.status(201).json(newRow || { id_PO: insertId });
  } catch (err) {
    next(err);
  }
});

// UPDATE PO by id_PO
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    // Build dynamic set clause
    const fields = Object.keys(payload);
    if (fields.length === 0)
      return res.status(400).json({ message: "No data" });
    const setClause = fields.map(() => "?? = ?").join(", ");
    const params = fields.flatMap((k) => [k, payload[k]]);
    // Using simple query with placeholders for safety
    const sql =
      `UPDATE po SET ` +
      fields.map((f) => `${f} = ?`).join(", ") +
      ` WHERE id_PO = ?`;
    await db.query(sql, [...fields.map((f) => payload[f]), id]);
    const [[updated]] = await db.query("SELECT * FROM po WHERE id_PO = ?", [
      id,
    ]);
    if (updated) {
      updated.tanggalPO = formatTanggal(updated.tanggalPO);
      updated.estimasiTanggalTerima = formatTanggal(
        updated.estimasiTanggalTerima
      );
    }
    res.json(updated || { message: "Diperbarui" });
  } catch (err) {
    next(err);
  }
});

// DELETE PO (and its items)
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    // delete po items first
    await db.query("DELETE FROM po_item WHERE id_PO = ?", [id]);
    const [result] = await db.query("DELETE FROM po WHERE id_PO = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "PO tidak ditemukan" });
    res.json({ message: "PO dihapus" });
  } catch (err) {
    next(err);
  }
});

export default router;
