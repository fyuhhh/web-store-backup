import express from "express";
import db from "../config/database.js";

const router = express.Router();

// GET all PO items
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM po_item ORDER BY id_POItem DESC"
    );
    // --- FIX: pastikan hargaSatuan, jumlahPO, jumlahAsli integer ---
    const fixedRows = rows.map((row) => ({
      ...row,
      hargaSatuan:
        row.hargaSatuan !== undefined && row.hargaSatuan !== null
          ? Math.round(Number(row.hargaSatuan))
          : 0,
      jumlahPO:
        row.jumlahPO !== undefined && row.jumlahPO !== null
          ? Math.round(Number(row.jumlahPO))
          : 0,
      jumlahAsli:
        row.jumlahAsli !== undefined && row.jumlahAsli !== null
          ? Math.round(Number(row.jumlahAsli))
          : 0,
      // namaPembeli sudah otomatis ikut dari SELECT *
    }));
    res.json(fixedRows);
  } catch (err) {
    next(err);
  }
});

// GET single PO item by id_POItem
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[row]] = await db.query(
      "SELECT * FROM po_item WHERE id_POItem = ?",
      [id]
    );
    if (!row)
      return res.status(404).json({ message: "PO item tidak ditemukan" });
    // --- FIX: pastikan hargaSatuan, jumlahPO, jumlahAsli integer ---
    row.hargaSatuan =
      row.hargaSatuan !== undefined && row.hargaSatuan !== null
        ? Math.round(Number(row.hargaSatuan))
        : 0;
    row.jumlahPO =
      row.jumlahPO !== undefined && row.jumlahPO !== null
        ? Math.round(Number(row.jumlahPO))
        : 0;
    row.jumlahAsli =
      row.jumlahAsli !== undefined && row.jumlahAsli !== null
        ? Math.round(Number(row.jumlahAsli))
        : 0;
    // namaPembeli sudah otomatis ikut dari SELECT *
    res.json(row);
  } catch (err) {
    next(err);
  }
});

// CREATE PO item
router.post("/", async (req, res, next) => {
  try {
    const {
      id_PO,
      id_PRItem,
      hargaSatuan,
      jumlahPO,
      jumlahAsli,
      diskonPersen,
      diskonRupiah,
      ppnPersen,
      ppnRupiah,
      totalPerItem,
      namaPembeli, // <-- tambahkan di sini
      keterangan,
      id_satuan,
    } = req.body;

    // Normalize decimals for all numeric fields
    const hargaSatuanVal =
      typeof hargaSatuan === "string"
        ? parseFloat(hargaSatuan.replace(/\./g, "").replace(",", "."))
        : Number(hargaSatuan) || 0;
    const jumlahPOVal =
      typeof jumlahPO === "string"
        ? parseFloat(jumlahPO.replace(/\./g, "").replace(",", "."))
        : Number(jumlahPO) || 0;
    const jumlahAsliVal =
      typeof jumlahAsli === "string"
        ? parseFloat(jumlahAsli.replace(/\./g, "").replace(",", "."))
        : Number(jumlahAsli) || 0;
    let diskonPersenValue = diskonPersen;
    if (typeof diskonPersen === "string" && diskonPersen.includes("%")) {
      const match = diskonPersen.match(/(\d+(\.\d+)?)/);
      diskonPersenValue = match ? parseFloat(match[1].replace(",", ".")) : 0;
    } else if (typeof diskonPersen === "string") {
      diskonPersenValue = parseFloat(diskonPersen.replace(",", ".")) || 0;
    }
    const diskonRupiahValue =
      typeof diskonRupiah === "string"
        ? parseFloat(diskonRupiah.replace(/\./g, "").replace(",", "."))
        : Number(diskonRupiah) || 0;
    const ppnPersenValue =
      typeof ppnPersen === "string"
        ? parseFloat(ppnPersen.replace(",", "."))
        : Number(ppnPersen) || 0;
    const ppnRupiahValue =
      typeof ppnRupiah === "string"
        ? parseFloat(ppnRupiah.replace(/\./g, "").replace(",", "."))
        : Number(ppnRupiah) || 0;
    const totalPerItemVal =
      typeof totalPerItem === "string"
        ? parseFloat(totalPerItem.replace(/\./g, "").replace(",", "."))
        : Number(totalPerItem) || 0;

    const [result] = await db.query(
      `INSERT INTO po_item 
        (id_PO, id_PRItem, hargaSatuan, jumlahPO, jumlahAsli, diskonPersen, diskonRupiah, ppnPersen, ppnRupiah, totalPerItem, namaPembeli, keterangan, id_satuan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_PO || null,
        id_PRItem || null,
        hargaSatuanVal,
        jumlahPOVal,
        jumlahAsliVal,
        diskonPersenValue,
        diskonRupiahValue,
        ppnPersenValue,
        ppnRupiahValue,
        totalPerItemVal,
        namaPembeli || null, // <-- simpan namaPembeli
        keterangan || "",
        id_satuan || null,
      ]
    );

    const insertId = result.insertId;
    const [[newRow]] = await db.query(
      "SELECT * FROM po_item WHERE id_POItem = ?",
      [insertId]
    );
    res.status(201).json(newRow || { id_POItem: insertId });
  } catch (err) {
    next(err);
  }
});

// UPDATE PO item by id_POItem
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    // Normalize decimals for all numeric fields
    if (payload.hargaSatuan)
      payload.hargaSatuan =
        typeof payload.hargaSatuan === "string"
          ? parseFloat(payload.hargaSatuan.replace(/\./g, "").replace(",", "."))
          : Number(payload.hargaSatuan) || 0;
    if (payload.jumlahPO)
      payload.jumlahPO =
        typeof payload.jumlahPO === "string"
          ? parseFloat(payload.jumlahPO.replace(/\./g, "").replace(",", "."))
          : Number(payload.jumlahPO) || 0;
    if (payload.jumlahAsli)
      payload.jumlahAsli =
        typeof payload.jumlahAsli === "string"
          ? parseFloat(payload.jumlahAsli.replace(/\./g, "").replace(",", "."))
          : Number(payload.jumlahAsli) || 0;
    if (
      payload.diskonPersen &&
      typeof payload.diskonPersen === "string" &&
      payload.diskonPersen.includes("%")
    ) {
      const match = payload.diskonPersen.match(/(\d+(\.\d+)?)/);
      payload.diskonPersen = match ? parseFloat(match[1].replace(",", ".")) : 0;
    } else if (
      payload.diskonPersen &&
      typeof payload.diskonPersen === "string"
    ) {
      payload.diskonPersen = parseFloat(payload.diskonPersen.replace(",", ".")) || 0;
    }
    if (payload.diskonRupiah)
      payload.diskonRupiah =
        typeof payload.diskonRupiah === "string"
          ? parseFloat(payload.diskonRupiah.replace(/\./g, "").replace(",", "."))
          : Number(payload.diskonRupiah) || 0;
    if (payload.ppnPersen)
      payload.ppnPersen =
        typeof payload.ppnPersen === "string"
          ? parseFloat(payload.ppnPersen.replace(",", "."))
          : Number(payload.ppnPersen) || 0;
    if (payload.ppnRupiah)
      payload.ppnRupiah =
        typeof payload.ppnRupiah === "string"
          ? parseFloat(payload.ppnRupiah.replace(/\./g, "").replace(",", "."))
          : Number(payload.ppnRupiah) || 0;
    if (payload.totalPerItem)
      payload.totalPerItem =
        typeof payload.totalPerItem === "string"
          ? parseFloat(payload.totalPerItem.replace(/\./g, "").replace(",", "."))
          : Number(payload.totalPerItem) || 0;

    // namaPembeli ikut di payload, bisa diupdate
    const fields = Object.keys(payload);
    if (fields.length === 0)
      return res.status(400).json({ message: "No data" });

    const sql =
      `UPDATE po_item SET ` +
      fields.map((f) => `${f} = ?`).join(", ") +
      ` WHERE id_POItem = ?`;
    await db.query(sql, [...fields.map((f) => payload[f]), id]);
    const [[updated]] = await db.query(
      "SELECT * FROM po_item WHERE id_POItem = ?",
      [id]
    );
    res.json(updated || { message: "Diperbarui" });
  } catch (err) {
    next(err);
  }
});

// DELETE PO item by id_POItem
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // --- Cek apakah ada btb_item yang refer ke id_POItem ini ---
    const [btbItems] = await db.query(
      "SELECT id_btb_item FROM btb_item WHERE id_POItem = ?",
      [id]
    );
    if (btbItems.length > 0) {
      return res.status(400).json({
        message:
          "Item PO tidak bisa dikembalikan ke PR karena sudah diproses menjadi BTB. Silakan kembalikan/dihapus BTB terlebih dahulu.",
      });
    }

    const [result] = await db.query("DELETE FROM po_item WHERE id_POItem = ?", [
      id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "PO item tidak ditemukan" });
    res.json({ message: "PO item dihapus" });
  } catch (err) {
    next(err);
  }
});

export default router;
