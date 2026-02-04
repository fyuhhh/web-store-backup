import express from "express";
import db from "../config/database.js";
import { updatePOStatus } from '../utils/statusHelper.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

// Helper: bandingkan tanggal, return true jika tglBTB <= tglEstimasi
function isTanggalTercapai(tglEstimasi, tglBTB) {
  function toDateObj(t) {
    if (!t) return null;
    if (/^\d{2}-\d{2}-\d{4}$/.test(t)) {
      const [d, m, y] = t.split("-");
      return new Date(`${y}-${m}-${d}`);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
      return new Date(t);
    }
    return new Date(t);
  }
  const dateEstimasi = toDateObj(tglEstimasi);
  const dateBTB = toDateObj(tglBTB);
  if (!dateEstimasi || !dateBTB || isNaN(dateEstimasi.getTime()) || isNaN(dateBTB.getTime())) return null;
  return dateBTB.getTime() <= dateEstimasi.getTime();
}

// Helper: cek apakah semua jumlahPO pada po_item untuk id_po sudah 0
async function isSemuaJumlahPOZero(conn, id_po) {
  const [poItems] = await conn.query("SELECT jumlahPO FROM po_item WHERE id_PO = ?", [id_po]);
  if (!poItems.length) return false;
  return poItems.every((item) => Number(item.jumlahPO) === 0);
}

// Helper: update targetPencapaianPo pada BTB (id_btb) berdasarkan kondisi terbaru
async function updateTargetPencapaianPoByBTB(conn, id_btb) {
  // Ambil id_po dan tanggal_btb dari btb
  const [[btb]] = await conn.query("SELECT id_po, tanggal_btb FROM btb WHERE id_btb = ?", [id_btb]);
  if (!btb || !btb.id_po || !btb.tanggal_btb) return;
  const id_po = btb.id_po;
  const tanggal_btb = btb.tanggal_btb;
  // Ambil estimasiTanggalTerima dari po
  const [[po]] = await conn.query("SELECT estimasiTanggalTerima FROM po WHERE id_PO = ?", [id_po]);
  if (!po || !po.estimasiTanggalTerima) return;
  // Cek semua jumlahPO pada po_item
  const semuaZero = await isSemuaJumlahPOZero(conn, id_po);
  let finalTarget = "Tidak Tercapai";
  if (isTanggalTercapai(po.estimasiTanggalTerima, tanggal_btb) && semuaZero) {
    finalTarget = "Tercapai";
  }
  await conn.query("UPDATE btb SET targetPencapaianPo = ? WHERE id_btb = ?", [finalTarget, id_btb]);
}

// Fungsi hitung delay (jumlah hari: + jika telat, - jika lebih cepat)
function hitungDelayTanggal(estimasi, aktual) {
  if (!estimasi || !aktual) return null;
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
  const dateEstimasi = toDateObj(estimasi);
  const dateAktual = toDateObj(aktual);
  if (isNaN(dateEstimasi.getTime()) || isNaN(dateAktual.getTime())) return null;
  // Hitung selisih hari (dibulatkan)
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((dateAktual - dateEstimasi) / msPerDay);
}

// GET Next BTB Number
router.get("/next-number", async (req, res) => {
  try {
    const { id_skema, tanggal_btb } = req.query;

    if (!id_skema || !tanggal_btb) {
      return res.status(400).json({ message: "id_skema and tanggal_btb required" });
    }

    // Determine Schema Code
    let skemaCode = "PENTACITY"; // Default fallback (Pentacity)
    // Mapping based on DB check: 2 -> E-WALK, 1 -> PENTACITY
    if (String(id_skema) === "2" || String(id_skema).toLowerCase() === "ewalk") {
      skemaCode = "E-WALK";
    } else {
      skemaCode = "PENTACITY";
    }

    // Parse Date
    const d = new Date(tanggal_btb);
    if (isNaN(d.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }

    const yearFull = d.getFullYear();
    const yearShort = String(yearFull).substring(2); // 26
    const monthIndex = d.getMonth(); // 0-11

    // Roman Month Map
    const romanMonths = [
      "I", "II", "III", "IV", "V", "VI",
      "VII", "VIII", "IX", "X", "XI", "XII"
    ];
    const monthRoman = romanMonths[monthIndex];

    // Pattern: BTB/[CODE]/[YY]/[ROMAN]/%
    // e.g., BTB/E-WALK/26/I/%
    const pattern = `BTB/${skemaCode}/${yearShort}/${monthRoman}/%`;

    // Query matching BTBs
    const [rows] = await db.query(
      "SELECT no_btb FROM btb WHERE no_btb LIKE ? ORDER BY LENGTH(no_btb) DESC, no_btb DESC LIMIT 1",
      [pattern]
    );

    let nextSeq = 1;
    if (rows.length > 0) {
      const lastNoBTB = rows[0].no_btb;
      // Extract last part
      const parts = lastNoBTB.split("/");
      const lastSeqStr = parts[parts.length - 1];
      const lastSeq = parseInt(lastSeqStr, 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    const padLength = 3; // Standardize to 3 digits for BTB/BKB usually
    const nextSeqStr = String(nextSeq).padStart(padLength, "0");
    const nextNoBTB = `BTB/${skemaCode}/${yearShort}/${monthRoman}/${nextSeqStr}`;

    res.json({ nextNoBTB });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET semua BTB
router.get("/", async (req, res) => {
  try {
    // HAPUS LEFT JOIN btb_item agar tidak duplikat baris dan biaya selalu benar
    const [rows] = await db.query(`
      SELECT 
        btb.*, 
        supplier.namaSupplier, 
        user.nama_pengguna, 
        skema.skema, 
        po.noPO
      FROM btb
      LEFT JOIN supplier ON btb.id_supplier = supplier.id_supplier
      LEFT JOIN user ON btb.id_user = user.id_user
      LEFT JOIN skema ON btb.id_skema = skema.id_skema
      LEFT JOIN po ON btb.id_po = po.id_PO
      ORDER BY btb.created_at DESC
    `);
    // Pastikan biaya dari btb (bukan dari btb_item) dan tidak null
    const fixedRows = rows.map((row) => ({
      ...row,
      biaya:
        row.biaya !== undefined && row.biaya !== null
          ? Number(row.biaya)
          : 0,
    }));
    res.json(fixedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET BTB by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [[row]] = await db.query(
      `
      SELECT 
        btb.*, 
        supplier.namaSupplier, 
        user.nama_pengguna, 
        skema.skema, 
        po.noPO
      FROM btb
      LEFT JOIN supplier ON btb.id_supplier = supplier.id_supplier
      LEFT JOIN user ON btb.id_user = user.id_user
      LEFT JOIN skema ON btb.id_skema = skema.id_skema
      LEFT JOIN po ON btb.id_po = po.id_PO
      WHERE btb.id_btb = ?
    `,
      [id]
    );
    if (!row) return res.status(404).json({ message: "BTB tidak ditemukan" });

    // Log Activity
    logActivity(req, {
      action_type: 'VIEW_BTB',
      entity_id: row.no_btb,
      details: { id_btb: row.id_btb },
      status: 'INFO'
    });

    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE BTB
router.post("/", async (req, res) => {
  const conn = await db.getConnection();
  try {
    const {
      no_btb,
      tanggal_btb,
      periode,
      id_po,
      id_supplier,
      nama_supplier,
      id_user,
      id_skema,
      biaya,
      diterima_oleh,
      tanggal_diterima,
      status,
    } = req.body;

    // --- Check Duplicate No BTB ---
    if (no_btb) {
      const [[existingBTB]] = await conn.query("SELECT id_btb FROM btb WHERE no_btb = ?", [no_btb]);
      if (existingBTB) {
        // Must release connection before return in transaction-less or manual connection handling
        conn.release();
        return res.status(400).json({ message: "Nomor BTB telah digunakan" });
      }
    }

    // --- Ambil tanggal estimasi diterima dari PO ---
    let targetPencapaianPo = "";
    let delay = null;
    let estimasiTanggal = null;
    if (id_po && tanggal_btb) {
      const [[po]] = await conn.query("SELECT estimasiTanggalTerima FROM po WHERE id_PO = ?", [id_po]);
      estimasiTanggal = po && po.estimasiTanggalTerima ? po.estimasiTanggalTerima : null;
      if (estimasiTanggal) {
        delay = hitungDelayTanggal(estimasiTanggal, tanggal_btb);
      }
      if (po && po.estimasiTanggalTerima && tanggal_btb) {
        const semuaZero = await isSemuaJumlahPOZero(conn, id_po);
        if (isTanggalTercapai(po.estimasiTanggalTerima, tanggal_btb) && semuaZero) {
          targetPencapaianPo = "Tercapai";
        } else {
          targetPencapaianPo = "Tidak Tercapai";
        }
      }
    }

    // --- FIX: pastikan biaya integer dan tidak null ---
    const biayaInt =
      biaya !== undefined && biaya !== null && biaya !== ""
        ? Math.round(Number(biaya))
        : 0;
    const [result] = await conn.query(
      `INSERT INTO btb 
      (no_btb, tanggal_btb, periode, id_po, id_supplier, nama_supplier, id_user, id_skema, biaya, diterima_oleh, tanggal_diterima, status, targetPencapaianPo, delay)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        no_btb,
        tanggal_btb,
        periode || null,
        id_po,
        id_supplier || null,
        nama_supplier || "",
        id_user || null,
        id_skema || null,
        biayaInt,
        diterima_oleh || null,
        tanggal_diterima || null,
        status || "draft",
        targetPencapaianPo,
        delay, // <-- simpan delay
      ]
    );
    // Setelah insert, update targetPencapaianPo (agar selalu sesuai kondisi terbaru)
    await updateTargetPencapaianPoByBTB(conn, result.insertId);

    // Tambahkan: update biaya pada btb setelah semua btb_item masuk (jika ada)
    // (Jika BTB item sudah diinput setelah header, update biaya di endpoint lain)

    res
      .status(201)
      .json({ message: "BTB berhasil dibuat", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// UPDATE BTB
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  const conn = await db.getConnection();
  try {
    // --- Check Duplicate No BTB (exclude current ID) ---
    if (payload.no_btb) {
      const [[existingBTB]] = await conn.query("SELECT id_btb FROM btb WHERE no_btb = ? AND id_btb != ?", [payload.no_btb, id]);
      if (existingBTB) {
        conn.release();
        return res.status(400).json({ message: "Nomor BTB telah digunakan" });
      }
    }

    // --- Jika tanggal_btb atau id_po diupdate, update delay juga ---
    let delay = null;
    let estimasiTanggal = null;
    let tanggal_btb = payload.tanggal_btb;
    let id_po = payload.id_po;
    // Jika tidak dikirim di payload, ambil dari DB
    if (!tanggal_btb || !id_po) {
      const [[btbRow]] = await conn.query("SELECT id_po, tanggal_btb FROM btb WHERE id_btb = ?", [id]);
      if (!id_po) id_po = btbRow?.id_po;
      if (!tanggal_btb) tanggal_btb = btbRow?.tanggal_btb;
    }
    if (id_po && tanggal_btb) {
      const [[po]] = await conn.query("SELECT estimasiTanggalTerima FROM po WHERE id_PO = ?", [id_po]);
      estimasiTanggal = po && po.estimasiTanggalTerima ? po.estimasiTanggalTerima : null;
      if (estimasiTanggal) {
        delay = hitungDelayTanggal(estimasiTanggal, tanggal_btb);
        payload.delay = delay;
      }
    }

    // --- Jika tanggal_diterima atau id_po diupdate, update targetPencapaianPo juga ---
    let targetPencapaianPo = payload.targetPencapaianPo;
    if ((payload.tanggal_diterima || payload.id_po) && (payload.tanggal_diterima || payload.id_po)) {
      // Ambil tanggal estimasi diterima dari PO
      const id_po2 = payload.id_po || id_po;
      const tanggal_diterima = payload.tanggal_diterima;
      if (id_po2 && tanggal_diterima) {
        const [[po]] = await conn.query("SELECT estimasiTanggalTerima FROM po WHERE id_PO = ?", [id_po2]);
        if (po && po.estimasiTanggalTerima) {
          const semuaZero = await isSemuaJumlahPOZero(conn, id_po2);
          if (isTanggalTercapai(po.estimasiTanggalTerima, tanggal_diterima) && semuaZero) {
            targetPencapaianPo = "Tercapai";
          } else {
            targetPencapaianPo = "Tidak Tercapai";
          }
        }
      }
    }
    if (targetPencapaianPo !== undefined) {
      payload.targetPencapaianPo = targetPencapaianPo;
    }

    const fields = Object.keys(payload);
    if (fields.length === 0)
      return res.status(400).json({ message: "Tidak ada data untuk update" });

    const sql =
      `UPDATE btb SET ` +
      fields.map((f) => `${f} = ?`).join(", ") +
      ` WHERE id_btb = ?`;

    await conn.query(sql, [...fields.map((f) => payload[f]), id]);
    // Setelah update, update targetPencapaianPo (agar selalu sesuai kondisi terbaru)
    await updateTargetPencapaianPoByBTB(conn, id);
    res.json({ message: "BTB berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// DELETE BTB (beserta item, ON DELETE CASCADE)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Sebelum hapus BTB, kembalikan (restore) jumlahPO pada po_item untuk semua item di BTB ini
    const [btbItems] = await db.query("SELECT id_POItem, jumlah_diterima FROM btb_item WHERE id_btb = ?", [id]);
    for (const item of btbItems) {
      if (item.id_POItem && item.jumlah_diterima > 0) {
        await db.query("UPDATE po_item SET jumlahPO = jumlahPO + ? WHERE id_POItem = ?", [item.jumlah_diterima, item.id_POItem]);
      }
    }

    const [result] = await db.query("DELETE FROM btb WHERE id_btb = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "BTB tidak ditemukan" });

    // Update status PO untuk semua PO yang terlibat (biasanya 1 BTB -> 1 PO)
    const uniquePOIds = [...new Set(btbItems.map(item => item.id_PO))].filter(Boolean);
    for (const pid of uniquePOIds) {
      await updatePOStatus(pid);
    }

    res.json({ message: "BTB berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Tambah endpoint untuk input BTB beserta item dan update jumlahPO pada po_item ===
router.post("/full", async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      no_btb,
      tanggal_btb,
      periode,
      id_po,
      id_supplier,
      id_user,
      id_skema,
      biaya,
      diterima_oleh,
      tanggal_diterima,
      items,
    } = req.body;

    // --- Check Duplicate No BTB ---
    if (no_btb) {
      const [[existingBTB]] = await conn.query("SELECT id_btb FROM btb WHERE no_btb = ?", [no_btb]);
      if (existingBTB) {
        await conn.rollback(); // safe to rollback even if nothing done? yes.
        conn.release();
        return res.status(400).json({ message: "Nomor BTB telah digunakan" });
      }
    }

    // --- Ambil tanggal estimasi diterima dari PO ---
    let targetPencapaianPo = "";
    if (id_po && tanggal_btb) {
      const [[po]] = await conn.query("SELECT estimasiTanggalTerima FROM po WHERE id_PO = ?", [id_po]);
      if (po && po.estimasiTanggalTerima && tanggal_btb) {
        // Setelah insert semua item, cek apakah semua jumlahPO sudah 0
        // (sementara, set dulu, nanti update setelah insert item)
        targetPencapaianPo = "Tidak Tercapai";
      }
    }

    // 1. Insert ke btb (header)
    // --- FIX: pastikan biaya integer dan tidak null ---
    const biayaInt =
      biaya !== undefined && biaya !== null && biaya !== ""
        ? Number(biaya)
        : 0;
    const [btbResult] = await conn.query(
      `INSERT INTO btb 
      (no_btb, tanggal_btb, periode, id_po, id_supplier, id_user, id_skema, biaya, diterima_oleh, tanggal_btb, tanggal_diterima, created_at, status, targetPencapaianPo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'Menunggu', ?)`,
      [
        no_btb,
        tanggal_btb,
        periode || null,
        id_po,
        id_supplier || null,
        id_user || null,
        id_skema || null,
        biayaInt,
        diterima_oleh || null,
        tanggal_btb || null,
        tanggal_diterima || null,
        targetPencapaianPo,
      ]
    );
    const id_btb = btbResult.insertId;

    // 2. Insert ke btb_item dan update jumlahPO pada po_item
    for (const item of items || []) {
      const { id_POItem, nama_barang, jumlah_diterima, id_satuan, keterangan } =
        item;

      // === HITUNG biaya per item proporsional dari totalPerItem ===
      let biayaPerItem = 0;
      if (id_POItem && jumlah_diterima > 0) {
        // Ambil totalPerItem dan jumlahAsli dari po_item
        const [[poItem]] = await conn.query(
          "SELECT totalPerItem, jumlahAsli FROM po_item WHERE id_POItem = ?",
          [id_POItem]
        );
        const totalPerItem = Number(poItem?.totalPerItem ?? 0);
        const jumlahAsli = Number(poItem?.jumlahAsli ?? 0);
        if (totalPerItem > 0 && jumlahAsli > 0) {
          biayaPerItem = Math.round((jumlah_diterima / jumlahAsli) * totalPerItem);
        } else if (totalPerItem > 0 && jumlah_diterima > 0) {
          biayaPerItem = Math.round(totalPerItem / jumlah_diterima);
        } else {
          biayaPerItem = 0;
        }
      }

      // Insert ke btb_item (tambahkan kolom biaya)
      await conn.query(
        `INSERT INTO btb_item 
        (id_btb, id_POItem, nama_barang, jumlah_diterima, id_satuan, keterangan, qty_sisa, biaya, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          id_btb,
          id_POItem || null,
          nama_barang,
          jumlah_diterima || 0,
          id_satuan || null,
          keterangan || "",
          jumlah_diterima || 0, // qty_sisa = jumlah_diterima
          biayaPerItem, // <-- biaya per item proporsional
        ]
      );

      // Update jumlahPO pada po_item (kurangi dengan jumlah_diterima)
      if (id_POItem && jumlah_diterima) {
        // Ambil jumlahPO lama
        const [[poItemQty]] = await conn.query(
          "SELECT jumlahPO FROM po_item WHERE id_POItem = ?",
          [id_POItem]
        );
        const sisa = Math.max(
          0,
          Math.round(Number(poItemQty?.jumlahPO || 0)) - Math.round(Number(jumlah_diterima))
        );
        await conn.query(
          "UPDATE po_item SET jumlahPO = ? WHERE id_POItem = ?",
          [sisa, id_POItem]
        );
      }
    }

    // Setelah insert semua item, update biaya pada btb = SUM(biaya) dari btb_item
    const [[sumBiaya]] = await conn.query(
      "SELECT SUM(biaya) AS total FROM btb_item WHERE id_btb = ?",
      [id_btb]
    );
    await conn.query("UPDATE btb SET biaya = ? WHERE id_btb = ?", [
      Math.round(Number(sumBiaya?.total || 0)),
      id_btb,
    ]);

    // Setelah insert semua item, update targetPencapaianPo pada btb (agar selalu sesuai kondisi terbaru)
    await updateTargetPencapaianPoByBTB(conn, id_btb);

    await conn.commit();

    // Update status PO setelah transaksi berhasil
    if (id_po) {
      await updatePOStatus(id_po);
    }

    res.status(201).json({ message: "BTB dan item berhasil dibuat", id_btb });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

router.post("/force-update-target/:id_btb", async (req, res) => {
  const conn = await db.getConnection();
  try {
    await updateTargetPencapaianPoByBTB(conn, req.params.id_btb);
    res.json({ message: "targetPencapaianPo updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Tambahkan endpoint PATCH untuk update biaya BTB secara manual (opsional, untuk monitoring/maintenance)
router.patch("/update-biaya/:id_btb", async (req, res) => {
  const { id_btb } = req.params;
  try {
    const [[sumBiaya]] = await db.query(
      "SELECT SUM(biaya) AS total FROM btb_item WHERE id_btb = ?",
      [id_btb]
    );
    await db.query("UPDATE btb SET biaya = ? WHERE id_btb = ?", [
      Math.round(Number(sumBiaya?.total || 0)),
      id_btb,
    ]);
    res.json({ message: "Biaya BTB berhasil diupdate", biaya: Math.round(Number(sumBiaya?.total || 0)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH hanya untuk update targetPencapaianPo
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { targetPencapaianPo } = req.body;
  if (typeof targetPencapaianPo !== "string") {
    return res.status(400).json({ error: "targetPencapaianPo wajib diisi" });
  }
  try {
    await db.query(
      "UPDATE btb SET targetPencapaianPo = ? WHERE no_btb = ? OR id_btb = ?",
      [targetPencapaianPo, id, id]
    );
    res.json({ message: "Target Pencapaian PO berhasil diupdate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tambahkan export agar bisa di-import di file lain
export { updateTargetPencapaianPoByBTB };

export default router;
