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
    const { nama_pengguna, password, id_peran, id_divisi, id_skema } = req.body;

    let updateFields = [];
    let updateValues = [];

    updateFields.push("nama_pengguna=?");
    updateValues.push(nama_pengguna);

    updateFields.push("id_peran=?");
    updateValues.push(id_peran);

    updateFields.push("id_divisi=?");
    updateValues.push(id_divisi);

    updateFields.push("id_skema=?");
    updateValues.push(id_skema);

    // Jika password dikirim, hash dulu
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updateFields.push("password=?");
      updateValues.push(hash);
    }

    updateValues.push(id);

    await db.query(
      `UPDATE user SET ${updateFields.join(", ")} WHERE id_user=?`,
      updateValues
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

    // Selalu bandingkan hash, tidak perlu pengecualian
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Password salah" });

    res.json({ message: "Login berhasil", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tambahkan inisialisasi superadmin jika belum ada
async function ensureSuperadmin() {
  const [rows] = await db.query("SELECT * FROM user WHERE nama_pengguna = ?", [
    "superadmin",
  ]);
  if (rows.length === 0) {
    const hash = await bcrypt.hash("superadminpentaewalk", 10);
    await db.query(
      "INSERT INTO user (nama_pengguna, password, id_peran, id_divisi, id_skema) VALUES (?, ?, ?, ?, ?)",
      ["superadmin", hash, 5, null, 1]
    );
    console.log("Superadmin default dibuat: superadmin/superadminpentaewalk");
  }
}

// Panggil fungsi ini dari server.js setelah import userRoutes
export { ensureSuperadmin };

export default router;
// Pada register/create user dan login sudah menerima id_skema sebagai number
// Tidak perlu ubah
