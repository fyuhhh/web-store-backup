import express from "express";
import db from "../config/database.js";
import { updateTargetPencapaianPoByBTB } from "./btb.js"; // pastikan export fungsi ini dari btb.js
import { updateStatusTerimaPO } from "./po.js";
import { updatePRStatus, updatePOStatus } from '../utils/statusHelper.js';

const router = express.Router();

// GET all PO items
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT po_item.*, 
        (SELECT COUNT(*) FROM btb_item WHERE btb_item.id_POItem = po_item.id_POItem) > 0 AS hasBTB
       FROM po_item ORDER BY id_POItem ASC`
    );
    // --- FIX: pastikan hargaSatuan, jumlahPO, jumlahAsli integer ---
    const fixedRows = rows.map((row) => ({
      ...row,
      hargaSatuan:
        row.hargaSatuan !== undefined && row.hargaSatuan !== null
          ? Number(row.hargaSatuan)
          : 0,
      jumlahPO:
        row.jumlahPO !== undefined && row.jumlahPO !== null
          ? Number(row.jumlahPO)
          : 0,
      jumlahAsli:
        row.jumlahAsli !== undefined && row.jumlahAsli !== null
          ? Number(row.jumlahAsli)
          : 0,
      // namaPembeli sudah otomatis ikut dari SELECT *
    }));

    // --- Recalculate totalPerItem if it is 0/null but harga & qty exist ---
    const recalcRows = fixedRows.map((row) => {
      let finalTotal = Number(row.totalPerItem) || 0;
      if (finalTotal === 0 && row.hargaSatuan > 0 && (row.jumlahPO > 0 || row.jumlahAsli > 0)) {
        const qty = row.jumlahPO > 0 ? row.jumlahPO : row.jumlahAsli;
        const subtotal = row.hargaSatuan * qty;
        // PPN/Diskon
        let diskonAmount = Number(row.diskonRupiah) || 0;
        if (row.diskonPersen) {
          // Parse stacked discount "50%+20%" -> apply 50% then 20%
          const parts = String(row.diskonPersen).split("+");
          let currentTotal = subtotal;
          for (const part of parts) {
            const val = parseFloat(part.replace("%", "").replace(",", ".")) || 0;
            if (val > 0) {
              currentTotal -= currentTotal * (val / 100);
            }
          }
          diskonAmount = subtotal - currentTotal;
        }
        const afterDiskon = Math.max(0, subtotal - diskonAmount);
        let ppnAmount = Number(row.ppnRupiah) || 0;
        if (row.ppnPersen > 0) {
          ppnAmount += afterDiskon * (row.ppnPersen / 100);
        }
        finalTotal = afterDiskon + ppnAmount;
      }
      return {
        ...row,
        totalPerItem: finalTotal
      };
    });

    res.json(recalcRows);
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
        ? Number(row.hargaSatuan)
        : 0;
    row.jumlahPO =
      row.jumlahPO !== undefined && row.jumlahPO !== null
        ? Number(row.jumlahPO)
        : 0;
    row.jumlahAsli =
      row.jumlahAsli !== undefined && row.jumlahAsli !== null
        ? Number(row.jumlahAsli)
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
      statusTerima, // <-- NEW field
    } = req.body;

    // Normalize decimals for all numeric fields
    const cleanCurrency = (val) => {
      if (typeof val === "string") {
        return parseFloat(val.replace(/[^0-9,-]/g, "").replace(",", ".")) || 0;
      }
      return Number(val) || 0;
    };

    const hargaSatuanVal = cleanCurrency(hargaSatuan);
    const jumlahPOVal = cleanCurrency(jumlahPO);
    const jumlahAsliVal = cleanCurrency(jumlahAsli);

    let diskonPersenValue = diskonPersen;
    if (typeof diskonPersen === "string") {
      if (diskonPersen.includes("+")) {
        diskonPersenValue = diskonPersen.replace(/,/g, ".");
      } else {
        diskonPersenValue = parseFloat(diskonPersen.replace(",", ".")) || 0;
      }
    }

    const diskonRupiahValue = cleanCurrency(diskonRupiah);
    const ppnPersenValue = typeof ppnPersen === "string" ? parseFloat(ppnPersen.replace(",", ".")) : Number(ppnPersen) || 0;
    const ppnRupiahValue = cleanCurrency(ppnRupiah);
    const totalPerItemVal = cleanCurrency(totalPerItem);

    // --- Auto-calculate statusTerima ---
    let autoStatus = statusTerima || null;
    if (id_PO && id_PRItem) {
      try {
        const [[poData]] = await db.query("SELECT tanggalPO FROM po WHERE id_PO = ?", [id_PO]);
        const [[prData]] = await db.query(`
            SELECT pr.tanggalPR, pr.estimasipo 
            FROM pr_item pri
            JOIN pr ON pri.id_PR = pr.id_PR
            WHERE pri.id_PRItem = ?
        `, [id_PRItem]);

        if (poData?.tanggalPO && prData?.tanggalPR && prData?.estimasipo) {
          const toDateObj = (t) => {
            if (t instanceof Date) return t;
            if (typeof t === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(t)) {
              const [d, m, y] = t.split("-");
              return new Date(`${y}-${m}-${d}`);
            }
            return new Date(t);
          };
          const dPO = toDateObj(poData.tanggalPO);
          const dPR = toDateObj(prData.tanggalPR);
          const dEst = toDateObj(prData.estimasipo);
          dPO.setHours(0, 0, 0, 0);
          dPR.setHours(0, 0, 0, 0);
          dEst.setHours(0, 0, 0, 0);

          if (dPO.getTime() >= dPR.getTime() && dPO.getTime() <= dEst.getTime()) {
            autoStatus = "SCHEDULE";
          } else {
            autoStatus = "TIDAK TERCAPAI";
          }
        }
      } catch (e) {
        console.error("Auto status calc error:", e);
      }
    }

    const [result] = await db.query(
      `INSERT INTO po_item 
        (id_PO, id_PRItem, hargaSatuan, jumlahPO, jumlahAsli, diskonPersen, diskonRupiah, ppnPersen, ppnRupiah, totalPerItem, namaPembeli, keterangan, id_satuan, statusTerima)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        autoStatus, // <-- NEW value
      ]
    );
    const insertId = result.insertId;
    const [[newRow]] = await db.query(
      "SELECT * FROM po_item WHERE id_POItem = ?",
      [insertId]
    );
    // --- update statusterima pada PO terkait (optional legacy support) ---
    // if (newRow && newRow.id_PO) {
    //   await updateStatusTerimaPO(db, newRow.id_PO);
    // }

    // --- FIX: Deduct PR quantity and Update PR Status ---
    if (id_PRItem && jumlahPOVal > 0) {
      await db.query(
        "UPDATE pr_item SET jumlah = GREATEST(0, jumlah - ?) WHERE id_PRItem = ?",
        [jumlahPOVal, id_PRItem]
      );
      // Update PR status
      const [[prItem]] = await db.query("SELECT id_PR FROM pr_item WHERE id_PRItem = ?", [id_PRItem]);
      if (prItem) {
        await updatePRStatus(prItem.id_PR);
      }
    }

    // --- FIX: Update PO Status ---
    if (id_PO) {
      await updatePOStatus(id_PO);
    }

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
    // Normalize decimals for all numeric fields
    const cleanCurrency = (val) => {
      if (typeof val === "string") {
        return parseFloat(val.replace(/[^0-9,-]/g, "").replace(",", ".")) || 0;
      }
      return Number(val) || 0;
    };

    // --- Check if item is processed to BTB ---
    const [btbItems] = await db.query(
      "SELECT id_btb_item FROM btb_item WHERE id_POItem = ?",
      [id]
    );
    if (btbItems.length > 0) {
      return res.status(400).json({
        message: "Tidak dapat mengedit item PO yang sudah diproses ke BTB.",
      });
    }

    if (payload.hargaSatuan) payload.hargaSatuan = cleanCurrency(payload.hargaSatuan);
    if (payload.jumlahPO) payload.jumlahPO = cleanCurrency(payload.jumlahPO);
    if (payload.jumlahAsli) payload.jumlahAsli = cleanCurrency(payload.jumlahAsli);

    if (payload.diskonPersen && typeof payload.diskonPersen === "string") {
      if (payload.diskonPersen.includes("+")) {
        payload.diskonPersen = payload.diskonPersen.replace(/,/g, ".");
      } else {
        payload.diskonPersen = parseFloat(payload.diskonPersen.replace(",", ".")) || 0;
      }
    }

    if (payload.diskonRupiah) payload.diskonRupiah = cleanCurrency(payload.diskonRupiah);
    if (payload.ppnPersen) payload.ppnPersen = typeof payload.ppnPersen === "string" ? parseFloat(payload.ppnPersen.replace(",", ".")) : Number(payload.ppnPersen) || 0;
    if (payload.ppnRupiah) payload.ppnRupiah = cleanCurrency(payload.ppnRupiah);
    if (payload.totalPerItem) payload.totalPerItem = cleanCurrency(payload.totalPerItem);

    // namaPembeli ikut di payload, bisa diupdate
    // Filter payload to only valid columns to avoid SQL error
    const validColumns = [
      "id_PO", "id_PRItem", "hargaSatuan", "jumlahPO", "jumlahAsli",
      "diskonPersen", "diskonRupiah", "ppnPersen", "ppnRupiah",
      "totalPerItem", "namaPembeli", "keterangan", "id_satuan", "statusTerima"
    ];

    const fields = Object.keys(payload).filter(key => validColumns.includes(key));

    if (fields.length === 0)
      return res.status(400).json({ message: "No valid data to update" });

    const sql =
      `UPDATE po_item SET ` +
      fields.map((f) => `${f} = ?`).join(", ") +
      ` WHERE id_POItem = ?`;

    // --- Fix: Update PR quantity ---
    // Fetch old data first
    const [[oldItem]] = await db.query(
      "SELECT id_PRItem, jumlahPO FROM po_item WHERE id_POItem = ?",
      [id]
    );

    if (oldItem && payload.jumlahPO !== undefined) {
      const oldQty = Number(oldItem.jumlahPO);
      const newQty = Number(payload.jumlahPO);
      const diff = newQty - oldQty;

      if (diff !== 0 && oldItem.id_PRItem) {
        // Adjust pr_item.jumlah
        // If diff is positive (increased PO), PR qty decreases.
        // If diff is negative (decreased PO), PR qty increases.
        await db.query(
          "UPDATE pr_item SET jumlah = GREATEST(0, jumlah - ?) WHERE id_PRItem = ?",
          [diff, oldItem.id_PRItem]
        );

        // Update PR Status
        const [[prItem]] = await db.query("SELECT id_PR FROM pr_item WHERE id_PRItem = ?", [oldItem.id_PRItem]);
        if (prItem) {
          await updatePRStatus(prItem.id_PR);
        }
      }
    }

    await db.query(sql, [...fields.map((f) => payload[f]), id]);
    // Setelah update, update targetPencapaianPo pada semua BTB terkait PO ini
    // DISABLED: Logic moved to item level (btb_item)
    // const [[poItem]] = await db.query("SELECT id_PO FROM po_item WHERE id_POItem = ?", [id]);
    // if (poItem && poItem.id_PO) {
    //   const [btbs] = await db.query("SELECT id_btb FROM btb WHERE id_po = ?", [poItem.id_PO]);
    //   for (const btb of btbs) {
    //     await updateTargetPencapaianPoByBTB(db, btb.id_btb);
    //   }
    // }
    const [[updated]] = await db.query(
      "SELECT * FROM po_item WHERE id_POItem = ?",
      [id]
    );

    // --- FIX: Update PO Status ---
    const [[poItemRow]] = await db.query("SELECT id_PO FROM po_item WHERE id_POItem = ?", [id]);
    if (poItemRow && poItemRow.id_PO) {
      await updatePOStatus(poItemRow.id_PO);
    }

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
    // Ambil id_PO, id_PRItem, dan jumlahPO sebelum hapus untuk restore PR
    const [[poItemRow]] = await db.query("SELECT id_PO, id_PRItem, jumlahPO FROM po_item WHERE id_POItem = ?", [id]);

    if (poItemRow && poItemRow.id_PRItem) {
      // Restore quantity to PR Item
      await db.query(
        "UPDATE pr_item SET jumlah = jumlah + ? WHERE id_PRItem = ?",
        [poItemRow.jumlahPO, poItemRow.id_PRItem]
      );

      // Update PR status to 'Diproses' if needed (to reopen it if it was finished)
      // FIX: Use centralized updatePRStatus
      const [[prItem]] = await db.query("SELECT id_PR FROM pr_item WHERE id_PRItem = ?", [poItemRow.id_PRItem]);
      if (prItem) {
        await updatePRStatus(prItem.id_PR);
      }
    }

    const [result] = await db.query("DELETE FROM po_item WHERE id_POItem = ?", [
      id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "PO item tidak ditemukan" });

    // Optional: update header status if needed, but we are moving to item level logic
    // if (poItemRow && poItemRow.id_PO) {
    //   await updateStatusTerimaPO(db, poItemRow.id_PO);
    // }

    // If this PO item was linked to a PR item, update the PR status
    if (poItemRow && poItemRow.id_PRItem) {
      const [[prItem]] = await db.query("SELECT id_PR FROM pr_item WHERE id_PRItem = ?", [poItemRow.id_PRItem]);
      if (prItem) {
        await updatePRStatus(prItem.id_PR);
      }
    }

    // --- FIX: Update PO Status ---
    if (poItemRow && poItemRow.id_PO) {
      await updatePOStatus(poItemRow.id_PO);
    }

    res.json({ message: "PO item dihapus" });
  } catch (err) {
    next(err);
  }
});

export default router;
