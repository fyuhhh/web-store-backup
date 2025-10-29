import express from "express";
import db from "../config/database.js";

const router = express.Router();

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
  try {
    const [result] = await db.query(
      "INSERT INTO pr (noPR, tanggalPR, id_divisi, id_urgensi, status, dibuatOleh, id_skema, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        noPR,
        tanggalPR,
        id_divisi,
        id_urgensi,
        status,
        dibuatOleh,
        id_skema,
        createdAt,
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

    // Buat query dinamis
    const fields = Object.keys(payload);
    const values = Object.values(payload);

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

    res.json(updated || { message: "PR berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE PR
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM pr WHERE id_PR=?", [id]);
    res.json({ message: "PR berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
