import express from "express";
import db from "../config/database.js";

const router = express.Router();

console.log("Loaded routes: /api/po");

// Fungsi konversi tanggal ke YYYY-MM-DD
function formatDate(tgl) {
  if (!tgl) return null;
  return new Date(tgl).toISOString().split("T")[0];
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

    const [result] = await db.query(
      `INSERT INTO po
      (noPO, tanggalPO, id_supplier, diskon, originalDiskon, ppn, ppnAmount, totalPembayaran, orderedBy, estimasiTanggalTerima, id_statusPengiriman, id_statusPermintaan, status, createdAt, id_skema)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        noPO || "",
        tanggalPO || null,
        id_supplier || null,
        diskon || 0,
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
      newRow.tanggalPO = formatDate(newRow.tanggalPO);
      newRow.estimasiTanggalTerima = formatDate(newRow.estimasiTanggalTerima);
      newRow.createdAt = newRow.createdAt ? formatDate(newRow.createdAt) : null;
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

    const fields = Object.keys(payload);
    if (fields.length === 0)
      return res.status(400).json({ message: "No data to update" });

    const sql =
      `UPDATE po SET ` +
      fields.map((f) => `${f} = ?`).join(", ") +
      ` WHERE id_PO = ?`;

    await db.query(sql, [...fields.map((f) => payload[f]), id]);

    const [[updated]] = await db.query("SELECT * FROM po WHERE id_PO = ?", [
      id,
    ]);

    if (updated) {
      updated.tanggalPO = formatDate(updated.tanggalPO);
      updated.estimasiTanggalTerima = formatDate(updated.estimasiTanggalTerima);
      updated.createdAt = updated.createdAt
        ? formatDate(updated.createdAt)
        : null;
    }

    res.json(updated || { message: "PO berhasil diperbarui" });
  } catch (err) {
    next(err);
  }
});

// DELETE PO (beserta item)
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM po_item WHERE id_PO = ?", [id]);
    const [result] = await db.query("DELETE FROM po WHERE id_PO = ?", [id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "PO tidak ditemukan" });

    res.json({ message: "PO berhasil dihapus" });
  } catch (err) {
    next(err);
  }
});

export default router;
