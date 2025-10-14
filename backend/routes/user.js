import express from "express";
import db from "../config/database.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// Saat register/create user
router.post("/", async (req, res) => {
  try {
    const { nama_pengguna, password, id_peran, id_divisi, id_skema } = req.body;
    const hash = await bcrypt.hash(password, 10); // 10 = salt rounds

    // Simpan hash ke database
    // Jika id_divisi null atau undefined, gunakan NULL di SQL
    const divisiValue =
      id_divisi === null || id_divisi === undefined || id_divisi === ""
        ? null
        : id_divisi;
    const [result] = await db.query(
      "INSERT INTO user (nama_pengguna, password, id_peran, id_divisi, id_skema) VALUES (?, ?, ?, ?, ?)",
      [nama_pengguna, hash, id_peran, divisiValue, id_skema]
    );

    res.status(201).json({
      message: "User berhasil dibuat",
      id: result.insertId,
    });
  } catch (err) {
    console.error("Error INSERT user:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ READ semua user (GET)
router.get("/", async (req, res) => {
  try {
    const [result] = await db.query("SELECT * FROM user");
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE user (PUT)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_pengguna, id_peran, id_divisi, id_skema } = req.body;

    await db.query(
      "UPDATE user SET nama_pengguna=?, id_peran=?, id_divisi=?, id_skema=? WHERE id_user=?",
      [nama_pengguna, id_peran, id_divisi, id_skema, id]
    );

    res.json({ message: "User berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE user (DELETE)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM user WHERE id_user=?", [id]);
    res.json({ message: "User berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Saat login
router.post("/login", async (req, res) => {
  try {
    const { nama_pengguna, password } = req.body;
    const [rows] = await db.query("SELECT * FROM user WHERE nama_pengguna=?", [
      nama_pengguna,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ message: "User tidak ditemukan" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password); // bandingkan hash
    if (!valid) return res.status(401).json({ message: "Password salah" });

    res.json({ message: "Login berhasil", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
