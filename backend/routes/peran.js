import express from "express";
import db from "../config/database.js";

const router = express.Router();

// ➕ Tambah peran (bisa satu atau banyak)
router.post("/", async (req, res) => {
  try {
    // Validasi: pastikan req.body ada dan peran ada
    if (
      !req.body ||
      typeof req.body !== "object" ||
      req.body.peran === undefined
    ) {
      return res
        .status(400)
        .json({ message: "Body request harus berisi field 'peran'" });
    }
    const { peran } = req.body;

    // kalau cuma satu string
    if (typeof peran === "string") {
      await db.query("INSERT INTO peran (peran) VALUES (?)", [peran]);
      return res.status(201).json({ message: "Peran berhasil ditambahkan" });
    }

    // kalau array
    if (Array.isArray(peran)) {
      const values = peran.map((p) => [p]);
      // Gunakan INSERT IGNORE agar tidak error jika duplikat
      await db.query("INSERT IGNORE INTO peran (peran) VALUES ?", [values]);
      return res
        .status(201)
        .json({ message: "Banyak peran berhasil ditambahkan" });
    }

    res.status(400).json({ message: "Format data tidak valid" });
  } catch (error) {
    // Tambahkan log error detail
    console.error("Error POST /api/peran:", error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan server", error: error.message });
  }
});

// 🧾 GET semua peran
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM peran");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// ✏️ UPDATE peran
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { peran } = req.body;
  try {
    await db.query("UPDATE peran SET peran=? WHERE id_peran=?", [peran, id]);
    res.json({ message: "Peran berhasil diupdate" });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// 🗑️ DELETE peran
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM peran WHERE id_peran=?", [id]);
    res.json({ message: "Peran berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

export default router;
